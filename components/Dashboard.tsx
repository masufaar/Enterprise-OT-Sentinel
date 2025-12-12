
import React from 'react';
import { Machine, MachineStatus } from '../types';
import { CheckCircle, AlertTriangle, AlertOctagon, Activity, Clock, BarChart3, ChevronRight, Zap, Target, Gauge, Network, ShieldAlert, ShieldCheck, Wifi, WifiOff, Signal } from 'lucide-react';

interface DashboardProps {
  machines: Machine[];
  onMachineSelect: (machine: Machine) => void;
}

/**
 * @component Dashboard
 * @description A "Swimlane" style dashboard where the production line flows horizontally,
 * and detailed KPIs are stacked vertically in columns under each machine.
 * 
 * LAYOUT STRATEGY:
 * - Parent: Flex Row.
 * - Left Child: Sticky Legend Column (Labels).
 * - Right Child: Scrollable Container with 12 Machine Columns.
 * - Alignment: Visual Node is the header of the column. KPIs are cells below it.
 */
const Dashboard: React.FC<DashboardProps> = ({ machines, onMachineSelect }) => {
  
  // Sort by process step to ensure logical flow (Material -> Packaging)
  const sortedMachines = [...machines].sort((a, b) => a.processStep - b.processStep);

  // Helper for Status Colors
  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OK: return 'text-neon-green';
      case MachineStatus.WARNING: return 'text-neon-orange';
      case MachineStatus.CRITICAL: return 'text-neon-red';
      default: return 'text-slate-500';
    }
  };

  const getStatusBg = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OK: return 'bg-neon-green';
      case MachineStatus.WARNING: return 'bg-neon-orange';
      case MachineStatus.CRITICAL: return 'bg-neon-red';
      default: return 'bg-slate-700';
    }
  };

  const getBorderColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OK: return 'border-neon-green';
      case MachineStatus.WARNING: return 'border-neon-orange';
      case MachineStatus.CRITICAL: return 'border-neon-red';
      default: return 'border-slate-700';
    }
  };

  // Helper: Calculate Network Quality Tier based on telemetry
  const getNetworkQuality = (machine: Machine) => {
    // Get latest values or default to healthy if missing
    const latency = machine.sensors.networkLatency?.slice(-1)[0]?.value ?? 10;
    const packetLoss = machine.sensors.packetLoss ?? 0;

    // Tiered Logic
    if (packetLoss <= 0.1 && latency <= 30) {
      return { tier: 'Excellent', color: 'text-neon-green', icon: Wifi };
    }
    if (packetLoss <= 1.0 && latency <= 80) {
      return { tier: 'Good', color: 'text-neon-blue', icon: Wifi };
    }
    if (packetLoss <= 5.0 && latency <= 200) {
      return { tier: 'Fair', color: 'text-neon-orange', icon: Signal };
    }
    return { tier: 'Poor', color: 'text-neon-red', icon: WifiOff };
  };

  // Define the rows/metrics we want to display
  const metrics = [
    { label: 'OEE', icon: <Activity size={14} />, unit: '%' },
    { label: 'Uptime', icon: <Zap size={14} />, unit: '%' },
    { label: 'Cycle Time', icon: <Clock size={14} />, unit: 's' },
    { label: 'Throughput', icon: <BarChart3 size={14} />, unit: '/hr' },
    { label: 'Defects', icon: <AlertTriangle size={14} />, unit: '%' },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in bg-slate-950 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="text-neon-blue" /> Production Line Overview
          </h2>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 text-slate-300">
             <div className="w-2 h-2 rounded-full bg-neon-green"></div> Normal
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <div className="w-2 h-2 rounded-full bg-neon-orange"></div> Warning
          </div>
          <div className="flex items-center gap-2 text-slate-300">
             <div className="w-2 h-2 rounded-full bg-neon-red"></div> Critical
          </div>
        </div>
      </div>

      {/* MATRIX CONTAINER */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT COLUMN: LEGEND / LABELS (Sticky) */}
        <div className="w-40 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col z-20 shadow-xl">
          {/* Header Spacer */}
          <div className="h-40 border-b border-slate-800 p-4 flex items-end pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Metrics</span>
          </div>
          
          {/* Metric Labels */}
          <div className="flex-1 flex flex-col">
            {metrics.map((metric, i) => (
              <div key={metric.label} className="flex-1 flex items-center px-4 gap-2 border-b border-slate-800/50 bg-slate-900/50">
                <span className="text-slate-400">{metric.icon}</span>
                <span className="text-xs font-bold text-slate-300 uppercase">{metric.label}</span>
              </div>
            ))}
            
             {/* Network Health Row */}
             <div className="flex-1 flex items-center px-4 gap-2 border-b border-slate-800/50 bg-slate-900/50">
                <Network size={14} className="text-neon-purple" />
                <span className="text-xs font-bold text-slate-300 uppercase">Net / DPI</span>
             </div>

            {/* Status Row Label */}
             <div className="flex-1 flex items-center px-4 gap-2 border-b border-slate-800/50 bg-slate-900/50">
                <Target size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase">System Status</span>
              </div>
          </div>
        </div>

        {/* RIGHT AREA: SCROLLABLE MACHINE COLUMNS */}
        <div className="flex-1 overflow-x-auto flex custom-scrollbar">
          {sortedMachines.map((machine, index) => {
            // Determine Network Status
            const protocol = machine.sensors.networkTraffic?.[0]?.protocol || 'N/A';
            const hasMalicious = machine.sensors.networkTraffic?.some(p => p.isMalicious);
            const netStatus = getNetworkQuality(machine);

            return (
            <div 
              key={machine.id} 
              className="flex flex-col min-w-[180px] max-w-[180px] border-r border-slate-800/50 bg-slate-900/20 group hover:bg-slate-800/40 transition-colors"
              data-testid="machine-column"
            >
              
              {/* 1. COLUMN HEADER (Visual Node) */}
              <div 
                onClick={() => onMachineSelect(machine)}
                className="h-40 flex flex-col items-center justify-center p-4 relative cursor-pointer border-b border-slate-800"
              >
                {/* Connector Line (Left) - Except first item */}
                {index > 0 && (
                  <div className="absolute top-1/2 left-0 w-1/2 h-[2px] bg-slate-800 -translate-x-1/2 -translate-y-6 z-0" />
                )}
                {/* Connector Line (Right) - Except last item */}
                {index < sortedMachines.length - 1 && (
                   <div className="absolute top-1/2 right-0 w-1/2 h-[2px] bg-slate-800 translate-x-1/2 -translate-y-6 z-0">
                     <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-slate-600 rotate-45"></div>
                   </div>
                )}

                {/* Node Circle */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center border-2 shadow-lg z-10 mb-3 transition-transform group-hover:scale-110
                  ${getStatusBg(machine.status).replace('bg-', 'bg-opacity-10 ')} 
                  ${getBorderColor(machine.status)}
                `}>
                   <span className={`font-bold text-lg ${getStatusColor(machine.status)}`}>{machine.processStep}</span>
                </div>
                
                {/* Name */}
                <div className="text-center w-full">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Step {machine.processStep}</span>
                  <span className="text-xs font-bold text-white leading-tight block truncate px-1 group-hover:text-neon-blue transition-colors">
                    {machine.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block mt-1">{machine.type.split(' ')[0]}</span>
                </div>
              </div>

              {/* 2. KPI CELLS (Vertical Stack) */}
              <div className="flex-1 flex flex-col">
                
                {/* OEE */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2">
                   <span className={`text-sm font-mono font-bold ${
                      machine.kpis.oee > 85 ? 'text-neon-green' : machine.kpis.oee > 60 ? 'text-neon-orange' : 'text-neon-red'
                   }`}>
                     {machine.kpis.oee}%
                   </span>
                </div>

                {/* Uptime */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2">
                   <div className="w-full px-2">
                     <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{machine.kpis.uptime}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                          className={`h-full ${machine.kpis.uptime > 90 ? 'bg-neon-blue' : 'bg-neon-orange'}`} 
                          style={{ width: `${machine.kpis.uptime}%` }}
                        ></div>
                     </div>
                   </div>
                </div>

                {/* Cycle Time */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2">
                   <span className="text-sm font-mono text-slate-300">{machine.kpis.cycleTime}s</span>
                </div>

                {/* Throughput */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2">
                   <span className="text-sm font-mono text-slate-300">{machine.kpis.throughput}</span>
                </div>

                {/* Defects */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2">
                   <span className={`text-sm font-mono ${machine.kpis.defectRate > 2 ? 'text-neon-red font-bold' : 'text-slate-400'}`}>
                     {machine.kpis.defectRate}%
                   </span>
                </div>

                {/* Network / DPI Status (WITH CONNECTIVITY) */}
                <div className="flex-1 flex flex-col items-center justify-center border-b border-slate-800/50 p-2 bg-slate-900/10">
                   <div className="flex items-center gap-1 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{protocol}</span>
                      
                      {/* CONNECTIVITY INDICATOR */}
                      <div 
                        title={`Connection: ${netStatus.tier} (Lat: ${machine.sensors.networkLatency?.slice(-1)[0]?.value.toFixed(0) || 0}ms, Loss: ${machine.sensors.packetLoss}%)`} 
                        className={`flex items-center ${netStatus.color} ${netStatus.tier === 'Poor' ? 'animate-pulse' : ''}`}
                      >
                         <netStatus.icon size={12} />
                      </div>
                   </div>

                   {/* DPI BLOCKED STATUS */}
                   {hasMalicious ? (
                     <div className="flex items-center gap-1 text-neon-red text-[9px] font-bold animate-pulse px-1 rounded bg-neon-red/10 border border-neon-red/20">
                        <ShieldAlert size={10} /> BLOCKED
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 text-neon-green text-[9px] font-bold opacity-70">
                        <ShieldCheck size={10} /> SECURE
                     </div>
                   )}
                </div>

                {/* STATUS INDICATOR (Last Row) */}
                <div className="flex-1 flex items-center justify-center border-b border-slate-800/50 p-2 bg-slate-900/30">
                   {machine.status === MachineStatus.OK ? (
                     <div className="flex items-center gap-1 text-neon-green text-[10px] uppercase font-bold border border-neon-green/30 px-2 py-1 rounded bg-neon-green/10">
                        <CheckCircle size={12} /> OK
                     </div>
                   ) : machine.status === MachineStatus.WARNING ? (
                     <div className="flex items-center gap-1 text-neon-orange text-[10px] uppercase font-bold border border-neon-orange/30 px-2 py-1 rounded bg-neon-orange/10 animate-pulse">
                        <AlertTriangle size={12} /> Warn
                     </div>
                   ) : (
                     <div className="flex items-center gap-1 text-neon-red text-[10px] uppercase font-bold border border-neon-red/30 px-2 py-1 rounded bg-neon-red/10 animate-bounce">
                        <AlertOctagon size={12} /> Crit
                     </div>
                   )}
                </div>

              </div>

            </div>
          )})}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
