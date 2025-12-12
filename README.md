
# Enterprise OT Sentinel: Autonomous Industrial Intelligence

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Enterprise Ready](https://img.shields.io/badge/Status-v3.0%20Agentic-green)](https://github.com/google/genai)
[![AI Engine: Gemini 3 Pro](https://img.shields.io/badge/AI-Gemini%203%20Pro-purple)](https://ai.google.dev/)
[![Architecture: MAS](https://img.shields.io/badge/Arch-Multi--Agent%20System-orange)](https://arxiv.org/abs/2308.08155)
[![Edge: Gemini Nano](https://img.shields.io/badge/Edge-Raspberry%20Pi%205-red)](https://www.raspberrypi.com/)

> **"From Reactive SCADA to Proactive Agent Swarms."**

**Enterprise OT Sentinel** is a top-management monitoring, awareness, and alerting tool designed to provide immediate visibility into unusual situations within OT Networks and Machine usage. Beyond simple monitoring, it integrates **Predictive Maintenance**, **Scenario Planning**, and **Automated Compliance**, powered by a robust **Multi-Agent System (MAS)**.

---

## 🏭 The OT Landscape & Monitoring

The system visualizes an end-to-end realistic production line. The main dashboard provides a "Traffic Light" status model for each asset. If orange or red lights appear, a drill-down capability displays real-time protocols, sensor data, and audio analysis to understand the issue.

### Production Line Assets
1.  **Drilling Machines**
2.  **CNC Milling Unit A**
3.  **Grinding Machines**
4.  **Stamping Machines**
5.  **Turning Machines**
6.  **Material Handling Equipment**
7.  **Packaging Equipment**
8.  **Hydraulic Press B**
9.  **Robotic Arm**
10. **Conveyor System**
11. **Laser Cutter**
12. **Injection Molding**

### Real-Time Sensor Telemetry
We monitor a comprehensive suite of industrial physics:
*   **Vibration Analysis:** Velocity, Acceleration, and Displacement.
*   **Thermal:** Industrial Temperature sensors.
*   **Power:** Current (Amps), Motor load, and Torque sensors.
*   **Environment:** Pressure, Humidity, and General Environmental sensors.
*   **Acoustics:** Real-time Audio patterns (dB and Spectrograms).

### Key Performance Indicators (KPIs)
*   **Status:** Traffic Light (OK/WARN/CRIT).
*   **OEE:** Overall Equipment Effectiveness.
*   **Uptime:** Machine Availability %.
*   **Cycle Time:** Operational Speed.
*   **Throughput:** Unit Output/Hour.
*   **Defect Rate:** Quality Assurance %.

---

## 🖥️ User Interface & Modules

1.  **OT Landscape Dashboard:** The primary "Swimlane" view of the shop floor with immediate visual status indicators.
2.  **Scenario Planning (What-If):** A simulation engine to test production plan variations, machine breakdowns, or cyberattack scenarios (IT vs. OT attacks).
3.  **Predictive Maintenance:** AI-driven forecasting of machine health and Remaining Useful Life (RUL).
4.  **Compliance Reporting:** Instant status reporting against standards (IEC 62443, ISO 27001, EU DORA, CISA CPGs).

---

## 🏗️ Architecture & Deployment

**Security First:** Designed for on-premises cloud or local implementation with End-to-End Encryption. Access is strictly controlled via Role-Based Access Control (RBAC) for top management.

**Edge Intelligence (Plug & Play):**
*   **Hardware:** Raspberry Pi 5 devices deployed on each machine.
*   **Local AI:** **Gemini Nano** runs locally on the Pi 5 to process Audio, Sensor Data, and OT Network Packets (PCAP) in real-time.
*   **Privacy:** Only verified anomalies and metadata are sent to the central application; raw sensitive streams remain local unless flagged.

---

## 🧠 The Core: AI Agentic Framework

The true power of Enterprise OT Sentinel lies in its **AI Research Lab**. This component automatizes the end-to-end process of searching for, testing, and deploying State-of-the-Art (SOTA) AI algorithms.

### 🤖 The Agent Swarm (Roles)

We utilize **Gemini 3 Pro** to power a team of specialized agents:

1.  **AIO (AI Orchestrator):** The Kernel and Judge. It manages the entire process sequence, acts as the interface for the Human-in-the-Loop, and maintains session context.
2.  **AIS (AI Scientist/Search):** The Researcher. Scours arXiv, GitHub, and Google Research for the latest algorithms (Forecasting, Pattern Recognition, Audio Analysis).
3.  **AIP (AI Planner):** The Strategist. Defines tasks, breakdown structures, and dependencies.
4.  **ATA (AI Tester):** The Validator. Implements the algorithm in a test environment, generates baseline data, and runs testing suites (e.g., OWASP AI Testing Guide).
5.  **AID (AI Deployer):** The Ops. Manages the rollout of validated models to the production Edge Nodes.

### 🛡️ Human-in-the-Loop (HIL/HITL) Validation

Every critical state transition requires human approval. The AI proposes, the Human validates.
*   **Search Phase:** AIO presents findings -> **HIL Approval** -> Planning.
*   **Test Phase:** ATA presents results/metrics -> **HIL Approval** -> Deployment.
*   **Deploy Phase:** AID prepares config -> **HIL Approval** -> OTA Update.

### 🔄 The Research Workflow (Example)

1.  **Trigger:** AIO initiates a routine check or receives a specific request (e.g., "Improve bearing fault detection").
2.  **Research:** **AIS** searches for the latest SOTA algorithms (e.g., "PatchTST for Time-Series").
3.  **Validation:** AIO presents findings to HIL.
4.  **Planning:** **AIP** defines the roadmap.
5.  **Implementation:** **ATA** retrieves the code (via MCP Tooling) and sets up a test bench.
6.  **Simulation:** **ATA** runs the model against historical data + generated fault scenarios.
7.  **Review:** AIO compares new results vs. baseline. Presents to HIL.
8.  **Deployment:** **AID** compiles the model (e.g., to TFLite for Edge) and pushes to the Raspberry Pi grid.

### 🧩 Technical Pillars

*   **Memory Management:**
    *   **Sessions:** Container for immediate conversation history/short-term context.
    *   **Knowledge Graph:** Long-term persistence for storing successful experiments and learned patterns.
*   **Observability (The "Holistic Evaluation"):**
    *   **Traces:** The narrative of the agent's thought process (Chain-of-Thought).
    *   **Logs:** The diary of system events.
    *   **Metrics:** Latency, Token Usage, and Accuracy scores used for **LLM-as-a-Judge** evaluation.
*   **Protocols:**
    *   **MCP (Model Context Protocol):** Standardized way for agents to discover tools (Python REPL, Search, Databases).
    *   **A2A (Agent-to-Agent):** Decoupled communication protocol allowing agents to send structured Requests and Responses.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v20+
*   Google Gemini API Key (Paid Tier recommended for Gemini 3 Pro)

### Installation

```bash
git clone https://github.com/masufaar/enterprise-ot-sentinel.git
cd enterprise-ot-sentinel/
docker build -t enterprisesentinel .
```

### Configuration
Create a `.env` file in the root:
```env
API_KEY=your_gemini_key_here
```

### Run Application
```bash
docker run -it --rm \
  --env-file .env \
  -p 5173:5173 \
  enterprisesentinel
```

Access the dashboard at `http://localhost:5173`.

---

## 🧪 Testing

We follow a strict "Safety First" testing policy:
*   **Unit Tests:** `npm test` (Jest)
*   **E2E Tests:** `npm run test:e2e` (Playwright)

---

**Enterprise OT Sentinel** — *Secure. Smart. Agentic.*
