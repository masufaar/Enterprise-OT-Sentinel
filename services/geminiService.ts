
import { GoogleGenAI, Type } from "@google/genai";
import { Machine, ComplianceItem, FMEAItem } from "../types";
import { MOCK_MAINTENANCE_LOGS } from "./mockData";

/**
 * @file geminiService.ts
 * @description **The Intelligence Layer**: Core service for handling Cloud-based AI tasks.
 * 
 * ARCHITECTURAL CONTEXT:
 * This service represents the "Cloud Brain" in our Hybrid Edge-Cloud architecture.
 * While the "Edge" (services/edgeService.ts) handles high-frequency, low-latency detection using small models,
 * this service uses **Gemini 3 Pro** for:
 * 1. Deep Reasoning: Correlating weeks of logs with current sensor data.
 * 2. Strategic Planning: Simulating production scenarios.
 * 3. Compliance: Generating legal/audit reports with grounding.
 * 
 * MODEL USAGE:
 * - `gemini-3-pro-preview`: Used for complex reasoning, FMEA updates, and Scenario Analysis.
 *   - Configured with `thinkingBudget: 32768` for maximum cognitive depth when required.
 */

// Initialize the Gemini AI client using the secure API key from environment variables.
// SECURITY: process.env.API_KEY is injected at build time/runtime.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a strategic production scenario analysis.
 * 
 * @param {string} scenarioDescription - User-provided text describing the "What-If" scenario.
 * @param {Machine[]} machines - The current real-time state of the entire shop floor.
 * @returns {Promise<string>} - A text-based strategic assessment.
 * 
 * GEMINI 3 PRO STRATEGY:
 * We inject the *entire* shop floor state as a JSON object into the context.
 * This allows the model to "see" the global system state, not just isolated parts,
 * enabling it to identify cascading bottlenecks (e.g., if Machine A speeds up, Machine B jams).
 */
export const generateScenarioAnalysis = async (
  scenarioDescription: string,
  machines: Machine[]
): Promise<string> => {
  try {
    // CONTEXT STRATEGY: 
    // We pass the full raw state of the shop floor (all machines, all sensors) PLUS historical context.
    const shopFloorContext = JSON.stringify(machines, null, 2);
    
    const prompt = `
      Current Shop Floor Telemetry (JSON):
      ${shopFloorContext}

      Historical Maintenance Context:
      ${MOCK_MAINTENANCE_LOGS}
      
      Proposed Production Scenario:
      ${scenarioDescription}
      
      Task:
      Perform a deep strategic analysis acting as a Senior OT Systems Architect.
      1. Cross-reference current machine health with historical failure patterns in the logs.
      2. Simulate the impact of the proposed scenario on "WARNING" and "CRITICAL" machines.
      3. Identify bottleneck risks by correlating Network Latency with the proposed load.
      
      Output:
      A concise strategic assessment (approx 200 words) for the Plant Director, citing specific historical precedents if relevant.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        // Persona adoption helps the model frame the output in the correct domain language.
        systemInstruction: "You are an expert Industrial Systems Architect. You analyze complex systems holistically using historical data.",
        temperature: 0.4, // Lower temperature for more analytical, less creative/random results.
      }
    });

    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Graceful degradation: Return a user-friendly message instead of crashing.
    return "AI Analysis failed to load. Please check API Key configuration.";
  }
};

/**
 * Generates or Refines a compliance audit report based on checks using Google Search for grounding.
 * Supports Human-in-the-Loop (HIL) iterations.
 * 
 * @param {ComplianceItem[]} complianceItems - List of pass/fail/review items.
 * @param {string} [previousDraft] - (Optional) The current report text if we are refining.
 * @param {string} [userFeedback] - (Optional) Instructions from the human user for changes.
 * @returns {Promise<{text: string, sources: string[]}>} - A formal executive summary and sources.
 */
export const generateComplianceReport = async (
  complianceItems: ComplianceItem[],
  previousDraft?: string,
  userFeedback?: string
): Promise<{text: string, sources: string[]}> => {
  try {
    const failures = complianceItems.filter(i => i.status !== 'Pass');
    
    let prompt = "";

    if (previousDraft && userFeedback) {
      // ITERATION MODE: Refine existing draft
      prompt = `
        CONTEXT:
        You are an AI Compliance Auditor working in a loop with a Human Supervisor.
        
        PREVIOUS DRAFT REPORT:
        """
        ${previousDraft}
        """

        HUMAN SUPERVISOR FEEDBACK:
        """
        ${userFeedback}
        """

        TASK:
        Rewrite the report to incorporate the human's feedback. 
        Maintain the structure but update the content as requested.
        Ensure you still include the mandatory sections: Quick Steps, Budget, Risk, Implementation Plan.
        Ensure you address DORA and CISA CPG gaps specifically if mentioned.
      `;
    } else {
      // GENERATION MODE: Create new draft
      prompt = `
        AUDIT DATA (Failures & Gaps):
        ${JSON.stringify(failures, null, 2)}
        
        TASK:
        Act as a Lead OT Compliance Officer preparing a Board of Directors Report.
        
        KEY STANDARDS:
        - IEC 62443 (Industrial Security)
        - ISO 27001 (InfoSec)
        - EU DORA (Digital Operational Resilience Act)
        - CISA CPGs (Cybersecurity Performance Goals)
        
        MANDATORY SECTIONS:
        1. **Executive Board Summary**: High-level overview of the compliance posture. Focus on Business Continuity.
        2. **Quick Steps (Immediate Remediation)**: A list of 3-5 immediate actions to reduce liability today.
        3. **Financial Risk Analysis (Quantified)**: 
           - Estimate financial impact of DORA penalties (e.g., % of turnover).
           - Operational downtime costs based on the gaps.
        4. **Budget Estimate (ROM)**: Provide a rough order-of-magnitude (ROM) cost estimate for remediation (Hardware, Software, Labor).
        5. **Implementation Planning**: A timeline for remediation (Immediate vs 30-day vs 90-day).
        6. **Detailed Gap Analysis**: Technical breakdown of the failures, specifically mentioning DORA Article 6 and CISA Asset Management requirements.
        
        TOOLS:
        Use Google Search to find latest DORA penalty structures and CISA CPG guidelines.
        
        TONE:
        Board-Appropriate, Financially Literate, Risk-Aware. Avoid purely technical jargon; focus on business impact.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Search Tool for Grounding
        systemInstruction: "You are a professional OT Compliance Auditor preparing reports for a Board of Directors. You prioritize financial risk and legal liability.",
      }
    });

    // Extract grounding sources if available
    const sources: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push(chunk.web.uri);
        }
      });
    }

    return {
      text: response.text || "Report generation failed.",
      sources: [...new Set(sources)] // Unique URLs
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "Compliance report generation failed due to API error.", 
      sources: [] 
    };
  }
};

/**
 * Generates a root cause analysis and predictive insight for a specific machine.
 * 
 * @param {Machine} machine - The machine object containing sensors and history.
 * @returns {Promise<string>} - The diagnosis.
 * 
 * GEMINI 3 PRO STRATEGY:
 * Multimodality Simulation: We conceptually separate data streams into "Senses" (Audio, Thermal, Digital).
 * Chain-of-Thought: The prompt explicitly asks for "Reasoning Task" steps: Fusion -> History -> Root Cause.
 */
export const generatePredictiveInsight = async (machine: Machine): Promise<string> => {
  try {
    // MULTIMODALITY & REASONING STRATEGY:
    // We feed distinct "senses" to the model: Acoustic, Physical, Digital, and Power.
    // We also inject Long Context (History).
    
    // Prepare extended sensor data if available
    const powerData = machine.sensors.current ? `Current (Amps): ${JSON.stringify(machine.sensors.current.map(v => v.value))}` : 'No Current Sensor';
    const torqueData = machine.sensors.torque ? `Torque (Nm): ${JSON.stringify(machine.sensors.torque.map(v => v.value))}` : 'No Torque Sensor';
    const pressureData = machine.sensors.pressure ? `Pressure (Bar): ${JSON.stringify(machine.sensors.pressure.map(v => v.value))}` : 'No Pressure Sensor';
    
    const prompt = `
      Machine ID: ${machine.id} (${machine.name})
      Type: ${machine.type}
      Brand/Model: ${machine.brand || 'Unknown'} ${machine.model || ''}
      
      Telemetry Data Streams (Last 20 points):
      - Thermal (Celsius): ${JSON.stringify(machine.sensors.temperature.map(t => t.value))}
      - Vibration RMS (Hz): ${JSON.stringify(machine.sensors.vibration.map(v => v.value))}
      - Audio (dB): ${JSON.stringify(machine.sensors.audioDecibels.map(v => v.value))}
      - Network Latency (ms): ${JSON.stringify(machine.sensors.networkLatency.map(v => v.value))}
      - Power Analysis: ${powerData}
      - Torque Analysis: ${torqueData}
      - Physics/Pressure: ${pressureData}
      
      Historical Maintenance Logs (Context):
      ${MOCK_MAINTENANCE_LOGS}
      
      Reasoning Task:
      1. SENSOR FUSION: Analyze correlations between Power/Torque, Acoustic and Physical Vibration. (e.g. High Torque + Low RPM? High Current + Vib?)
      2. HISTORY CHECK: Check the historical logs for this machine ID. Has this happened before?
      3. ROOT CAUSE: Diagnose the fault (e.g., Bearing failure, Cavitation, Motor Winding Short, Sensor drift).
      
      Output Format:
      - OBSERVATION: [What the raw data shows]
      - HISTORICAL PATTERN: [Relevance of past logs]
      - PREDICTION: [RUL and Root Cause]
    `;

     const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        // Enforcing structured thinking via system instruction
        systemInstruction: "You are a Predictive Maintenance AI. You always break down your thinking into Observation, Historical Pattern, and Prediction.",
      }
    });
    
    return response.text || "Prediction unavailable.";
  } catch (error) {
     return "AI Prediction unavailable.";
  }
}

/**
 * Generates a dynamic FMEA (Failure Mode and Effects Analysis) table based on real-time data.
 * Uses Gemini 3 Pro with Thinking Mode for deep reasoning about potential risks.
 */
export const generateDynamicFMEA = async (machine: Machine, currentFmea: FMEAItem[]): Promise<FMEAItem[] | null> => {
  try {
    const prompt = `
      Analyze the current sensor data and historical logs for ${machine.name} (ID: ${machine.id}).
      
      CURRENT TELEMETRY:
      - Temp: ${machine.sensors.temperature.slice(-1)[0]?.value} C
      - Vibration: ${machine.sensors.vibration.slice(-1)[0]?.value} Hz
      - Audio: ${machine.sensors.audioDecibels.slice(-1)[0]?.value} dB
      - Latency: ${machine.sensors.networkLatency.slice(-1)[0]?.value} ms
      
      EXISTING FMEA:
      ${JSON.stringify(currentFmea)}
      
      TASK:
      Update the FMEA table. 
      1. If a new risk is detected (e.g., High Latency suggests Cyber Risk), add a new item.
      2. If current sensors show high stress (e.g. High Vib), increase Severity/Occurrence scores for relevant items.
      3. Recalculate RPN (Severity * Occurrence * Detection).
      
      Return the FULL updated list of 4-6 items in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // High budget for deep risk assessment
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              component: { type: Type.STRING },
              failureMode: { type: Type.STRING },
              effect: { type: Type.STRING },
              severity: { type: Type.NUMBER },
              occurrence: { type: Type.NUMBER },
              detection: { type: Type.NUMBER },
              rpn: { type: Type.NUMBER },
              recommendedAction: { type: Type.STRING },
            },
            required: ["component", "failureMode", "effect", "severity", "occurrence", "detection", "rpn", "recommendedAction"],
          },
        },
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FMEAItem[];
    }
    return null;

  } catch (error) {
    console.error("Gemini FMEA Error:", error);
    return null;
  }
}
