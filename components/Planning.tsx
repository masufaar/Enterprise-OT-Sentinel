
import React, { useState, useEffect, useMemo } from 'react';
import { Machine, EdgeFaultType, EdgeAlert, MachineStatus } from '../types';
import { generateScenarioAnalysis } from '../services/geminiService';
import { edgeService } from '../services/edgeService';
import { Sliders, PlayCircle, Loader2, Wifi, ShieldAlert, Settings, Activity, AlertOctagon, X, Zap, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface PlanningProps {
  machines: Machine[];
}

const Planning: React.FC<PlanningProps> = ({ machines }) => {
  // Scenario State
  const [productionLoad, setProductionLoad] = useState(100);
  const [selectedScenario, setSelectedScenario] = useState<EdgeFaultType>('NONE');
  const [isSimulating, setIsSimulating] = useState(false);
  
  // AI Analysis State
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Alert Popups State
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  // Subscribe to Edge Alerts
  useEffect(() => {
    const handleAlert = (alert: EdgeAlert) => {
      if (selectedScenario === 'MECHANICAL_FAIL' && alert.nanoAnalysis.specificAlerts) {
        const newAlerts = alert.nanoAnalysis.specificAlerts;
        setActiveAlerts(prev => {
           const combined = [...prev];
           newAlerts.forEach(a => {
             if (!combined.includes(a)) combined.push(a);
           });
           return combined.slice(-5);
        });
      }
    };
    edgeService.subscribeToAlert(handleAlert);
  }, [selectedScenario]);

  useEffect(() => {
    setActiveAlerts([]);
    setIsSimulating(false);
  }, [selectedScenario]);

  // --- SIMULATION LOGIC ---
  // Calculates the projected status of a machine based on the active scenario
  const getSimulatedState = (machine: Machine, scenario: EdgeFaultType): { status: MachineStatus, impact: number, risk: string } => {
    if (scenario === 'NONE') return { status: machine.status, impact: 0, risk: 'Low' };

    let impact = 0; // 0-100
    let risk = 'Low';
    let status = MachineStatus.OK;

    // SCENARIO 1: IT ATTACK (Network Storm)
    // Affects highly connected/smart devices (Robots, CNC, Laser)
    if (scenario === 'IT_ATTACK') {
      if (['Robotic Arm', 'CNC Milling', 'Laser Cutter'].includes(machine.type)) {
        status = MachineStatus.CRITICAL;
        impact = 95;
        risk = 'Critical';
      } else if (['Turning Machine', 'Drilling Machine'].includes(machine.type)) {
        status = MachineStatus.WARNING;
        impact = 60;
        risk = 'High';
      } else {
        impact = 10;
      }
    }

    // SCENARIO 2: OT ATTACK (Kinetic/Thermal)
    // Affects heavy machinery with complex PLCs (Press, Stamping, Molding)
    else if (scenario === 'OT_ATTACK') {
      if (['Stamping Machine', 'Hydraulic Press', 'Injection Molding'].includes(machine.type)) {
        status = MachineStatus.CRITICAL;
        impact = 100;
        risk = 'Safety Hazard';
      } else {
        status = MachineStatus.WARNING; // Sympathetic anxiety/slowdown
        impact = 40;
        risk = 'Medium';
      }
    }

    // SCENARIO 3: MECHANICAL FAIL (Bottleneck)
    // Affects AGV directly, and causes starvation (Warning) for downstream
    else if (scenario === 'MECHANICAL_FAIL') {
      if (machine.id === 'agv-01') {
        status = MachineStatus.CRITICAL;
        impact = 100;
        risk = 'Stoppage';
      } else if (machine.processStep <= 4) {
        // Machines immediately relying on materials
        status = MachineStatus.WARNING;
        impact = 75;
        risk = 'Starvation';
      } else {
        impact = 20;
      }
    }

    return { status, impact, risk };
  };

  // Generate Chart Data based on Scenario
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 60; i+=10) { // 60 minutes projection
      let riskScore = 10;
      let efficiency = 95;

      if (selectedScenario === 'IT_ATTACK') {
        riskScore = 10 + (i * 1.5); // Fast rising risk
        efficiency = 95 - (i * 1.2); // Fast drop
      } else if (selectedScenario === 'OT_ATTACK') {
        riskScore = 20 + (i * 1.2);
        efficiency = 95 - (i * 0.5); // Slower drop (inertia)
      } else if (selectedScenario === 'MECHANICAL_FAIL') {
        riskScore = 30 + (i * 0.5); // Localized risk
        efficiency = 95 - (i * 0.8); // Steady decline due to bottleneck
      }

      data.push({
        time: `${i}m`,
        risk: Math.min(100, riskScore),
        efficiency: Math.max(0, efficiency)
      });
    }
    return data;
  }, [selectedScenario]);


  const toggleSimulation = async () => {
    if (isSimulating) {
      setIsSimulating(false);
      edgeService.setFaultMode('NONE');
      setActiveAlerts([]);
    } else {
      setIsSimulating(true);
      edgeService.setFaultMode(selectedScenario);
      
      setLoadingAnalysis(true);
      setAnalysis(null);
      const result = await generateScenarioAnalysis(
        `Active Simulation: ${selectedScenario}. Global Load: ${productionLoad}%. Impact Analysis requested.`, 
        machines
      );
      setAnalysis(result);
      setLoadingAnalysis(false);
    }
  };

  const ScenarioCard = ({ type, icon, title, description }: { type: EdgeFaultType, icon: any, title: string, description: string }) => (
    <div 
      onClick={() => !isSimulating && setSelectedScenario(type)}
      className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group ${
        selectedScenario === type 
        ? 'bg-slate-800 border-neon-blue ring-1 ring-neon-blue shadow-lg' 
        : 'bg-slate-900 border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
      } ${isSimulating && selectedScenario !== type ? 'opacity-30 pointer-events-none' : ''}`}
    >
       <div className={`absolute top-0 left-0 w-1 h-full ${selectedScenario === type ? 'bg-neon-blue' : 'bg-transparent'}`}></div>
       <div className="flex items-start justify-between mb-3">
         <div className={`p-3 rounded-lg ${selectedScenario === type ? 'bg-neon-blue/20 text-neon-blue' : 'bg-slate-800 text-slate-400'}`}>
           {icon}
         </div>
         {selectedScenario === type && <div className="w-3 h-3 rounded-full bg-neon-blue animate-pulse"></div>}
       </div>
       <h4 className="font-bold text-white mb-1">{title}</h4>
       <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24 relative">
      
      {/* HEADER */}
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <Sliders className="text-neon-blue" /> Scenario Planning & Simulation
      </h2>

      {/* ALERT POPUP OVERLAY */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {activeAlerts.map((alert, idx) => (
          <div key={idx} className="bg-slate-900/90 backdrop-blur border-l-4 border-neon-red text-white p-4 rounded shadow-2xl animate-fade-in-up flex items-center gap-4 max-w-sm pointer-events-auto">
             <div className="bg-neon-red/20 p-2 rounded-full animate-pulse">
               <AlertOctagon size={20} className="text-neon-red" />
             </div>
             <div>
               <h4 className="font-bold text-sm text-neon-red uppercase tracking-wider">Anomaly Detected</h4>
               <p className="text-sm font-mono">{alert}</p>
             </div>
             <button onClick={() => setActiveAlerts(prev => prev.filter(a => a !== alert))} className="ml-auto text-slate-500 hover:text-white"><X size={16} /></button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 text-sm mb-4 font-bold flex justify-between">
              <span>GLOBAL PRODUCTION LOAD</span>
              <span className="text-white">{productionLoad}%</span>
            </label>
            <input 
              type="range" min="50" max="150" value={productionLoad} 
              onChange={(e) => setProductionLoad(Number(e.target.value))}
              disabled={isSimulating}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
            />
          </div>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Scenario Selection</h3>
             <div className="grid grid-cols-1 gap-3">
                <ScenarioCard type="IT_ATTACK" icon={<Wifi size={20} />} title="IT Network Storm" description="DDoS attack on robots/CNC. High Latency, Packet Loss." />
                <ScenarioCard type="OT_ATTACK" icon={<ShieldAlert size={20} />} title="OT Kinetic Attack" description="Stuxnet-style physical damage to heavy machinery." />
                <ScenarioCard type="MECHANICAL_FAIL" icon={<Settings size={20} />} title="Mechanical Cascade" description="Critical component failure (AGV) causing line starvation." />
             </div>
          </div>

          <button 
             onClick={toggleSimulation}
             disabled={selectedScenario === 'NONE'}
             className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
               isSimulating ? 'bg-neon-red hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
               : selectedScenario !== 'NONE' ? 'bg-neon-blue hover:bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
             }`}
          >
             {isSimulating ? "Stop Simulation" : <><PlayCircle size={24} /> Run Simulation</>}
          </button>
        </div>

        {/* RIGHT: IMPACT VISUALIZATION */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. IMPACT MAP (SWIMLANE VISUAL) */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="text-neon-orange" /> Scenario Impact Map
              </h3>
              {isSimulating && <span className="text-xs font-mono text-neon-red animate-pulse">SIMULATION ACTIVE</span>}
            </div>
            
            <div className="overflow-x-auto flex pb-4 custom-scrollbar">
               {machines.slice().sort((a,b) => a.processStep - b.processStep).map((machine, i) => {
                 const sim = isSimulating ? getSimulatedState(machine, selectedScenario) : { status: machine.status, impact: 0, risk: 'Low' };
                 const isImpacted = sim.impact > 0;
                 
                 return (
                   <div key={machine.id} className={`flex-shrink-0 w-32 flex flex-col items-center group transition-all duration-500 ${isSimulating && !isImpacted ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                      {/* Connection Line */}
                      <div className="w-full h-1 bg-slate-700 mb-2 relative">
                         {isImpacted && <div className="absolute top-0 left-0 w-full h-full bg-neon-red animate-pulse"></div>}
                      </div>
                      
                      {/* Node */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 mb-2 transition-all duration-500 relative ${
                         sim.status === MachineStatus.CRITICAL ? 'bg-neon-red/20 border-neon-red shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                         sim.status === MachineStatus.WARNING ? 'bg-neon-orange/20 border-neon-orange' :
                         'bg-slate-700 border-slate-600'
                      }`}>
                         <span className={`font-bold ${
                           sim.status === MachineStatus.CRITICAL ? 'text-neon-red' : 
                           sim.status === MachineStatus.WARNING ? 'text-neon-orange' : 'text-slate-400'
                         }`}>{machine.processStep}</span>

                         {/* Risk Badge */}
                         {isImpacted && (
                           <div className="absolute -top-3 -right-3 bg-slate-900 border border-slate-600 text-[9px] px-1.5 py-0.5 rounded text-white font-bold z-10">
                             {sim.impact}%
                           </div>
                         )}
                      </div>
                      
                      <p className={`text-[10px] font-bold text-center truncate w-full px-1 ${isImpacted ? 'text-white' : 'text-slate-500'}`}>{machine.name}</p>
                      
                      {/* Risk Label */}
                      {isImpacted && (
                        <span className={`text-[9px] font-bold mt-1 uppercase ${
                          sim.status === MachineStatus.CRITICAL ? 'text-neon-red' : 'text-neon-orange'
                        }`}>
                          {sim.risk}
                        </span>
                      )}
                   </div>
                 );
               })}
            </div>
          </div>

          {/* 2. RISK & EFFICIENCY CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Risk Velocity Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                 <AlertTriangle size={14} className="text-neon-red" /> Projected Risk Exposure
               </h4>
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={isSimulating ? chartData : []}>
                     <defs>
                       <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                     <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                     <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={2} name="Risk Score" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Efficiency Impact Chart */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
               <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                 <BarChart3 size={14} className="text-neon-blue" /> Production Efficiency (OEE)
               </h4>
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={isSimulating ? chartData : []}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                     <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                     <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} dot={false} name="OEE %" />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

          </div>

          {/* 3. GEMINI INSIGHT */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 min-h-[150px]">
             <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
               <Zap size={16} className="text-neon-purple" /> Strategic AI Assessment
             </h4>
             
             {!analysis && !loadingAnalysis && (
                <p className="text-sm text-slate-500 italic mt-4">Select a scenario to generate Gemini 3 Pro assessment...</p>
             )}
             
             {loadingAnalysis && (
                <div className="flex items-center gap-3 text-neon-blue mt-4">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-sm animate-pulse">Analyzing failure propagation paths...</span>
                </div>
             )}

             {analysis && (
               <div className="mt-4 prose prose-invert prose-sm max-w-none text-slate-300 animate-fade-in">
                 <div className="whitespace-pre-wrap">{analysis}</div>
               </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Planning;
