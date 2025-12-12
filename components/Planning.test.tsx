
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import Planning from './Planning';
import { MOCK_MACHINES } from '../services/mockData';
import { edgeService } from '../services/edgeService';

// Mock the Edge Service to prevent actual side effects during UI testing
jest.mock('../services/edgeService', () => ({
  edgeService: {
    setFaultMode: jest.fn(),
    subscribeToAlert: jest.fn(),
  }
}));

// Mock Gemini Service to avoid API calls
jest.mock('../services/geminiService', () => ({
  generateScenarioAnalysis: jest.fn(() => Promise.resolve("MOCK_ANALYSIS: Simulation indicates 15% drop in OEE.")),
}));

describe('Planning (Scenario Simulation) Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders scenario selection cards', () => {
    render(<Planning machines={MOCK_MACHINES} />);
    expect(screen.getByText('IT Network Storm')).toBeInTheDocument();
    expect(screen.getByText('OT Kinetic Attack')).toBeInTheDocument();
    expect(screen.getByText('Mechanical Cascade')).toBeInTheDocument();
  });

  test('Run Simulation button is disabled initially', () => {
    render(<Planning machines={MOCK_MACHINES} />);
    const runBtn = screen.getByRole('button', { name: /Run Simulation/i });
    // In the component, it is disabled if selectedScenario === 'NONE'
    // It might look enabled but have 'cursor-not-allowed' class, or be disabled attribute.
    // Based on code: disabled={selectedScenario === 'NONE'}
    expect(runBtn).toBeDisabled();
  });

  test('Selecting a scenario enables the Run button', async () => {
    render(<Planning machines={MOCK_MACHINES} />);
    
    // Click 'IT Network Storm' card
    const itCard = screen.getByText('IT Network Storm').closest('div');
    if (itCard) fireEvent.click(itCard);

    const runBtn = screen.getByRole('button', { name: /Run Simulation/i });
    expect(runBtn).not.toBeDisabled();
  });

  test('Running simulation triggers Edge Service and displays Analysis', async () => {
    render(<Planning machines={MOCK_MACHINES} />);
    
    // Select Scenario
    fireEvent.click(screen.getByText('OT Kinetic Attack').closest('div')!);
    
    // Click Run
    const runBtn = screen.getByRole('button', { name: /Run Simulation/i });
    fireEvent.click(runBtn);

    // Verify Edge Service was called to change fault mode
    expect(edgeService.setFaultMode).toHaveBeenCalledWith('OT_ATTACK');

    // Verify Loading State
    expect(screen.getByText('Stop Simulation')).toBeInTheDocument();

    // Verify Analysis appears (after async mock resolution)
    await waitFor(() => {
      expect(screen.getByText(/MOCK_ANALYSIS/i)).toBeInTheDocument();
    });
  });
});
