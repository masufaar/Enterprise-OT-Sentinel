

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import Compliance from './Compliance';
import { generateComplianceReport } from '../services/geminiService';

// Mock the AI Service
jest.mock('../services/geminiService');

describe('Compliance Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders compliance standards list', () => {
    render(<Compliance />);
    expect(screen.getByText('IEC 62443-3-3')).toBeInTheDocument();
    expect(screen.getByText('ISO 27001')).toBeInTheDocument();
    expect(screen.getByText('EU DORA')).toBeInTheDocument();
  });

  test('displays Pass/Fail badges correctly', () => {
    render(<Compliance />);
    // "Fail" badge for IEC 62443
    const iecItem = screen.getByText('IEC 62443-3-3').closest('div[class*="rounded-xl"]');
    expect(iecItem).toHaveTextContent('FAIL');
  });

  test('Agent workflow: Initial state is Idle', () => {
    render(<Compliance />);
    expect(screen.getByText('AI Compliance Agent')).toBeInTheDocument();
    expect(screen.getByText('Initialize Agent')).toBeInTheDocument();
  });

  test('Agent workflow: transitions to Proposal and then Working', async () => {
    // Setup Mock for Report Generation
    (generateComplianceReport as jest.Mock).mockImplementation(async () => ({
      text: "EXECUTIVE SUMMARY: Risk is High.",
      sources: ["https://dora-legislation.eu"]
    }));

    render(<Compliance />);

    // 1. Click Initialize
    fireEvent.click(screen.getByText('Initialize Agent'));
    
    // 2. Expect Authorization Request (Proposal State)
    expect(screen.getByText('Research Authorization')).toBeInTheDocument();
    expect(screen.getByText('Approve')).toBeInTheDocument();

    // 3. Click Approve
    fireEvent.click(screen.getByText('Approve'));

    // 4. Expect Working State (Spinner text)
    expect(screen.getByText(/Authorized: Accessing Google Search/i)).toBeInTheDocument();

    // 5. Expect Final Report (Review State)
    await waitFor(() => {
      expect(screen.getByText(/EXECUTIVE SUMMARY: Risk is High/i)).toBeInTheDocument();
    });

    // 6. Expect Download Button
    expect(screen.getByText('Download Board Report (PDF)')).toBeInTheDocument();
  });
});
