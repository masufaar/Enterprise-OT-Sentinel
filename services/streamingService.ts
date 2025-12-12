
import { Machine, SensorDataPoint, MachineStatus } from '../types';
import { edgeService } from './edgeService';

type StreamCallback = (data: Partial<Machine>) => void;

/**
 * @service StreamingService (Cloud Gateway)
 * @description Receives data packages from the Edge Service.
 * Acts as the centralized ingestion point for the Dashboard.
 */
class StreamingService {
  private subscribers: Map<string, StreamCallback[]> = new Map();
  
  constructor() {
    // Subscribe to the Edge Device
    edgeService.subscribeToHeartbeat(this.handleHeartbeat.bind(this));
    edgeService.subscribeToAlert(this.handleAlert.bind(this));
  }

  // --- CLOUD INGESTION HANDLERS ---

  private handleHeartbeat(hb: any) {
    // Heartbeats don't trigger urgent UI updates, maybe just connectivity status
    // For visualization, we'll assume a "Good" state packet
    this.broadcastToSubscribers(hb.machineId, {
      status: MachineStatus.OK,
      isStreaming: true,
      latestAudioUrl: undefined, // No audio in heartbeat
      latestEdgeDiagnosis: 'NORMAL'
    });
  }

  private handleAlert(alert: any) {
    // Alerts trigger full UI updates with sensor data
    const raw = alert.rawTelemetry;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Map Edge Payload to App State
    const update: Partial<Machine> = {
      status: MachineStatus.CRITICAL, // Edge said it's bad
      isStreaming: true,
      latestAudioUrl: alert.fileAttachments.audioClip,
      latestEdgeDiagnosis: alert.nanoAnalysis.detectedLabel, // Persist specific diagnosis
      sensors: {
        // @ts-ignore - Partial injection handled in App.tsx
        rawTemperature: { timestamp, value: raw.temperature[0].value },
        rawVibration: { timestamp, value: raw.vibration[0].value },
        rawAudio: { timestamp, value: raw.audioDecibels[0].value },
        rawCurrent: { timestamp, value: 12 + Math.random() }, // Simulated filler
        rawLatency: { timestamp, value: raw.networkLatency[0].value },
        // DPI Traffic Data
        rawTraffic: raw.networkTraffic ? {
           timestamp,
           ...raw.networkTraffic[0]
        } : undefined
      }
    };

    this.broadcastToSubscribers(alert.machineId, update);
  }

  // --- APP SUBSCRIPTION LOGIC ---

  public subscribe(machineId: string, callback: StreamCallback) {
    if (!this.subscribers.has(machineId)) {
      this.subscribers.set(machineId, []);
    }
    this.subscribers.get(machineId)?.push(callback);
  }

  public unsubscribe(machineId: string, callback: StreamCallback) {
    const subs = this.subscribers.get(machineId);
    if (subs) {
      this.subscribers.set(machineId, subs.filter(cb => cb !== callback));
    }
  }

  private broadcastToSubscribers(machineId: string, data: Partial<Machine>) {
    this.subscribers.get(machineId)?.forEach(cb => cb(data));
  }
}

export const streamingService = new StreamingService();
