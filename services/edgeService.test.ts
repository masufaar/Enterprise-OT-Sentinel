
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { edgeService } from './edgeService';
import { EdgeAlert, EdgeHeartbeat } from '../types';

describe('Edge Service (Physics Engine)', () => {
  
  beforeEach(() => {
    // Reset to normal before each test
    edgeService.setFaultMode('NONE');
  });

  test('runs heartbeats in normal mode', (done) => {
    const handleHeartbeat = (hb: EdgeHeartbeat) => {
      expect(hb.type).toBe('HEARTBEAT');
      expect(hb.deviceStatus).toBe('ONLINE');
      // In normal mode, temp should be around 45
      expect(hb.averageTemp).toBeLessThan(55);
      done();
    };

    // Note: The loop runs at 500ms, this test might be flaky in a real CI without fake timers.
    // For this prototype, we mock the subscription.
    edgeService.subscribeToHeartbeat(handleHeartbeat);
    
    // Trigger a manual check if needed, or wait for the interval. 
    // Since we can't easily access the private interval, we rely on the internal loop.
    // Ideally we would mock setInterval.
  });

  test('switches to Alert mode on IT Attack', (done) => {
    edgeService.setFaultMode('IT_ATTACK');

    const handleAlert = (alert: EdgeAlert) => {
      expect(alert.type).toBe('ALERT');
      expect(alert.nanoAnalysis.detectedLabel).toBe('NETWORK_DDOS');
      expect(alert.fileAttachments.pcapDump).toContain('ddos');
      expect(alert.rawTelemetry.networkLatency?.[0].value).toBeGreaterThan(100);
      done();
    };

    edgeService.subscribeToAlert(handleAlert);
  }, 2000); // Increased timeout for the loop

  test('switches to Alert mode on Mechanical Failure', (done) => {
    edgeService.setFaultMode('MECHANICAL_FAIL');

    const handleAlert = (alert: EdgeAlert) => {
      expect(alert.type).toBe('ALERT');
      expect(alert.nanoAnalysis.detectedLabel).toBe('MECHANICAL_WEAR');
      expect(alert.rawTelemetry.audioDecibels?.[0].value).toBeGreaterThan(80);
      done();
    };

    edgeService.subscribeToAlert(handleAlert);
  }, 2000);
});
