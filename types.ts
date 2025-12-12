
export enum MachineStatus {
  OK = 'OK',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface SensorDataPoint {
  timestamp: string;
  value: number;
}

export interface NetworkTrafficPoint {
  timestamp: string;
  throughput: number; // KB/s
  protocol: string;   // e.g., 'Modbus', 'S7Comm'
  command: string;    // e.g., 'Read Holding Registers'
  isMalicious: boolean;
  sourceIp: string;
}

export interface OTSensorData {
  // Standard Base Sensors
  temperature: SensorDataPoint[];
  vibration: SensorDataPoint[]; // Overall RMS Vibration
  networkLatency: SensorDataPoint[];
  audioDecibels: SensorDataPoint[];
  packetLoss: number; // percentage
  protocolAnomalies: number; // count

  // Network DPI Data (New)
  networkTraffic: NetworkTrafficPoint[];

  // Detailed Vibration Analysis
  vibrationVelocity?: SensorDataPoint[];     // mm/s
  vibrationAcceleration?: SensorDataPoint[]; // g
  vibrationDisplacement?: SensorDataPoint[]; // µm

  // Motor & Power
  current?: SensorDataPoint[]; // Amps
  torque?: SensorDataPoint[];  // Nm
  
  // Physics & Environment
  pressure?: SensorDataPoint[]; // bar/psi
  humidity?: SensorDataPoint[]; // % RH
}

export interface MachineKPIs {
  cycleTime: number;      // Seconds
  throughput: number;     // Units/Hour
  uptime: number;         // %
  oee: number;            // Overall Equipment Effectiveness %
  defectRate: number;     // %
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  processStep: number; // To order the production line logically
  status: MachineStatus;
  healthScore: number; // 0-100
  lastMaintenance: string;
  sensors: OTSensorData;
  kpis: MachineKPIs;   // New KPI Data
  model?: string;
  brand?: string;
  
  // Live Streaming Fields
  isStreaming?: boolean;
  latestAudioUrl?: string;
  latestEdgeDiagnosis?: string; // e.g., 'NETWORK_DDOS', 'MECHANICAL_WEAR'
}

export interface PredictionModel {
  machineId: string;
  predictedFailureDate: string;
  confidence: number;
  rootCause: string;
  recommendedAction: string;
}

export interface ComplianceItem {
  id: string;
  standard: string; // e.g., "IEC 62443"
  status: 'Pass' | 'Fail' | 'Review';
  completionPercentage: number; // 0-100
  details: string;
  lastChecked: string;
  missingRequirements?: string[]; // Specific gaps/checklist
}

export interface ComplianceReportDraft {
  quickSteps: string[];
  budgetEstimate: string;
  riskQuantification: string;
  implementationPlan: string;
  fullText: string;
}

export type AgentProposalType = 'GOOGLE_SEARCH' | 'DATA_ANALYSIS';

export interface AgentProposal {
  id: string;
  type: AgentProposalType;
  description: string;
  justification: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  PLANNING = 'PLANNING',
  PREDICTIVE = 'PREDICTIVE',
  COMPLIANCE = 'COMPLIANCE',
  RESEARCH_LAB = 'RESEARCH_LAB', // New View
  MACHINE_DETAIL = 'MACHINE_DETAIL',
}

// --- EDGE COMPUTING TYPES ---

export type EdgeFaultType = 'NONE' | 'IT_ATTACK' | 'OT_ATTACK' | 'MECHANICAL_FAIL';

export interface GeminiNanoResult {
  anomalyScore: number; // 0.0 to 1.0
  inferenceTimeMs: number;
  detectedLabel: 'NORMAL' | 'MECHANICAL_WEAR' | 'THERMAL_RUNAWAY' | 'NETWORK_DDOS' | 'CYBER_KINETIC' | 'UNKNOWN';
  specificAlerts?: string[]; // Detailed breakdown (e.g., "Uneven Vibration", "Pressure Drop")
}

export interface EdgeHeartbeat {
  type: 'HEARTBEAT';
  machineId: string;
  timestamp: string;
  deviceStatus: 'ONLINE' | 'OFFLINE';
  cpuLoad: number;
  memoryUsage: number;
  averageTemp: number; // Summary stat only
}

export interface EdgeAlert {
  type: 'ALERT';
  machineId: string;
  timestamp: string;
  nanoAnalysis: GeminiNanoResult;
  rawTelemetry: Partial<OTSensorData>; // Full high-res dump
  fileAttachments: {
    audioClip?: string;
    pcapDump?: string;
    systemLogs?: string;
  };
}

// --- PREDICTIVE ANALYTICS TYPES ---

export interface FMEAItem {
  component: string;
  failureMode: string;
  effect: string;
  severity: number; // 1-10
  occurrence: number; // 1-10
  detection: number; // 1-10
  rpn: number; // Risk Priority Number = S * O * D
  recommendedAction: string;
}

export interface ReliabilityMetrics {
  mtbfHours: number; // Mean Time Between Failures
  mttrHours: number; // Mean Time To Repair
  downtimeCostPerHr: number;
  ytdDowntimeCost: number;
  alertPrecision: number; // % of true positives
}

export interface SensorThreshold {
  sensorName: string;
  unit: string;
  min: number;
  max: number;
  warningLow?: number;
  warningHigh: number;
  criticalHigh: number;
  currentValue: number;
}

// --- AGENT ORCHESTRATION TYPES (ENHANCED) ---

export type AgentRole = 'AIO' | 'AIS' | 'AIP' | 'ATA' | 'AID';

// A2A Protocol: Standardized Message Envelope
export interface A2AMessage {
  id: string;
  from: AgentRole;
  to: AgentRole;
  type: 'REQUEST' | 'RESPONSE' | 'BROADCAST' | 'ERROR';
  payload: any;
  timestamp: string;
}

// Traceability for Observability
export interface AgentTrace {
  stepId: string;
  agent: AgentRole;
  action: string;
  input: string;
  output: string;
  latencyMs: number;
  tokenUsage?: number;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING_HIL';
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  requiresHIL: boolean; // Does this message require Human in Loop approval?
  approved?: boolean;
  metadata?: {
    researchUrls?: string[];
    notebookUrl?: string;
    testMetrics?: ModelTestResult;
    deploymentVersion?: string;
    traceId?: string; // Link to observability trace
  };
}

export interface ModelTestResult {
  algorithmName: string;
  taskType: 'FORECASTING' | 'ANOMALY_DETECTION' | 'CLASSIFICATION' | 'PATTERN_RECOG';
  accuracy: number;     // 0-1
  precision: number;    // 0-1
  recall: number;       // 0-1
  aucRoc: number;       // 0-1
  inferenceSpeedMs: number;
  trainingTimeSec: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  status: 'PASSED' | 'FAILED' | 'WARNING';
}

export interface ResearchSession {
  id: string;
  objective: string;
  status: 'RESEARCHING' | 'PLANNING' | 'TESTING' | 'VALIDATING' | 'DEPLOYED';
  messages: AgentMessage[];
  currentNotebook?: string; // URL or File Name
  testContext?: {
    machineIds: string[];
    dataSources: ('AUDIO' | 'SENSOR' | 'NETWORK')[];
    historyDays: number;
  };
  // Context Management
  contextUsageTokenEstimate: number;
  longTermMemoryHits: string[]; // IDs of relevant knowledge retrieved
}
