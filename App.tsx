
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MachineDetail from './components/MachineDetail';
import Planning from './components/Planning';
import Predictive from './components/Predictive';
import Compliance from './components/Compliance';
import ResearchLab from './components/ResearchLab';
import { ViewState, Machine, SensorDataPoint } from './types';
import { MOCK_MACHINES } from './services/mockData';
import { streamingService } from './services/streamingService';

/**
 * @component App
 * @description The Root Component handling global state and layout.
 */
const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  
  // Drill-down State
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  
  // Machine State (Hydrated with Mock Data)
  const [machines, setMachines] = useState<Machine[]>(MOCK_MACHINES);

  // --- STREAMING INTEGRATION ---
  useEffect(() => {
    // Subscribe to AGV-01 updates
    const handleStreamUpdate = (data: any) => {
      setMachines(prevMachines => prevMachines.map(m => {
        if (m.id === 'agv-01') {
          // Append new data points using a rolling window (keep last 20)
          const append = (history: any[], point: any) => {
            const newHistory = [...history, point];
            return newHistory.slice(-20); // Keep last 20
          };

          const raw = data.sensors;
          // If no raw sensor data (e.g. basic status update), just merge properties
          if (!raw) return { ...m, ...data }; 

          // Initialize networkTraffic if missing (for legacy mocks)
          const currentTraffic = m.sensors.networkTraffic || [];

          return {
            ...m,
            status: data.status,
            isStreaming: true,
            latestAudioUrl: data.latestAudioUrl,
            latestEdgeDiagnosis: data.latestEdgeDiagnosis, // Update specific diagnosis
            sensors: {
              ...m.sensors,
              temperature: append(m.sensors.temperature, raw.rawTemperature),
              vibration: append(m.sensors.vibration, raw.rawVibration),
              current: m.sensors.current ? append(m.sensors.current, raw.rawCurrent) : [raw.rawCurrent],
              audioDecibels: append(m.sensors.audioDecibels, raw.rawAudio),
              networkLatency: append(m.sensors.networkLatency, raw.rawLatency),
              // DPI TRAFFIC
              networkTraffic: raw.rawTraffic ? append(currentTraffic, raw.rawTraffic) : currentTraffic
            }
          };
        }
        return m;
      }));

      // Update selectedMachine if it's the one streaming
      if (selectedMachine?.id === 'agv-01') {
         setSelectedMachine(prev => {
             // We rely on the parent state update to re-render, 
             // but we need to signal to the Detail component that data changed.
             // The most reliable way in this simple architecture is to sync in the useEffect below.
             return prev; 
         });
      }
    };

    streamingService.subscribe('agv-01', handleStreamUpdate);

    return () => {
      streamingService.unsubscribe('agv-01', handleStreamUpdate);
    };
  }, [selectedMachine]);

  // Sync selectedMachine with machines state
  // This ensures the Detail View sees the live updates
  useEffect(() => {
    if (selectedMachine) {
      const liveMachine = machines.find(m => m.id === selectedMachine.id);
      if (liveMachine && liveMachine !== selectedMachine) {
        setSelectedMachine(liveMachine);
      }
    }
  }, [machines, selectedMachine]);

  const handleMachineSelect = (machine: Machine) => {
    setSelectedMachine(machine);
    setCurrentView(ViewState.MACHINE_DETAIL);
  };

  const handleBackToDashboard = () => {
    setSelectedMachine(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard machines={machines} onMachineSelect={handleMachineSelect} />;
      case ViewState.MACHINE_DETAIL:
        return selectedMachine ? (
          <MachineDetail machine={selectedMachine} onBack={handleBackToDashboard} />
        ) : (
          <Dashboard machines={machines} onMachineSelect={handleMachineSelect} />
        );
      case ViewState.PLANNING:
        return <Planning machines={machines} />;
      case ViewState.PREDICTIVE:
        return <Predictive machines={machines} />;
      case ViewState.COMPLIANCE:
        return <Compliance />;
      case ViewState.RESEARCH_LAB:
        return <ResearchLab />;
      default:
        return <Dashboard machines={machines} onMachineSelect={handleMachineSelect} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-neon-blue selection:text-white">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      <main className="flex-1 ml-64 p-4 relative">
         <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-slate-950 -z-10 pointer-events-none"></div>
         {renderContent()}
      </main>
    </div>
  );
};

export default App;
