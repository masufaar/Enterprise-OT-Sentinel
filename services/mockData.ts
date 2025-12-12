
import { Machine, MachineStatus, FMEAItem, ReliabilityMetrics, SensorThreshold, NetworkTrafficPoint } from '../types';

/**
 * Helper to generate time series data.
 */
const generateTimeSeries = (points: number, min: number, max: number) => {
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Number((Math.random() * (max - min) + min).toFixed(2)),
  }));
};

/**
 * ATTACK PATTERN GENERATOR
 * Helps simulate different types of cyber threats for the NIDS visualization.
 */
type AttackPattern = 'NONE' | 'RANDOM_PROBE' | 'COORDINATED_RAMP' | 'BURST_DDOS';

const generateNetworkTraffic = (
  points: number, 
  protocol: 'Modbus TCP' | 'EtherNet/IP' | 'S7Comm' | 'DNP3',
  pattern: AttackPattern = 'NONE'
): NetworkTrafficPoint[] => {
  
  const commandSets: Record<string, string[]> = {
    'Modbus TCP': ['Read Holding Reg', 'Read Input Reg', 'Write Single Coil', 'Read Discrete Inputs'],
    'EtherNet/IP': ['CIP Read Data', 'CIP Write Data', 'List Identity', 'Get Attribute Single'],
    'S7Comm': ['Read Var', 'Write Var', 'Job Request', 'UserData'],
    'DNP3': ['Read', 'Select', 'Operate', 'Direct Operate']
  };

  const maliciousCommands: Record<string, string[]> = {
    'Modbus TCP': ['Write Multiple Reg (Broadcast)', 'Restart Diagnostics (0x08)', 'Force Coil (0x05)'],
    'EtherNet/IP': ['CIP Force Output', 'CIP Remote Reset', 'PLC Stop'],
    'S7Comm': ['Stop CPU', 'Delete Block', 'Forced Write Variable'],
    'DNP3': ['Cold Restart', 'Freeze Operations', 'Disable Unsolicited']
  };

  const commands = commandSets[protocol];
  const attacks = maliciousCommands[protocol];

  return Array.from({ length: points }, (_, i) => {
    let isMalicious = false;
    let throughput = Number((Math.random() * 20 + 10).toFixed(2)); // Base traffic

    // ATTACK PATTERN LOGIC
    if (pattern === 'RANDOM_PROBE') {
      // Occasional random packets (10% chance)
      isMalicious = Math.random() > 0.90;
    } 
    else if (pattern === 'COORDINATED_RAMP') {
      // Ramping up towards the present (higher index = more recent)
      // The last 30% of data points have exponentially increasing risk
      const progress = i / points; 
      if (progress > 0.6) {
        isMalicious = Math.random() > (1 - Math.pow(progress, 3)); // Exponential increase
        throughput += (progress * 50); // Traffic volume also ramps up
      }
    }
    else if (pattern === 'BURST_DDOS') {
      // Concentrated burst in the middle
      const middle = Math.floor(points / 2);
      if (i > middle - 3 && i < middle + 3) {
        isMalicious = true;
        throughput = 200 + Math.random() * 50; // Huge spike
      }
    }

    // Pick command
    const command = isMalicious 
       ? attacks[Math.floor(Math.random() * attacks.length)]
       : commands[Math.floor(Math.random() * commands.length)];

    return {
      timestamp: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      throughput: throughput,
      protocol: protocol,
      command: command,
      isMalicious: isMalicious,
      sourceIp: isMalicious ? `10.10.99.${100+i} (Bot)` : `192.168.1.${100 + (i % 5)}`
    };
  });
};

// SIMULATED LONG CONTEXT: Historical logs
export const MOCK_MAINTENANCE_LOGS = `
[2023-01-10] Mill-A: Replaced spindle bearings. Technician noted slight misalignment in axis Y.
[2023-02-15] Press-B: Oil pressure fluctuation detected. Filter replaced. Sensor A-12 calibrated.
[2023-03-20] Robot-Arm: Firmware update v4.5 applied. Latency spike resolved.
[2023-04-05] Mill-A: Vibration alert. Tightened mounting bolts.
[2023-05-12] Conv-Main: Belt tension adjusted. Motor driver updated.
[2023-06-18] Laser-P: Lens cleaned. Focus aligned.
[2023-07-22] Robot-Arm: Servo overload on Axis 3. Reduced max velocity by 5%.
[2023-08-10] Laser-P: Networking module replaced due to packet drops.
[2023-09-01] Press-B: Seal kit replacement. Pressure normalized.
[2023-10-15] Mill-A: Routine scheduled maintenance. Lubrication topped up.
[2023-11-05] Mold-X: Heater band replaced. PID controller retuned.
[2023-11-20] Robot-Arm: Unexpected halt. Investigating potential packet loss.
[2023-12-01] Conv-Main: Roller bearing inspection. All OK.
[2024-01-05] Drill-D1: High current draw on motor start. Capacitor bank checked.
[2024-01-12] Stamp-S1: Impact noise increased. Die alignment verified.
`;

/**
 * FMEA DATA FOR AGV-01
 * Failure Mode and Effects Analysis
 */
export const AGV_FMEA_DATA: FMEAItem[] = [
  {
    component: 'Drive Motor A',
    failureMode: 'Bearing Seizure',
    effect: 'AGV Immobilization / Line Stop',
    severity: 9, // Critical impact
    occurrence: 3, // Occasional
    detection: 8, // High detection (Vib sensors)
    rpn: 216,
    recommendedAction: 'Monitor RMS Vibration > 5mm/s. Auto-schedule lube.'
  },
  {
    component: 'LiDAR Guidance',
    failureMode: 'Sensor Drift / Dirty Lens',
    effect: 'Collision Risk / Safety Stop',
    severity: 10, // Safety hazard
    occurrence: 4, 
    detection: 6,
    rpn: 240,
    recommendedAction: 'Weekly lens cleaning protocol. Implement redundant vision check.'
  },
  {
    component: 'Wi-Fi Module (5G)',
    failureMode: 'Signal Interference / DDoS',
    effect: 'Loss of Fleet Control',
    severity: 7,
    occurrence: 5,
    detection: 4, // Harder to distinguish interference vs attack without AI
    rpn: 140,
    recommendedAction: 'Enable Edge AI Network monitoring. Implement frequency hopping.'
  },
  {
    component: 'Lithium Battery',
    failureMode: 'Thermal Runaway',
    effect: 'Fire Hazard / Asset Loss',
    severity: 10,
    occurrence: 1, // Rare
    detection: 10, // BMS monitors constantly
    rpn: 100,
    recommendedAction: 'Auto-shutdown if Temp > 60C. Replace cells every 3 years.'
  }
];

/**
 * RELIABILITY METRICS FOR AGV-01
 */
export const AGV_RELIABILITY_METRICS: ReliabilityMetrics = {
  mtbfHours: 4850,
  mttrHours: 2.5,
  downtimeCostPerHr: 12500, // Expensive because it stops material flow
  ytdDowntimeCost: 31250,
  alertPrecision: 94.2 // High precision due to Gemini Nano
};

/**
 * RELIABILITY METRICS GENERATOR
 * Returns deterministic metrics for any machine ID.
 */
export const getReliabilityMetrics = (machineId: string): ReliabilityMetrics => {
  // Return static data for the demo unit
  if (machineId === 'agv-01') return AGV_RELIABILITY_METRICS;
  
  // Deterministic generation based on ID hash
  let hash = 0;
  for (let i = 0; i < machineId.length; i++) {
    hash = machineId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const seed = Math.abs(hash);
  
  // Generate realistic industrial metrics
  return {
    mtbfHours: 1500 + (seed % 4000), // 1500 - 5500 hours
    mttrHours: Number((1.5 + (seed % 60) / 10).toFixed(1)), // 1.5 - 7.5 hours
    downtimeCostPerHr: 2000 + (seed % 18000), // $2k - $20k
    ytdDowntimeCost: 10000 + (seed % 90000), // $10k - $100k
    alertPrecision: Number((88 + (seed % 110) / 10).toFixed(1)) // 88.0% - 99.0%
  };
};

/**
 * THRESHOLD CONFIGURATION FOR AGV-01
 */
export const AGV_THRESHOLDS: SensorThreshold[] = [
  {
    sensorName: 'Vibration (RMS)',
    unit: 'mm/s',
    min: 0,
    max: 10,
    warningHigh: 5,
    criticalHigh: 8,
    currentValue: 2.5
  },
  {
    sensorName: 'Motor Temp',
    unit: '°C',
    min: 0,
    max: 120,
    warningHigh: 75,
    criticalHigh: 95,
    currentValue: 45.2
  },
  {
    sensorName: 'Network Latency',
    unit: 'ms',
    min: 0,
    max: 1000,
    warningHigh: 150,
    criticalHigh: 400,
    currentValue: 25
  },
  {
    sensorName: 'Battery Voltage',
    unit: 'V',
    min: 40,
    max: 54,
    warningLow: 44, // Low battery warning
    warningHigh: 54,
    criticalHigh: 55,
    currentValue: 49.8
  }
];

/**
 * PRODUCTION LINE DEFINITION
 * Logical Order: Material Handling -> Turning -> Drilling -> Milling -> Grinding -> Stamping -> Laser -> Press -> Molding -> Robotics -> Packaging -> Logistics
 */
export const MOCK_MACHINES: Machine[] = [
  // 1. MATERIAL HANDLING (DNP3 for Telemetry)
  {
    id: 'agv-01',
    name: 'AGV Material Handler',
    type: 'Material Handling',
    location: 'Receiving Dock',
    processStep: 1,
    status: MachineStatus.OK,
    healthScore: 96,
    lastMaintenance: '2023-12-20',
    kpis: {
      cycleTime: 120, throughput: 30, uptime: 99.5, oee: 92, defectRate: 0.05
    },
    // INITIAL STATE ALIGNED WITH NORMAL DATASET
    sensors: {
      temperature: generateTimeSeries(20, 44, 46), // Aligned with ~45C
      vibration: generateTimeSeries(20, 2, 3),    // Aligned with ~2.5Hz
      vibrationVelocity: generateTimeSeries(20, 0.5, 1.2), 
      current: generateTimeSeries(20, 10, 15), 
      networkLatency: generateTimeSeries(20, 10, 15), // Aligned with ~12ms
      audioDecibels: generateTimeSeries(20, 58, 62), // Aligned with ~60dB
      packetLoss: 0,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'DNP3', 'NONE'),
    },
  },
  // 2. TURNING (Lathe) - S7Comm (Siemens)
  {
    id: 'lathe-01',
    name: 'Precision Turning Center',
    type: 'Turning Machine',
    location: 'Machining Zone A',
    processStep: 2,
    status: MachineStatus.OK,
    healthScore: 92,
    lastMaintenance: '2023-11-15',
    kpis: {
      cycleTime: 45, throughput: 80, uptime: 98.2, oee: 89, defectRate: 0.2
    },
    sensors: {
      temperature: generateTimeSeries(20, 50, 65),
      vibration: generateTimeSeries(20, 10, 15),
      vibrationVelocity: generateTimeSeries(20, 2, 4),
      torque: generateTimeSeries(20, 40, 55), // Spindle Torque
      current: generateTimeSeries(20, 20, 30),
      networkLatency: generateTimeSeries(20, 5, 10),
      audioDecibels: generateTimeSeries(20, 75, 82),
      packetLoss: 0.0,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'S7Comm', 'NONE'),
    },
  },
  // 3. DRILLING - Modbus
  {
    id: 'drill-d1',
    name: 'Multi-Axis Drilling Stn',
    type: 'Drilling Machine',
    location: 'Machining Zone A',
    processStep: 3,
    status: MachineStatus.WARNING,
    healthScore: 78,
    lastMaintenance: '2024-01-05',
    kpis: {
      cycleTime: 30, throughput: 110, uptime: 85.0, oee: 72, defectRate: 1.5
    },
    sensors: {
      temperature: generateTimeSeries(20, 60, 75),
      vibration: generateTimeSeries(20, 25, 35), // High vibration
      vibrationAcceleration: generateTimeSeries(20, 1.5, 2.5), // High G-force shocks
      current: generateTimeSeries(20, 45, 60), // High current (dull bit?)
      networkLatency: generateTimeSeries(20, 5, 8),
      audioDecibels: generateTimeSeries(20, 85, 95), // Loud
      packetLoss: 0.2,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'Modbus TCP', 'RANDOM_PROBE'), // Occasional scans
    },
  },
  // 4. MILLING (Existing) - S7Comm (Siemens)
  {
    id: 'mill-a',
    name: 'CNC Milling Unit A',
    type: 'CNC Milling',
    location: 'Machining Zone B',
    processStep: 4,
    status: MachineStatus.OK,
    healthScore: 94,
    lastMaintenance: '2023-10-15',
    kpis: {
      cycleTime: 180, throughput: 20, uptime: 97.5, oee: 94, defectRate: 0.1
    },
    sensors: {
      temperature: generateTimeSeries(20, 60, 75),
      vibration: generateTimeSeries(20, 10, 20),
      vibrationDisplacement: generateTimeSeries(20, 5, 10), // Precision check
      torque: generateTimeSeries(20, 30, 45),
      networkLatency: generateTimeSeries(20, 5, 15),
      audioDecibels: generateTimeSeries(20, 70, 80),
      packetLoss: 0.01,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'S7Comm', 'NONE'),
    },
  },
  // 5. GRINDING - Modbus
  {
    id: 'grind-pro',
    name: 'Surface Grinder Pro',
    type: 'Grinding Machine',
    location: 'Finishing Zone',
    processStep: 5,
    status: MachineStatus.OK,
    healthScore: 98,
    lastMaintenance: '2023-12-10',
    kpis: {
      cycleTime: 60, throughput: 60, uptime: 99.0, oee: 96, defectRate: 0.02
    },
    sensors: {
      temperature: generateTimeSeries(20, 40, 50),
      vibration: generateTimeSeries(20, 2, 5),
      vibrationDisplacement: generateTimeSeries(20, 1, 3), // Very low tolerance
      current: generateTimeSeries(20, 15, 20),
      humidity: generateTimeSeries(20, 45, 50), // Environmental check
      networkLatency: generateTimeSeries(20, 5, 10),
      audioDecibels: generateTimeSeries(20, 80, 85), // High pitch
      packetLoss: 0.0,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'Modbus TCP', 'NONE'),
    },
  },
  // 6. STAMPING - EtherNet/IP (Rockwell)
  {
    id: 'stamp-s1',
    name: 'Heavy Stamping Press',
    type: 'Stamping Machine',
    location: 'Forming Zone',
    processStep: 6,
    status: MachineStatus.CRITICAL,
    healthScore: 65,
    lastMaintenance: '2023-08-20',
    kpis: {
      cycleTime: 15, throughput: 200, uptime: 60.5, oee: 45, defectRate: 5.8
    },
    sensors: {
      temperature: generateTimeSeries(20, 70, 90),
      vibration: generateTimeSeries(20, 50, 80),
      vibrationAcceleration: generateTimeSeries(20, 5, 8), // Heavy shocks
      pressure: generateTimeSeries(20, 180, 220), // Hydraulic/Pneumatic pressure
      current: generateTimeSeries(20, 80, 110),
      networkLatency: generateTimeSeries(20, 10, 20),
      audioDecibels: generateTimeSeries(20, 95, 110), // Very loud
      packetLoss: 2.5,
      protocolAnomalies: 5,
      networkTraffic: generateNetworkTraffic(20, 'EtherNet/IP', 'BURST_DDOS'), // Massive spike in middle
    },
  },
  // 7. LASER CUTTER - EtherNet/IP
  {
    id: 'laser-p',
    name: 'Laser Cutter Precision',
    type: 'Laser Cutter',
    location: 'Cutting Zone',
    processStep: 7,
    status: MachineStatus.WARNING,
    healthScore: 72,
    lastMaintenance: '2023-08-10',
    kpis: {
      cycleTime: 40, throughput: 90, uptime: 88.0, oee: 75, defectRate: 1.2
    },
    sensors: {
      temperature: generateTimeSeries(20, 70, 85),
      vibration: generateTimeSeries(20, 15, 25),
      current: generateTimeSeries(20, 40, 45), // Laser source draw
      humidity: generateTimeSeries(20, 55, 65), // Lens sensitive to humidity
      networkLatency: generateTimeSeries(20, 50, 80),
      audioDecibels: generateTimeSeries(20, 65, 75),
      packetLoss: 1.2,
      protocolAnomalies: 3,
      networkTraffic: generateNetworkTraffic(20, 'EtherNet/IP', 'COORDINATED_RAMP'), // Growing attack
    },
  },
  // 8. HYDRAULIC PRESS - S7Comm
  {
    id: 'press-b',
    name: 'Hydraulic Press B',
    type: 'Hydraulic Press',
    location: 'Forming Zone',
    processStep: 8,
    status: MachineStatus.OK,
    healthScore: 88,
    lastMaintenance: '2023-09-01',
    kpis: {
      cycleTime: 25, throughput: 140, uptime: 95.0, oee: 88, defectRate: 0.5
    },
    sensors: {
      temperature: generateTimeSeries(20, 80, 95),
      vibration: generateTimeSeries(20, 30, 45),
      pressure: generateTimeSeries(20, 240, 250), // Bar
      vibrationDisplacement: generateTimeSeries(20, 10, 20),
      networkLatency: generateTimeSeries(20, 10, 25),
      audioDecibels: generateTimeSeries(20, 85, 92),
      packetLoss: 0.1,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'S7Comm', 'NONE'),
    },
  },
  // 9. INJECTION MOLDING - Modbus
  {
    id: 'mold-x',
    name: 'Injection Molder X',
    type: 'Injection Molding',
    location: 'Plastics Zone',
    processStep: 9,
    status: MachineStatus.OK,
    healthScore: 91,
    lastMaintenance: '2023-11-05',
    kpis: {
      cycleTime: 50, throughput: 70, uptime: 96.0, oee: 90, defectRate: 0.8
    },
    sensors: {
      temperature: generateTimeSeries(20, 150, 160), // Melt temp
      pressure: generateTimeSeries(20, 100, 120), // Injection pressure
      vibration: generateTimeSeries(20, 10, 15),
      torque: generateTimeSeries(20, 60, 70), // Extruder screw torque
      networkLatency: generateTimeSeries(20, 10, 20),
      audioDecibels: generateTimeSeries(20, 75, 80),
      packetLoss: 0.02,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'Modbus TCP', 'NONE'),
    },
  },
  // 10. ROBOTIC ARM - EtherNet/IP
  {
    id: 'robot-arm',
    name: 'Robotic Arm Assembly',
    type: 'Robotic Arm',
    location: 'Assembly Zone',
    processStep: 10,
    status: MachineStatus.CRITICAL,
    healthScore: 45,
    lastMaintenance: '2023-11-20',
    kpis: {
      cycleTime: 20, throughput: 180, uptime: 55.0, oee: 50, defectRate: 2.5
    },
    sensors: {
      temperature: generateTimeSeries(20, 85, 110),
      vibration: generateTimeSeries(20, 60, 90),
      torque: generateTimeSeries(20, 90, 120), // High torque (overload)
      current: generateTimeSeries(20, 25, 40),
      networkLatency: generateTimeSeries(20, 100, 300),
      audioDecibels: generateTimeSeries(20, 60, 95),
      packetLoss: 5.2,
      protocolAnomalies: 14,
      networkTraffic: generateNetworkTraffic(20, 'EtherNet/IP', 'COORDINATED_RAMP'), // Growing attack
    },
  },
  // 11. PACKAGING - Modbus
  {
    id: 'pack-z',
    name: 'Auto-Packager Z1',
    type: 'Packaging Equipment',
    location: 'Logistics',
    processStep: 11,
    status: MachineStatus.OK,
    healthScore: 95,
    lastMaintenance: '2023-12-05',
    kpis: {
      cycleTime: 10, throughput: 350, uptime: 98.5, oee: 93, defectRate: 0.01
    },
    sensors: {
      temperature: generateTimeSeries(20, 30, 40),
      vibration: generateTimeSeries(20, 5, 10),
      vibrationVelocity: generateTimeSeries(20, 1, 3),
      pressure: generateTimeSeries(20, 6, 8), // Pneumatic air
      networkLatency: generateTimeSeries(20, 10, 15),
      audioDecibels: generateTimeSeries(20, 65, 70),
      packetLoss: 0.0,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'Modbus TCP', 'NONE'),
    },
  },
  // 12. CONVEYOR - Modbus
  {
    id: 'conv-main',
    name: 'Conveyor System Main',
    type: 'Conveyor System',
    location: 'Plant Wide',
    processStep: 12,
    status: MachineStatus.OK,
    healthScore: 98,
    lastMaintenance: '2023-12-01',
    kpis: {
      cycleTime: 0, throughput: 1000, uptime: 99.9, oee: 99, defectRate: 0.0
    },
    sensors: {
      temperature: generateTimeSeries(20, 40, 50),
      vibration: generateTimeSeries(20, 5, 10),
      vibrationVelocity: generateTimeSeries(20, 2, 5),
      current: generateTimeSeries(20, 40, 45), // Motor load
      networkLatency: generateTimeSeries(20, 2, 8),
      audioDecibels: generateTimeSeries(20, 60, 70),
      packetLoss: 0.0,
      protocolAnomalies: 0,
      networkTraffic: generateNetworkTraffic(20, 'Modbus TCP', 'NONE'),
    },
  },
];
