
import { EdgeAlert, EdgeHeartbeat, GeminiNanoResult, EdgeFaultType } from "../types";
import { DATASETS, TelemetryFrame } from "./simulatedData";

/**
 * @service EdgeService
 * @description Simulates a Raspberry Pi 5 Edge Device reading from local sensors.
 * 
 * ARCHITECTURE CHANGE:
 * Now uses a "Playback Engine" approach. Instead of generating random numbers,
 * it reads from pre-recorded datasets (`services/simulatedData.ts`). 
 * This ensures deterministic, reproducible scenarios for the executive dashboard.
 */
class EdgeService {
  // Playback State
  private currentDataset: TelemetryFrame[] = DATASETS.NORMAL;
  private playbackCursor: number = 0;
  private faultMode: EdgeFaultType = 'NONE';
  
  // Current Frame (Read from Dataset)
  private currentFrame: TelemetryFrame = DATASETS.NORMAL[0];

  // Listeners (Cloud Uplink)
  private onHeartbeatCallbacks: ((hb: EdgeHeartbeat) => void)[] = [];
  private onAlertCallbacks: ((alert: EdgeAlert) => void)[] = [];
  private onLogCallbacks: ((log: string) => void)[] = [];

  constructor() {
    this.startDeviceLoop();
  }

  // --- CONTROLS ---

  public setFaultMode(mode: EdgeFaultType) {
    this.faultMode = mode;
    this.playbackCursor = 0; // Reset cursor on mode switch
    this.log(`[KERNEL] Mounting Dataset: DATASET_${mode}`);

    switch (mode) {
      case 'IT_ATTACK':
        this.currentDataset = DATASETS.IT_ATTACK;
        break;
      case 'OT_ATTACK':
        this.currentDataset = DATASETS.OT_ATTACK;
        break;
      case 'MECHANICAL_FAIL':
        this.currentDataset = DATASETS.MECHANICAL_FAIL;
        break;
      case 'NONE':
      default:
        this.currentDataset = DATASETS.NORMAL;
        break;
    }
  }

  public subscribeToHeartbeat(cb: (hb: EdgeHeartbeat) => void) { this.onHeartbeatCallbacks.push(cb); }
  public subscribeToAlert(cb: (alert: EdgeAlert) => void) { this.onAlertCallbacks.push(cb); }
  public subscribeToLogs(cb: (log: string) => void) { this.onLogCallbacks.push(cb); }

  // --- INTERNAL LOOP (100ms Tick) ---

  private startDeviceLoop() {
    // We simulate a 2Hz poll rate for the UI, though the backend might record at 100Hz
    setInterval(() => {
      this.readNextFrame();
      this.runGeminiNano();
    }, 500); 
  }

  private readNextFrame() {
    // 1. Read from Data Lake
    this.currentFrame = this.currentDataset[this.playbackCursor];

    // 2. Advance Cursor (Looping)
    this.playbackCursor = (this.playbackCursor + 1) % this.currentDataset.length;
  }

  // --- GEMINI NANO SIMULATION ---

  private runGeminiNano() {
    const startTime = performance.now();
    
    // 1. Feature Extraction (From File)
    const features = this.currentFrame;

    // 2. Inference Logic (Simulated TFLite Model)
    // This logic mimics the "Edge AI" making decisions on the streamed data
    let label: GeminiNanoResult['detectedLabel'] = 'NORMAL';
    let anomalyScore = 0.1;
    let specificAlerts: string[] = [];

    // --- DETECTION LOGIC ---
    
    // IT / NETWORK
    if (features.packetLoss > 5 && features.temp < 60) {
      label = 'NETWORK_DDOS';
      anomalyScore = 0.92;
      specificAlerts.push("High Packet Loss Detected");
      specificAlerts.push("Network Latency Spike");
    } 
    // OT KINETIC (Deep Packet Inspection Simulation)
    else if (features.networkLog.isMalicious || (features.temp > 75 && features.latency > 100)) {
      label = 'CYBER_KINETIC';
      anomalyScore = 0.99;
      specificAlerts.push("DPI ALERT: Unauthorized Modbus Command");
      specificAlerts.push(`PAYLOAD: ${features.networkLog.command}`);
      specificAlerts.push("Correlated Thermal Anomaly");
    } 
    // MECHANICAL INTEGRITY
    else if (this.faultMode === 'MECHANICAL_FAIL' && (features.vib > 5 || features.audio > 70 || features.pressure < 180)) {
      label = 'MECHANICAL_WEAR';
      anomalyScore = 0.88;
      // Granular Physics Checks...
      if (features.audio > 75) specificAlerts.push("Audio: Abnormal Noise Detected");
      if (features.vib > 5) specificAlerts.push("Vibration: Rise in Amplitude");
    }

    const inferenceTime = Math.round(performance.now() - startTime) + 12; // ~12ms inference overhead

    // 3. Decision Logic (Edge vs Cloud)
    // Always trigger upload for specific scenarios to ensure UI updates, even if score is borderline
    if (anomalyScore > 0.7) {
      this.triggerCloudUpload({
        anomalyScore,
        inferenceTimeMs: inferenceTime,
        detectedLabel: label,
        specificAlerts
      });
    } else {
      this.sendHeartbeat();
    }
  }

  // --- UPLINK LOGIC ---

  private sendHeartbeat() {
    // Only send every 5 ticks to save bandwidth (Simulated Bandwidth Optimization)
    if (this.playbackCursor % 5 !== 0) return; 

    const hb: EdgeHeartbeat = {
      type: 'HEARTBEAT',
      machineId: 'agv-01',
      timestamp: new Date().toISOString(),
      deviceStatus: 'ONLINE',
      cpuLoad: this.currentFrame.cpu,
      memoryUsage: 420, // MB
      averageTemp: this.currentFrame.temp
    };

    this.onHeartbeatCallbacks.forEach(cb => cb(hb));
  }

  private triggerCloudUpload(nanoResult: GeminiNanoResult) {
    this.log(`[GEMINI NANO] ANOMALY: ${nanoResult.detectedLabel}`);
    
    // NIDS LOGGING
    if (this.currentFrame.networkLog.isMalicious) {
       this.log(`[NIDS] BLOCKED: ${this.currentFrame.networkLog.protocol} command from ${this.currentFrame.networkLog.source}`);
    }

    let files = {
      audioClip: 'normal_rec.wav',
      pcapDump: 'net_traffic.pcap',
      systemLogs: 'syslog.log'
    };
    // ... file selection logic ...

    const alert: EdgeAlert = {
      type: 'ALERT',
      machineId: 'agv-01',
      timestamp: new Date().toISOString(),
      nanoAnalysis: nanoResult,
      rawTelemetry: {
        // High frequency dump from current frame
        temperature: [{ timestamp: 'now', value: this.currentFrame.temp }],
        vibration: [{ timestamp: 'now', value: this.currentFrame.vib }],
        audioDecibels: [{ timestamp: 'now', value: this.currentFrame.audio }],
        networkLatency: [{ timestamp: 'now', value: this.currentFrame.latency }],
        current: [{ timestamp: 'now', value: this.currentFrame.current }],
        pressure: [{ timestamp: 'now', value: this.currentFrame.pressure }],
        packetLoss: this.currentFrame.packetLoss,
        // Include DPI data in the upload
        networkTraffic: [{
           timestamp: 'now',
           throughput: this.currentFrame.networkLog.size / 1024, // KB/s approximation
           protocol: this.currentFrame.networkLog.protocol,
           command: this.currentFrame.networkLog.command,
           isMalicious: this.currentFrame.networkLog.isMalicious,
           sourceIp: this.currentFrame.networkLog.source
        }]
      },
      fileAttachments: files
    };

    this.onAlertCallbacks.forEach(cb => cb(alert));
  }

  private log(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${msg}`;
    this.onLogCallbacks.forEach(cb => cb(logLine));
  }
}

export const edgeService = new EdgeService();
