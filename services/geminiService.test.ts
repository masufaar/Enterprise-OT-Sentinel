import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { generateScenarioAnalysis, generatePredictiveInsight } from './geminiService';
import { MOCK_MACHINES } from './mockData';

// MOCK SETUP
// We are mocking the @google/genai library to avoid making real API calls during testing.
// This is critical for Unit Testing (fast, reliable, no cost).
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => ({
      models: {
        generateContent: jest.fn().mockImplementation(async () => {
          return {
            text: "MOCK_AI_RESPONSE: Analysis Complete.",
          };
        }),
      },
    })),
  };
});

describe('Gemini Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateScenarioAnalysis returns a string response', async () => {
    const response = await generateScenarioAnalysis("Test Scenario", MOCK_MACHINES);
    expect(response).toBeDefined();
    expect(response).toContain("MOCK_AI_RESPONSE");
  });

  test('generatePredictiveInsight handles machine data correctly', async () => {
    const machine = MOCK_MACHINES[0];
    const response = await generatePredictiveInsight(machine);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });

  // NON-REGRESSION TEST
  // Ensures that even with empty input, the service handles it gracefully without crashing.
  test('handles empty scenario string gracefully', async () => {
    const response = await generateScenarioAnalysis("", MOCK_MACHINES);
    expect(response).toBeDefined();
  });
});