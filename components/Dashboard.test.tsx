
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';
import { MOCK_MACHINES } from '../services/mockData';

describe('Dashboard Component', () => {
  const mockHandleSelect = jest.fn();

  beforeEach(() => {
    mockHandleSelect.mockClear();
  });

  test('renders dashboard title', () => {
    render(<Dashboard machines={MOCK_MACHINES} onMachineSelect={mockHandleSelect} />);
    const titleElement = screen.getByText(/Production Line Overview/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders all machines as columns', () => {
    render(<Dashboard machines={MOCK_MACHINES} onMachineSelect={mockHandleSelect} />);
    // In the new layout, we don't have row roles, but we can check for machine names
    MOCK_MACHINES.forEach(machine => {
      // Use getAllByText because names might appear in tooltips or mobile views (though ideally unique)
      const elements = screen.getAllByText(machine.name);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('renders correct number of machine columns', () => {
    render(<Dashboard machines={MOCK_MACHINES} onMachineSelect={mockHandleSelect} />);
    const columns = screen.getAllByTestId('machine-column');
    expect(columns).toHaveLength(MOCK_MACHINES.length);
  });

  test('clicking a machine column header triggers callback', () => {
    render(<Dashboard machines={MOCK_MACHINES} onMachineSelect={mockHandleSelect} />);
    
    // Find the column for the first machine
    const firstMachineName = MOCK_MACHINES[0].name;
    // The header contains the name and is clickable
    const header = screen.getByText(firstMachineName).closest('div[class*="cursor-pointer"]');
    
    if (header) {
      fireEvent.click(header);
      expect(mockHandleSelect).toHaveBeenCalledWith(MOCK_MACHINES[0]);
    } else {
      throw new Error("Machine column header not found");
    }
  });

  test('renders metric labels in sticky sidebar', () => {
    render(<Dashboard machines={MOCK_MACHINES} onMachineSelect={mockHandleSelect} />);
    expect(screen.getByText('OEE')).toBeInTheDocument();
    expect(screen.getByText('UPTIME')).toBeInTheDocument();
    expect(screen.getByText('CYCLE TIME')).toBeInTheDocument();
  });
});
