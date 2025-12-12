
# OT Sentinel AI: Autonomous Industrial Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Enterprise Ready](https://img.shields.io/badge/Status-v3.0%20Agentic-green)](https://github.com/google/genai)
[![AI Engine: Gemini 3 Pro](https://img.shields.io/badge/AI-Gemini%203%20Pro-purple)](https://ai.google.dev/)
[![Architecture: MAS](https://img.shields.io/badge/Arch-Multi--Agent%20System-orange)](https://arxiv.org/abs/2308.08155)

> **"From Reactive SCADA to Proactive Agent Swarms."**

**OT Sentinel AI** is an advanced **Multi-Agent System (MAS)** designed to secure, monitor, and optimize industrial infrastructure. It orchestrates a swarm of specialized AI agents (using Google Gemini 3 Pro) to perform tasks ranging from **Deep Packet Inspection (NIDS)** to **Autonomous Reliability Research**.

---

## 📘 User Manual & Dashboard Guide

### 1. Main Dashboard (OT Landscape)
The **production line is visualized as a horizontal swimlane**, moving from left (Material Handling) to right (Logistics). 
*   **Machine Columns:** Each column represents a physical asset. The header node shows the process step and overall status (OK, WARNING, CRITICAL).
*   **KPI Matrix:** Below each machine, real-time KPIs are stacked:
    *   **OEE (Overall Equipment Effectiveness):** Efficiency score.
    *   **Uptime & Cycle Time:** Availability metrics.
    *   **Network Status:** A tiered signal indicator (Excellent, Good, Fair, Poor) combining Latency and Packet Loss metrics.
    *   **Security (DPI):** "SECURE" or "BLOCKED" indicates if the Edge NIDS has intercepted malicious packets.

### 2. Predictive Maintenance
*   **Scatter Plot:** A fleet-wide view comparing Asset Health vs. Urgency.
*   **Deep Dive:** Select any machine to view MTBF, MTTR, and the **FMEA (Failure Mode & Effects Analysis)** table generated dynamically by Gemini 3 Pro.

### 3. Compliance Reporting
*   **Audit Checklist:** Automated checks against IEC 62443, ISO 27001, DORA, and CISA standards.
*   **Agent Report:** A specialized AI agent can draft a Board-level PDF report, estimating financial risks and remediation budgets.

---

## ✅ Testing Strategy

This project maintains high code quality through a 3-tier testing pyramid:

### 1. Unit Tests (Jest + React Testing Library)
Verifies individual components and pure logic.
*   **Components:** `Dashboard`, `Predictive`, `Planning`, `Compliance` (Render logic, state transitions).
*   **Services:** `edgeService` (Physics engine), `geminiService` (Mocked API responses).
*   **Command:** `npm test`

### 2. Integration Tests
Ensures correct data flow between the Edge Service (Simulated) and the React Frontend.
*   Verifies that `setFaultMode` in the simulator correctly triggers updates in the `Dashboard` and `Planning` views.
*   Verifies the "Agent Orchestrator" state machine transitions (AIO -> AIS -> ATA).

### 3. End-to-End (E2E) Tests (Playwright)
Simulates critical user journeys in a real browser environment.
*   **Journey:** Load Dashboard -> Click Machine -> View Details -> Return.
*   **Command:** `npx playwright test`

---

## 🏗️ Deployment Guide (Per Machine)

To deploy **OT Sentinel** across a real production line, follow this pattern for each asset (e.g., CNC Mill, Robotic Arm):

### Phase 1: Edge Node Provisioning
1.  **Hardware:** Deploy a **Raspberry Pi 5** or **NVIDIA Jetson Nano** at the machine level.
2.  **Connectivity:** Connect via Ethernet to the machine's PLC (Mirror Port) and via Wi-Fi/5G to the factory backbone.
3.  **Environment Variables:**
    ```env
    MACHINE_ID=mill-a-01
    PLANT_ZONE=machining-b
    GEMINI_API_KEY=[Secure Provisioning]
    ```

### Phase 2: Containerization
Deploy the Edge Sentinel container which includes the **Gemini Nano (TFLite)** inference engine and the NIDS packet sniffer.
```bash
docker run -d --net=host --name ot-edge-node \
  -e MACHINE_ID=mill-a-01 \
  -v /var/log/syslog:/syslog \
  ot-sentinel/edge:latest
```

### Phase 3: Uplink Verification
Verify the node is reporting to the Cloud Dashboard:
1.  Check the **Network Status** icon on the Main Dashboard.
2.  Ensure it reads **"Excellent"** (Latency < 30ms).
3.  Test the **DPI Block** mechanism by simulating a Modbus scan.

---

## 🔬 Root Access: AI Research Lab

> **WARNING:** This section is for **Systems Architects** and **Root Administrators** only.

The **AI Research Lab** allows you to interact directly with the **Multi-Agent System (MAS)** that powers the platform's intelligence.

### 1. Agent Swarm Architecture
The system orchestrates specialized agents using the **Agent-to-Agent (A2A)** protocol:

| Agent | Role | Responsibility |
| :--- | :--- | :--- |
| **AIO (Orchestrator)** | Kernel | Manages session context, routes messages, and enforces Human-in-the-Loop (HITL) gates. |
| **AIS (Scientist)** | Research | Uses **Google Search Grounding** to find SOTA algorithms (e.g., "PatchTST") on arXiv/GitHub. |
| **ATA (Tester)** | Validation | Runs backtests against historical sensor data to verify accuracy/latency. |
| **AID (Deployer)** | Ops | Compiles models to TFLite and pushes OTA updates to Edge Nodes. |

### 2. The Research Workflow
To create a new detection model:
1.  **Objective:** Input a goal in the Lab console (e.g., *"Reduce false positives on the Stamping Press vibration sensor"*).
2.  **Research:** AIS will query external databases for relevant techniques.
3.  **Plan:** AIO proposes a testing strategy. **[Approval Required]**
4.  **Test:** ATA executes code in a sandbox and returns a **Radar Chart** of metrics.
5.  **Deploy:** AID pushes the new config to the specific machine ID.

### 3. Implementation Details
*   **Observability:** Click "Show Traces" to view the raw JSON envelopes passing between agents.
*   **Memory:** The AIO uses a simulated Vector DB to recall past successful experiments.
*   **Tooling:** Agents discover tools (Python REPL, Search) dynamically via the **Tool Registry**.

---

## 🚀 Getting Started (Dev Environment)

### Prerequisites
*   Node.js v18+
*   Google Gemini API Key

### Installation
```bash
git clone https://github.com/your-org/ot-sentinel-ai.git
cd ot-sentinel-ai
npm install
```

### Configuration
Create `.env`:
```env
API_KEY=your_gemini_key_here
```

### Run
```bash
npm start
```
Access the dashboard at `http://localhost:3000`.

---

## 🔮 Roadmap & Next Steps

The journey to autonomous manufacturing is just beginning. Here are the planned enhancements for **OT Sentinel v4.0**:

1.  **Real-World Connectivity (OPC UA / MQTT)**
    *   Replace the `simulatedData.ts` playback engine with real drivers for Siemens S7 and Allen-Bradley PLCs.
    *   Integrate **Azure IoT Hub** or **AWS IoT Greengrass** for scalable telemetry ingestion.

2.  **Vision Intelligence (PPE & Safety)**
    *   Deploy **Gemini Pro Vision** to analyze RTSP camera feeds.
    *   Detect safety violations (e.g., missing hard hats) or fire hazards in real-time.

3.  **Voice-Activated Operations Center**
    *   Integrate **Gemini Live API** to enable voice commands for floor managers.
    *   *Example: "Hey Sentinel, which machine caused the bottleneck at 08:00 AM?"*

4.  **3D Digital Twin**
    *   Upgrade the 2D "Swimlane" dashboard to a **Three.js** interactive factory floor.
    *   Visualize temperature gradients and vibration heatmaps directly on the 3D asset models.

5.  **Blockchain Audit Trails**
    *   Hash all "HIL Approved" compliance reports to an immutable ledger (Hyperledger Fabric) to guarantee regulatory trust.

---

**OT Sentinel AI** — *Secure. Smart. Scalable.*
