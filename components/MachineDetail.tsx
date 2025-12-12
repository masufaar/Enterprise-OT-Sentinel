
import React, { useState, useEffect, useMemo } from 'react';
import { Machine, MachineStatus, SensorDataPoint } from '../types';
import { ArrowLeft, BrainCircuit, Activity, Zap, Play, Volume2, Radio, Terminal, Cpu, Network, ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import { 
  ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine, Dot, Cell, Scatter
} from 'recharts';
import { generatePredictiveInsight } from '../services/geminiService';
import { streamingService } from '../services/streamingService';
import EdgeDeviceSimulator from './EdgeDeviceSimulator';

interface MachineDetailProps {
  machine: Machine;
  onBack: () => void;
}

// ... (Stats calculation helpers remain the same) ...
const calculateStats = (data: SensorDataPoint[]) => {
  if (!data || data.length === 0) return { mean: 0, stdDev: 0, ual: 0, uwl: 0, lwl: 0, lal: 0, min: 0, max: 0 };
  const values = data.map(d => d.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  return {
    mean, stdDev,
    ual: mean + (3 * stdDev), uwl: mean + (2 * stdDev),
    lwl: mean - (2 * stdDev), lal: mean - (3 * stdDev),
    min: Math.min(...values),
    max: Math.max(...values)
  };
};

const SPCOutlierDot = (props: any) => {
  const { cx, cy, value, stats } = props;
  if (!stats) return <Dot cx={cx} cy={cy} r={0} />;
  let fill = null;
  let r = 0;
  if (value > stats.ual || value < stats.lal) { fill = '#ef4444'; r = 6; } 
  else if (value > stats.uwl || value < stats.lwl) { fill = '#f97316'; r = 4; }

  if (fill) return <circle cx={cx} cy={cy} r={r} fill={fill} stroke="#fff" strokeWidth={1} className="animate-pulse" />;
  return null;
};

const SensorChart = ({ title, data, color, unit, syncId }: any) => {
  const stats = useMemo(() => calculateStats(data), [data]);
  if (!data || data.length === 0) return null;

  // Calculate centered domain: [mean - buffer, mean + buffer]
  // We want the mean to be in the middle visually.
  const spread = Math.max((stats.max - stats.min), stats.stdDev * 6, 1); // Ensure some spread even if flat
  const domainMin = Math.floor(stats.mean - (spread * 0.6));
  const domainMax = Math.ceil(stats.mean + (spread * 0.6));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-2 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          {title}
        </h4>
        <div className="flex gap-4 text-[10px] font-mono text-slate-500">
           <span>AVG: {stats.mean.toFixed(1)} {unit}</span>
           <span className="text-neon-red">UAL: {stats.ual.toFixed(1)} {unit}</span>
        </div>
      </div>
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis 
              domain={[domainMin, domainMax]} 
              stroke="#475569" 
              fontSize={10} 
              width={35} 
              tickFormatter={(val) => Math.round(val).toString()}
              unit={unit}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }} 
              itemStyle={{ color: color }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, 'Value']}
            />
            <ReferenceLine y={stats.ual} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={stats.mean} stroke="#94a3b8" strokeDasharray="5 5" strokeOpacity={0.3} />
            <ReferenceLine y={stats.lal} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={<SPCOutlierDot stats={stats} />} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- NEW COMPONENT: NIDS TRAFFIC CHART ---
const NetworkTrafficChart = ({ data, syncId }: any) => {
  if (!data || data.length === 0) return null;

  // Derive active protocol from data
  const protocol = data[0]?.protocol || 'Unknown';

  // Protocol Colors
  const getProtocolColor = (p: string) => {
     if (p.includes('Modbus')) return '#f59e0b'; // Amber
     if (p.includes('EtherNet')) return '#14b8a6'; // Teal (Rockwell-ish)
     if (p.includes('S7')) return '#0ea5e9'; // Sky Blue (Siemens-ish)
     return '#8b5cf6'; // Purple (Generic/DNP3)
  };

  const protoColor = getProtocolColor(protocol);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs z-50 max-w-[200px]">
          <p className="font-bold text-slate-300 mb-1">{label}</p>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: protoColor }}></div>
             <p className="text-white font-mono">{point.protocol}</p>
          </div>
          <p className="text-slate-400">Cmd: <span className="text-white">{point.command}</span></p>
          <p className="text-slate-400">Src: <span className="font-mono">{point.sourceIp}</span></p>
          <p className="text-slate-400">Load: {point.throughput.toFixed(2)} KB/s</p>
          
          {point.isMalicious && (
            <div className="mt-2 bg-neon-red/10 border border-neon-red/30 p-2 rounded text-neon-red animate-pulse">
               <p className="font-bold flex items-center gap-1"><ShieldAlert size={12}/> BLOCKED</p>
               <p className="text-[10px]">Unauthorized Command</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-2 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
         <Network size={64} />
      </div>

      <div className="flex justify-between items-center mb-2 z-10">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Activity size={14} style={{ color: protoColor }} />
          Network Traffic Analysis
        </h4>
        <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Protocol:</span>
             <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border" style={{ borderColor: protoColor, color: protoColor, backgroundColor: `${protoColor}10` }}>
                {protocol.toUpperCase()}
             </span>
        </div>
      </div>
      
      <div className="h-[120px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis stroke="#475569" fontSize={10} width={35} unit="KB/s" />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Base Traffic Flow */}
            <Area 
               type="step" 
               dataKey="throughput" 
               stroke={protoColor} 
               fill={`url(#grad${protocol.replace(/\s/g, '')})`}
               strokeWidth={2}
               isAnimationActive={false} 
            />
            <defs>
              <linearGradient id={`grad${protocol.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={protoColor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={protoColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* Anomalies Overlay - Highlighted in Red */}
            <Scatter data={data.filter((d: any) => d.isMalicious)} shape="circle">
               {data.filter((d: any) => d.isMalicious).map((entry: any, index: number) => (
                 <Cell key={`cell-${index}`} fill="#ef4444" stroke="#fff" strokeWidth={2} />
               ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend / Status */}
      <div className="flex gap-4 mt-2 text-[10px] text-slate-500 z-10">
         <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: protoColor }}></div>
            Valid Traffic
         </div>
         <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-neon-red animate-pulse border border-white"></div>
            Malicious (DPI Blocked)
         </div>
      </div>
    </div>
  );
};

const MachineDetail: React.FC<MachineDetailProps> = ({ machine, onBack }) => {
  const [aiInsight, setAiInsight] = useState<string>("Analyzing process control limits...");
  const [showEdgeSimulator, setShowEdgeSimulator] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      if (machine.status !== MachineStatus.OK) {
        setAiInsight("Gemini 3 Pro detecting multiple sensor anomalies via Edge Uplink. Analysis underway...");
      } else {
        setAiInsight("Process stable. Edge Device (Nano) reporting normal heartbeats.");
      }
    };
    fetchInsight();
  }, [machine.status]);

  const SYNC_ID = "machine-timeline";

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden animate-fade-in relative">
      
      {/* EDGE SIMULATOR OVERLAY */}
      {showEdgeSimulator && (
        <EdgeDeviceSimulator onClose={() => setShowEdgeSimulator(false)} />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{machine.name}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  machine.status === MachineStatus.CRITICAL ? 'bg-neon-red/10 border-neon-red text-neon-red animate-pulse' : 
                  machine.status === MachineStatus.WARNING ? 'bg-neon-orange/10 border-neon-orange text-neon-orange' : 'bg-neon-green/10 border-neon-green text-neon-green'
              }`}>
                {machine.status}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500 font-mono mt-1">
              <span>ID: {machine.id.toUpperCase()}</span>
              <span>MODEL: {machine.brand ? `${machine.brand} ` : ''}{machine.model || 'STD-2024'}</span>
              {machine.isStreaming && (
                <span className="flex items-center gap-1 text-neon-blue animate-pulse">
                  <Radio size={10} /> EDGE UPLINK ACTIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-4">
          {/* Edge Simulator Launcher */}
          {machine.id === 'agv-01' && (
             <button 
               onClick={() => setShowEdgeSimulator(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:border-neon-green hover:text-white transition-all shadow-lg"
             >
               <Terminal size={14} />
               ACCESS EDGE DEVICE
             </button>
          )}

          <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-full pl-2 pr-6 py-2 max-w-md hidden lg:flex">
            <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center shrink-0">
              <BrainCircuit size={16} className="text-neon-purple" />
            </div>
            <p className="text-xs text-slate-300 truncate">{aiInsight}</p>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* LEFT: CHARTS */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-1">
          <SensorChart title="Temperature (Process)" data={machine.sensors.temperature} color="#3b82f6" unit="°C" syncId={SYNC_ID} />
          <SensorChart title="Vibration (RMS)" data={machine.sensors.vibration} color="#f97316" unit="Hz" syncId={SYNC_ID} />
          {machine.sensors.current && (
             <SensorChart title="Motor Current" data={machine.sensors.current} color="#eab308" unit="A" syncId={SYNC_ID} />
          )}
          
          {/* NIDS CHART (NEW) */}
          {machine.sensors.networkTraffic && (
             <NetworkTrafficChart data={machine.sensors.networkTraffic} syncId={SYNC_ID} />
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-2">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
               <Activity size={14} className="text-neon-purple" /> Acoustic Activity
            </h4>
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={machine.sensors.audioDecibels} syncId={SYNC_ID} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis stroke="#475569" fontSize={10} width={35} domain={[40, 120]} unit="dB" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a' }} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE MEDIA STREAM (AUDIO) */}
        {machine.isStreaming && (
          <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col shrink-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Radio className="text-neon-green animate-pulse" size={16} /> Edge Cloud Uplink
            </h3>

            {/* DIAGNOSIS BADGE */}
            {machine.latestEdgeDiagnosis && machine.latestEdgeDiagnosis !== 'NORMAL' && (
              <div className="mb-6 p-4 rounded-xl border border-neon-red/30 bg-neon-red/5 flex flex-col items-center text-center animate-pulse">
                <Cpu size={24} className="text-neon-red mb-2" />
                <h4 className="text-neon-red font-bold text-sm tracking-widest uppercase mb-1">EDGE DIAGNOSIS</h4>
                <p className="text-white font-mono font-bold text-lg">{machine.latestEdgeDiagnosis}</p>
                <p className="text-[10px] text-slate-400 mt-1">Confidence: 98.2% | Inference: 12ms</p>
              </div>
            )}

            {/* Audio Player Card */}
            <div className={`p-4 rounded-xl border mb-4 transition-all duration-500 ${
              machine.status === MachineStatus.CRITICAL 
                ? 'bg-neon-red/10 border-neon-red shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-slate-800 border-slate-700'
            }`}>
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-2">
                   <div className="bg-slate-900 p-2 rounded-lg">
                     <Volume2 size={20} className={machine.status === MachineStatus.CRITICAL ? 'text-neon-red' : 'text-neon-blue'} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400">AUDIO FILE UPLOAD</p>
                     <p className="text-[10px] text-slate-500">Source: Edge (Gemini Nano Filtered)</p>
                   </div>
                 </div>
              </div>

              {machine.latestAudioUrl ? (
                <div className="bg-slate-950 rounded-lg p-3 mb-3 border border-slate-800 flex items-center gap-3">
                   <Play size={14} className="text-neon-green fill-current" />
                   <div className="overflow-hidden">
                     <p className="text-xs font-mono text-neon-green truncate w-40">
                       {machine.latestAudioUrl}
                     </p>
                   </div>
                </div>
              ) : (
                <div className="bg-slate-950 rounded-lg p-3 mb-3 border border-slate-800 flex items-center gap-3 opacity-50">
                   <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                   <p className="text-xs font-mono text-slate-500">Waiting for anomaly...</p>
                </div>
              )}

              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>{machine.status === MachineStatus.CRITICAL ? 'Transfer Complete' : 'Idle'}</span>
                <span>{machine.status === MachineStatus.CRITICAL ? '1.2MB' : '0KB'}</span>
              </div>
            </div>

            {/* Physics Summary */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">Received Telemetry</p>
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">Temp</span>
                <span className={`text-xs font-bold font-mono ${machine.sensors.temperature[machine.sensors.temperature.length-1]?.value > 80 ? 'text-neon-red' : 'text-white'}`}>
                  {machine.sensors.temperature[machine.sensors.temperature.length-1]?.value.toFixed(1)}°C
                </span>
              </div>
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400">Vibration</span>
                <span className={`text-xs font-bold font-mono ${machine.sensors.vibration[machine.sensors.vibration.length-1]?.value > 15 ? 'text-neon-red' : 'text-white'}`}>
                  {machine.sensors.vibration[machine.sensors.vibration.length-1]?.value.toFixed(1)} Hz
                </span>
              </div>
            </div>

            {/* Security Status */}
             <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Security Posture</p>
                <div className="flex items-center gap-2">
                   <Lock size={14} className="text-neon-green" />
                   <span className="text-xs text-white">mTLS Encryption: <span className="text-neon-green font-bold">Active</span></span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <ShieldAlert size={14} className="text-neon-blue" />
                   <span className="text-xs text-white">NIDS Policy: <span className="text-neon-blue font-bold">Strict (DPI Enabled)</span></span>
                </div>
             </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default MachineDetail;
