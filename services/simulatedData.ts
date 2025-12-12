
/**
 * @file simulatedData.ts
 * @description **The Data Lake**: This file serves as the repository for all "Recorded" telemetry sessions.
 * 
 * In a production environment, these would be binary files (.dat, .pcap, .wav) stored in an S3 bucket or local disk.
 * For this application, we simulate the file system by exporting static, deterministic arrays of TelemetryFrames.
 * 
 * DESIGN PRINCIPLE: DETERMINISM
 * To ensure the "Scenario Planning" screens are 100% reproducible for executives, we do NOT use random generation
 * at runtime for these scenarios. We "play back" these specific arrays.
 * 
 * DPI SIMULATION:
 * We now generate 'networkLog' objects to simulate Deep Packet Inspection identifying specific OT commands.
 */

export interface NetworkLog {
  protocol: string;
  command: string;
  isMalicious: boolean;
  size: number;
  source: string;
}

export interface TelemetryFrame {
  temp: number;       // Celsius
  vib: number;        // Hz (RMS)
  audio: number;      // dB
  latency: number;    // ms
  packetLoss: number; // %
  cpu: number;        // %
  pressure: number;   // Bar
  current: number;    // Amps
  networkLog: NetworkLog; // NIDS Data
}

const generateNormal = (): TelemetryFrame[] => {
  const data: TelemetryFrame[] = [];
  // 60 seconds of stable operation
  const commands = [
    { proto: 'Modbus TCP', cmd: 'Read Holding Reg (0x03)', size: 64 },
    { proto: 'Modbus TCP', cmd: 'Read Input Reg (0x04)', size: 64 },
    { proto: 'EtherNet/IP', cmd: 'CIP Read Data', size: 128 },
    { proto: 'S7Comm', cmd: 'Read Var', size: 96 }
  ];

  for (let i = 0; i < 60; i++) {
    const randomCmd = commands[Math.floor(Math.random() * commands.length)];
    data.push({
      temp: 45 + Math.sin(i * 0.1) * 2,
      vib: 2.5 + Math.cos(i * 0.5) * 0.2,
      audio: 60 + Math.random(),
      latency: 10 + Math.random() * 5,
      packetLoss: 0,
      cpu: 15 + Math.random() * 2,
      pressure: 200 + Math.random() * 2,
      current: 12 + Math.random() * 0.5,
      networkLog: {
        protocol: randomCmd.proto,
        command: randomCmd.cmd,
        isMalicious: false,
        size: randomCmd.size + Math.random() * 10,
        source: '192.168.1.50' // PLC
      }
    });
  }
  return data;
};

const generateITAttack = (): TelemetryFrame[] => {
  const data: TelemetryFrame[] = [];
  // DDoS Signature: Sudden latency spike, high packet loss, flat physics
  for (let i = 0; i < 60; i++) {
    const isSpike = i > 10 && i < 50;
    data.push({
      temp: 46 + Math.random(),
      vib: 2.6 + Math.random() * 0.1,
      audio: 61 + Math.random(),
      latency: isSpike ? 200 + Math.random() * 400 : 15,
      packetLoss: isSpike ? 15 + Math.random() * 10 : 0.1,
      cpu: isSpike ? 95 + Math.random() * 5 : 20,
      pressure: 200 + Math.random(),
      current: 12 + Math.random() * 0.5,
      networkLog: {
        protocol: isSpike ? 'TCP' : 'Modbus TCP',
        command: isSpike ? 'SYN Flood' : 'Read Holding Reg (0x03)',
        isMalicious: isSpike,
        size: isSpike ? 1500 : 64,
        source: isSpike ? 'UNKNOWN_BOTNET' : '192.168.1.50'
      }
    });
  }
  return data;
};

const generateComplexMechanicalFailure = (): TelemetryFrame[] => {
  const data: TelemetryFrame[] = [];
  // Complex Progressive Failure
  for (let i = 0; i < 60; i++) {
    let t = i / 60;
    let temp = 45;
    let vib = 2.5;
    let audio = 60;
    let pressure = 200;
    let current = 12;

    if (i > 15) vib = 2.5 + ((i - 15) * 0.8) + (Math.random() * 2);
    if (i > 30) { audio = 60 + ((i - 30) * 1.5) + (Math.random() * 5); current = 12 + ((i - 30) * 0.5); }
    if (i > 45) { pressure = 200 - ((i - 45) * 2); temp = 45 + ((i - 45) * 1.5); }

    data.push({
      temp: temp + Math.random(), 
      vib: vib, 
      audio: audio, 
      latency: 12 + Math.random() * 2,
      packetLoss: 0,
      cpu: 18 + Math.random() * 2,
      pressure: Math.max(0, pressure),
      current: current,
      networkLog: {
        protocol: 'Modbus TCP',
        command: 'Read Holding Reg (0x03)', // Network is normal during mech fail
        isMalicious: false,
        size: 64,
        source: '192.168.1.50'
      }
    });
  }
  return data;
};

const generateOTAttack = (): TelemetryFrame[] => {
  const data: TelemetryFrame[] = [];
  // Stuxnet-style: Kinetic damage masked by or coincident with Network C2 traffic
  for (let i = 0; i < 60; i++) {
    const attackActive = i > 20;
    data.push({
      temp: attackActive ? 80 + Math.random() * 10 : 45,
      vib: attackActive ? 15 + Math.random() * 10 : 2.5,
      audio: attackActive ? 85 + Math.random() * 5 : 60,
      latency: attackActive ? 150 + Math.random() * 50 : 12,
      packetLoss: attackActive ? 2 : 0,
      cpu: attackActive ? 65 : 15,
      pressure: attackActive ? 250 : 200,
      current: attackActive ? 25 : 12,
      networkLog: {
        protocol: attackActive ? 'Modbus TCP' : 'Modbus TCP',
        // DPI detects the specific "Write" command used to override safety
        command: attackActive ? 'Write Single Reg (0x06) - SET_RPM=9999' : 'Read Holding Reg (0x03)',
        isMalicious: attackActive,
        size: attackActive ? 128 : 64,
        source: attackActive ? '10.0.5.2 (Rogue)' : '192.168.1.50'
      }
    });
  }
  return data;
};

export const DATASETS = {
  NORMAL: generateNormal(),
  IT_ATTACK: generateITAttack(),
  MECHANICAL_FAIL: generateComplexMechanicalFailure(),
  OT_ATTACK: generateOTAttack()
};
