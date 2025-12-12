
import React, { useState, useEffect } from 'react';
import { Machine, FMEAItem, ReliabilityMetrics } from '../types';
import { TrendingUp, Clock, AlertTriangle, Activity, DollarSign, Target, Gauge, AlertCircle, CheckCircle2, RefreshCw, BrainCircuit, ChevronDown, Table } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { AGV_FMEA_DATA, AGV_THRESHOLDS, getReliabilityMetrics } from '../services/mockData';
import { generateDynamicFMEA } from '../services/geminiService';

interface PredictiveProps {
  machines: Machine[];
}

const Predictive: React.FC<PredictiveProps> = ({ machines }) => {
  
  const [selectedMachineId, setSelectedMachineId] = useState<string>('agv-01');
  // State for FMEA Data (defaults to mock, can be updated by AI)
  const [fmeaData, setFmeaData] = useState<FMEAItem[]>(AGV_FMEA_DATA);
  const [isAnalyzingFmea, setIsAnalyzingFmea] = useState(false);

  // Derive selected machine and metrics
  const selectedMachine = machines.find(m => m.id === selectedMachineId) || machines[0];

  // Get metrics from centralized service
  const metrics = getReliabilityMetrics(selectedMachine.id);

  // Effect to reset FMEA when machine changes (simulated logic)
  useEffect(() => {
    if (selectedMachineId === 'agv-01') {
      setFmeaData(AGV_FMEA_DATA);
    } else {
      // For others, keep visual structure but note it's simulated/generic
      setFmeaData(AGV_FMEA_DATA); 
    }
  }, [selectedMachineId]);


  // Mock prediction data transformation
  const data = machines.map((m, i) => ({
    name: m.name,
    health: m.healthScore,
    daysToFailure: Math.floor(m.healthScore * 1.5),
    urgency: 100 - m.healthScore,
    status: m.status,
    id: m.id
  }));

  const handleRefreshFMEA = async () => {
    setIsAnalyzingFmea(true);
    // Small delay to simulate processing if needed, but Gemini call is async
    const result = await generateDynamicFMEA(selectedMachine, fmeaData);
    if (result) {
      setFmeaData(result);
    }
    setIsAnalyzingFmea(false);
  };

  // Format currency
  const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  // Visual Score Component for FMEA
  const RiskScore = ({ value }: { value: number }) => {
    const getColor = (v: number) => {
        if (v >= 8) return 'bg-neon-red';
        if (v >= 5) return 'bg-neon-orange';
        return 'bg-neon-green';
    };
    const color = getColor(value);
    
    return (
        <div className="flex items-center gap-2 justify-center">
            <div className="flex gap-0.5 h-3">
                {[...Array(10)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1 rounded-sm transition-all ${i < value ? color : 'bg-slate-700/50'}`} 
                    />
                ))}
            </div>
            <span className={`text-xs font-mono font-bold w-4 ${color.replace('bg-', 'text-')}`}>{value}</span>
        </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="text-neon-purple" /> Predictive Maintenance
          </h2>
          <p className="text-slate-400">AI-forecasted asset degradation & Reliability Engineering.</p>
        </div>
      </div>

      {/* SECTION 1: FLEET OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Actions */}
        <div className="lg:col-span-1 space-y-4">
           <h3 className="text-slate-300 font-bold uppercase text-xs tracking-wider mb-2">Recommended Actions (AI Prioritized)</h3>
           {machines.slice().sort((a,b) => a.healthScore - b.healthScore).slice(0, 3).map(machine => (
             <div key={machine.id} className="bg-slate-800 p-4 rounded-xl border-l-4 border-neon-red shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white">{machine.name}</h4>
                  <span className="text-neon-red font-mono text-xs">{machine.healthScore}% Health</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Vibration pattern suggests bearing wear. 85% probability of failure within 7 days.
                </p>
                <button 
                  onClick={() => setSelectedMachineId(machine.id)}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Clock size={14} /> Schedule Maintenance
                </button>
             </div>
           ))}
        </div>

        {/* Scatter Plot */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700">
           <h3 className="text-white font-bold mb-6">Asset Health vs. Estimated RUL (Remaining Useful Life)</h3>
           <div className="h-60 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                 <XAxis type="number" dataKey="daysToFailure" name="Est. Days to Failure" unit="d" stroke="#94a3b8" />
                 <YAxis type="number" dataKey="health" name="Health Score" unit="%" stroke="#94a3b8" />
                 <ZAxis type="number" dataKey="urgency" range={[60, 400]} />
                 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }} />
                 <Scatter name="Machines" data={data} fill="#8884d8" onClick={(e) => e.payload && setSelectedMachineId(e.payload.id)}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.health < 60 ? '#ef4444' : entry.health < 80 ? '#f97316' : '#10b981'} cursor="pointer" />
                    ))}
                 </Scatter>
               </ScatterChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-full bg-neon-green"></span> Healthy
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-full bg-neon-orange"></span> Watchlist
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-3 h-3 rounded-full bg-neon-red"></span> Critical
              </div>
           </div>
        </div>
      </div>
      
      {/* SECTION 1.5: FLEET RELIABILITY MATRIX (NEW) */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Table size={18} className="text-neon-blue" /> Fleet Reliability Matrix
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-xs border-b border-slate-700">
              <tr>
                <th className="p-3">Machine</th>
                <th className="p-3">Health</th>
                <th className="p-3">MTBF (hrs)</th>
                <th className="p-3">MTTR (hrs)</th>
                <th className="p-3">Alert Precision</th>
                <th className="p-3">Est. Cost/Hr</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {machines.map(m => {
                const mMetrics = getReliabilityMetrics(m.id);
                return (
                  <tr key={m.id} onClick={() => setSelectedMachineId(m.id)} className="hover:bg-slate-700/30 cursor-pointer transition-colors group">
                    <td className="p-3 font-bold text-white group-hover:text-neon-blue transition-colors">{m.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${m.healthScore > 80 ? 'bg-neon-green/10 text-neon-green' : m.healthScore > 50 ? 'bg-neon-orange/10 text-neon-orange' : 'bg-neon-red/10 text-neon-red'}`}>
                        {m.healthScore}%
                      </span>
                    </td>
                    <td className="p-3 font-mono">{mMetrics.mtbfHours.toLocaleString()}</td>
                    <td className="p-3 font-mono">{mMetrics.mttrHours}</td>
                    <td className="p-3 font-mono text-neon-blue">{mMetrics.alertPrecision}%</td>
                    <td className="p-3 font-mono text-white">{fmtMoney(mMetrics.downtimeCostPerHr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="h-px bg-slate-800 my-4" />

      {/* SECTION 2: DEEP DIVE (DYNAMIC) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-neon-blue/20 p-2 rounded-lg">
               <Gauge className="text-neon-blue" size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 Machine Reliability Deep Dive
               </h3>
               <p className="text-sm text-slate-400">Reliability Analysis & Failure Modes</p>
             </div>
           </div>

           {/* Machine Selector */}
           <div className="relative">
             <select 
               value={selectedMachineId}
               onChange={(e) => setSelectedMachineId(e.target.value)}
               className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-neon-blue focus:border-neon-blue block w-64 p-2.5 appearance-none cursor-pointer font-bold outline-none"
             >
               {machines.map(m => (
                 <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
               ))}
             </select>
             <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
           </div>
        </div>

        {/* 2.1 RELIABILITY KPIS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {/* MTBF */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={48} />
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">MTBF (Mean Time Between Failures)</p>
              <h4 className="text-2xl font-bold text-white">{metrics.mtbfHours.toLocaleString()} <span className="text-sm font-normal text-slate-500">hrs</span></h4>
              <div className="mt-2 text-xs text-neon-green flex items-center gap-1">
                 <TrendingUp size={12} /> +12% vs last year
              </div>
           </div>

           {/* MTTR */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock size={48} />
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">MTTR (Mean Time To Repair)</p>
              <h4 className="text-2xl font-bold text-white">{metrics.mttrHours} <span className="text-sm font-normal text-slate-500">hrs</span></h4>
              <div className="mt-2 text-xs text-neon-green flex items-center gap-1">
                 <CheckCircle2 size={12} /> Within SLA (4h)
              </div>
           </div>

           {/* DOWNTIME COST */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={48} />
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">Cost of Downtime (Est.)</p>
              <h4 className="text-2xl font-bold text-white">{fmtMoney(metrics.downtimeCostPerHr)} <span className="text-sm font-normal text-slate-500">/hr</span></h4>
              <div className="mt-2 text-xs text-neon-orange flex items-center gap-1">
                 YTD Loss: {fmtMoney(metrics.ytdDowntimeCost)}
              </div>
           </div>

           {/* ALERT PRECISION */}
           <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={48} />
              </div>
              <p className="text-xs text-slate-400 uppercase font-bold mb-1">AI Alert Precision</p>
              <h4 className="text-2xl font-bold text-neon-blue">{metrics.alertPrecision}%</h4>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 mb-3">
                 Gemini Nano (Edge) Filtered
              </div>
              <div className="pt-3 border-t border-slate-700/50">
                 <p className="text-[10px] text-slate-400 leading-relaxed">
                    Logic: Ratio of verified <span className="text-neon-green font-bold">True Positives</span> vs. suppressed <span className="text-neon-red font-bold">False Positives</span> by the edge model.
                 </p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* 2.2 FMEA TABLE */}
           <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
               <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                 FMEA Analysis: {selectedMachine.name}
                 {isAnalyzingFmea && <RefreshCw className="animate-spin text-neon-blue" size={14} />}
               </h4>
               <div className="flex items-center gap-3">
                 <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded">
                   Source: {isAnalyzingFmea ? "Thinking..." : "Gemini 3 Pro"}
                 </span>
                 <button 
                   onClick={handleRefreshFMEA}
                   disabled={isAnalyzingFmea}
                   className="flex items-center gap-2 bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple text-xs font-bold px-3 py-1.5 rounded transition-all disabled:opacity-50"
                 >
                   <BrainCircuit size={14} />
                   {isAnalyzingFmea ? "Analyzing Risks..." : "Refresh Risks with AI"}
                 </button>
               </div>
             </div>
             <div className="overflow-x-auto flex-1">
               <table className="w-full text-left text-xs">
                 <thead className="bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800">
                   <tr>
                     <th className="p-4">Component</th>
                     <th className="p-4">Failure Mode</th>
                     <th className="p-4">Effect</th>
                     <th className="p-4 text-center">Sev (1-10)</th>
                     <th className="p-4 text-center">Occ (1-10)</th>
                     <th className="p-4 text-center">Det (1-10)</th>
                     <th className="p-4 text-center">RPN</th>
                     <th className="p-4">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {fmeaData.map((item, i) => (
                     <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                       <td className="p-4 font-bold text-slate-300">{item.component}</td>
                       <td className="p-4 text-slate-400">{item.failureMode}</td>
                       <td className="p-4 text-slate-400">{item.effect}</td>
                       <td className="p-4 text-center"><RiskScore value={item.severity} /></td>
                       <td className="p-4 text-center"><RiskScore value={item.occurrence} /></td>
                       <td className="p-4 text-center"><RiskScore value={item.detection} /></td>
                       <td className="p-4 text-center font-mono font-bold text-white bg-slate-800/50">{item.rpn}</td>
                       <td className="p-4 text-neon-blue">{item.recommendedAction}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>

           {/* 2.3 SENSOR THRESHOLDS MONITOR */}
           <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                 <AlertCircle size={16} className="text-neon-orange" /> Sensor Thresholds
              </h4>
              
              <div className="space-y-6">
                {/* Visual note for generic machines if not AGV */}
                {selectedMachineId !== 'agv-01' && (
                  <div className="p-3 mb-4 bg-slate-800/50 border border-dashed border-slate-700 rounded text-[10px] text-slate-400">
                    Displaying generic thresholds for demonstration. Connect Edge Node to view live limits.
                  </div>
                )}

                {AGV_THRESHOLDS.map((t, i) => {
                  const percent = Math.min(((t.currentValue - t.min) / (t.max - t.min)) * 100, 100);
                  const isCritical = t.currentValue >= t.criticalHigh;
                  const isWarning = t.currentValue >= t.warningHigh && !isCritical;
                  
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                         <span className="text-slate-300 font-bold">{t.sensorName}</span>
                         <span className={`font-mono ${isCritical ? 'text-neon-red font-bold animate-pulse' : isWarning ? 'text-neon-orange' : 'text-neon-green'}`}>
                           {t.currentValue} {t.unit}
                         </span>
                      </div>
                      
                      {/* Threshold Bar */}
                      <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        {/* Fill */}
                        <div 
                           className={`h-full transition-all duration-1000 ${isCritical ? 'bg-neon-red' : isWarning ? 'bg-neon-orange' : 'bg-slate-500'}`}
                           style={{ width: `${percent}%` }}
                        ></div>
                        
                        {/* Markers */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-neon-orange" style={{ left: `${((t.warningHigh - t.min)/(t.max-t.min))*100}%` }} title="Warning"></div>
                        <div className="absolute top-0 bottom-0 w-0.5 bg-neon-red" style={{ left: `${((t.criticalHigh - t.min)/(t.max-t.min))*100}%` }} title="Critical"></div>
                      </div>
                      
                      <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                         <span>{t.min}</span>
                         <span className="text-neon-orange">Warn: {t.warningHigh}</span>
                         <span className="text-neon-red">Crit: {t.criticalHigh}</span>
                         <span>{t.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Predictive;
