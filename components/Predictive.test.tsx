
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import Predictive from './Predictive';
import { MOCK_MACHINES } from '../services/mockData';
import { FMEAItem } from '../types';
import { generateDynamicFMEA } from '../services/geminiService';

// --- MOCKS ---

// 1. Mock the AI Service
jest.mock('../services/geminiService');

// 2. Mock the Data Service to control Sensor Thresholds for deterministic UI testing
jest.mock('../services/mockData', () => {
  const originalModule = jest.requireActual('../services/mockData') as any;
  return {
    __esModule: true,
    ...originalModule,
    // Override thresholds to test all 3 states (OK, Warn, Critical)
    AGV_THRESHOLDS: [
      {
        sensorName: 'Test Sensor OK',
        unit: 'C',
        min: 0, max: 100,
        warningHigh: 80, criticalHigh: 90,
        currentValue: 50
      },
      {
        sensorName: 'Test Sensor Warning',
        unit: 'C',
        min: 0, max: 100,
        warningHigh: 80, criticalHigh: 90,
        currentValue: 85
      },
      {
        sensorName: 'Test Sensor Critical',
        unit: 'C',
        min: 0, max: 100,
        warningHigh: 80, criticalHigh: 90,
        currentValue: 95
      }
    ]
  };
});

describe('Predictive Component', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders fleet overview and FMEA table structure', () => {
    render(<Predictive machines={MOCK_MACHINES} />);
    
    // Check Main Headers
    expect(screen.getByText('Predictive Maintenance')).toBeInTheDocument();
    
    // Check Fleet Overview (Scatter Plot Title)
    expect(screen.getByText('Asset Health vs. Estimated RUL (Remaining Useful Life)')).toBeInTheDocument();

    // Check FMEA Table Headers
    expect(screen.getByText('Failure Mode & Effects Analysis (FMEA)')).toBeInTheDocument();
    expect(screen.getByText('RPN')).toBeInTheDocument();
  });

  test('Sensor Threshold Logic: Renders correct status colors', () => {
    render(<Predictive machines={MOCK_MACHINES} />);
    
    // 1. OK Sensor (50C < 80C)
    const okSensorValue = screen.getByText('50 C');
    expect(okSensorValue).toHaveClass('text-neon-green');

    // 2. Warning Sensor (85C > 80C but < 90C)
    const warnSensorValue = screen.getByText('85 C');
    expect(warnSensorValue).toHaveClass('text-neon-orange');

    // 3. Critical Sensor (95C > 90C)
    const critSensorValue = screen.getByText('95 C');
    // In Predictive.tsx, critical items pulse and are neon-red
    expect(critSensorValue).toHaveClass('text-neon-red');
    expect(critSensorValue).toHaveClass('animate-pulse');
  });

  test('FMEA Display: Renders initial RPN correctly', () => {
    // We are using the original AGV_FMEA_DATA passed through from the mock
    render(<Predictive machines={MOCK_MACHINES} />);
    
    // Check for a known item "Drive Motor A" -> "Bearing Seizure"
    expect(screen.getByText('Drive Motor A')).toBeInTheDocument();
    expect(screen.getByText('Bearing Seizure')).toBeInTheDocument();
    
    // Check RPN calculation display (S=9 * O=3 * D=8 => 216)
    // We look for the cell containing '216'
    expect(screen.getByText('216')).toBeInTheDocument();
  });

  test('Integration: Refresh FMEA updates the table with AI generated data', async () => {
    // Setup Mock Return for the AI Service
    const mockNewFMEA: FMEAItem[] = [
      {
        component: 'AI Generated Component',
        failureMode: 'Test Failure Mode',
        effect: 'Catastrophic Boom',
        severity: 10,
        occurrence: 10,
        detection: 10,
        rpn: 1000,
        recommendedAction: 'Evacuate Plant'
      }
    ];

    (generateDynamicFMEA as jest.Mock).mockResolvedValue(mockNewFMEA);

    render(<Predictive machines={MOCK_MACHINES} />);

    // 1. Verify initial state does NOT have the AI item
    expect(screen.queryByText('AI Generated Component')).not.toBeInTheDocument();

    // 2. Find and Click the "Refresh Risks with AI" button
    const refreshButton = screen.getByRole('button', { name: /Refresh Risks with AI/i });
    fireEvent.click(refreshButton);

    // 3. Verify Loading State appears
    expect(screen.getByText('Analyzing Risks...')).toBeInTheDocument();

    // 4. Wait for the UI to update with the new data
    await waitFor(() => {
      expect(screen.getByText('AI Generated Component')).toBeInTheDocument();
    });

    // 5. Verify the data in the row
    expect(screen.getByText('Catastrophic Boom')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Evacuate Plant')).toHaveClass('text-neon-blue');
  });
});
