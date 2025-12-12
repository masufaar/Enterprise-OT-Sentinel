
import React, { useEffect, useState, useRef } from 'react';
import { edgeService } from '../services/edgeService';
import { Terminal, Cpu, Wifi, Activity, FileAudio, FileText, Zap, X, ShieldAlert, Settings } from 'lucide-react';
import { EdgeFaultType } from '../types';

interface EdgeDeviceSimulatorProps {
  onClose: () => void;
}

const EdgeDeviceSimulator: React.FC<EdgeDeviceSimulatorProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [faultMode, setFaultMode] = useState<EdgeFaultType>('NONE');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to Edge Service logs
  useEffect(() => {
    const handleLog = (log: string) => {
      setLogs(prev => [...prev.slice(-20), log]); // Keep last 20 lines
    };
    edgeService.subscribeToLogs(handleLog);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const changeFaultMode = (mode: EdgeFaultType) => {
    setFaultMode(mode);
    edgeService.setFaultMode(mode);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-5xl bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[650px] font-mono">
        
        {/* HEADER */}
        <div className="bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-neon-green/20 p-2 rounded">
               <Cpu className="text-neon-green" size={20} />
             </div>
             <div>
               <h3 className="text-white font-bold text-lg tracking-tight">Raspberry Pi 5 (Edge Node: agv-01)</h3>
               <p className="text-xs text-slate-400">OS: Raspbian 64-bit | AI: Gemini Nano (TFLite)</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: SYSTEM STATS & CONTROLS */}
          <div className="w-1/3 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-6 overflow-y-auto">
             
             {/* Specs */}
             <div className="space-y-4">
               <h4 className="text-xs font-bold text-slate-500 uppercase">Hardware Resources</h4>
               
               <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-300">
                   <span>CPU Load (4 Cores)</span>
                   <span>{faultMode === 'IT_ATTACK' ? '98%' : faultMode !== 'NONE' ? '65%' : '14%'}</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className={`h-full ${faultMode !== 'NONE' ? 'bg-neon-red' : 'bg-neon-green'}`} 
                        style={{ width: faultMode === 'IT_ATTACK' ? '98%' : faultMode !== 'NONE' ? '65%' : '14%' }}></div>
                 </div>
               </div>

               <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-300">
                   <span>NPU Usage (Gemini Nano)</span>
                   <span>{faultMode !== 'NONE' ? '85%' : '12%'}</span>
                 </div>
                 <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-neon-purple" style={{ width: faultMode !== 'NONE' ? '85%' : '12%' }}></div>
                 </div>
               </div>
             </div>

             <div className="flex-1"></div>

             {/* SCENARIO INJECTION */}
             <div className="border border-slate-700 rounded-xl p-4 bg-slate-900 space-y-3">
               <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                 <Activity size={14} className="text-neon-orange" /> Scenario Injection
               </h4>
               
               {/* 1. IT ATTACK */}
               <button 
                 onClick={() => changeFaultMode(faultMode === 'IT_ATTACK' ? 'NONE' : 'IT_ATTACK')}
                 className={`w-full py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-all border ${
                   faultMode === 'IT_ATTACK' 
                   ? 'bg-neon-red/20 border-neon-red text-white' 
                   : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <Wifi size={16} /> IT Cyberattack (DDoS)
                 </div>
                 <div className={`w-2 h-2 rounded-full ${faultMode === 'IT_ATTACK' ? 'bg-neon-red animate-pulse' : 'bg-slate-600'}`}></div>
               </button>

               {/* 2. OT ATTACK */}
               <button 
                 onClick={() => changeFaultMode(faultMode === 'OT_ATTACK' ? 'NONE' : 'OT_ATTACK')}
                 className={`w-full py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-all border ${
                   faultMode === 'OT_ATTACK' 
                   ? 'bg-neon-orange/20 border-neon-orange text-white' 
                   : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <ShieldAlert size={16} /> OT Cyberattack (Kinetic)
                 </div>
                 <div className={`w-2 h-2 rounded-full ${faultMode === 'OT_ATTACK' ? 'bg-neon-orange animate-pulse' : 'bg-slate-600'}`}></div>
               </button>

               {/* 3. MECHANICAL */}
               <button 
                 onClick={() => changeFaultMode(faultMode === 'MECHANICAL_FAIL' ? 'NONE' : 'MECHANICAL_FAIL')}
                 className={`w-full py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-between transition-all border ${
                   faultMode === 'MECHANICAL_FAIL' 
                   ? 'bg-neon-purple/20 border-neon-purple text-white' 
                   : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <Settings size={16} /> Mechanical Failure
                 </div>
                 <div className={`w-2 h-2 rounded-full ${faultMode === 'MECHANICAL_FAIL' ? 'bg-neon-purple animate-pulse' : 'bg-slate-600'}`}></div>
               </button>

               <div className="h-px bg-slate-800 my-2"></div>

               <button 
                 onClick={() => changeFaultMode('NONE')}
                 className="w-full py-2 rounded text-xs text-slate-500 hover:text-white hover:bg-slate-800"
               >
                 RESET / NORMAL OPERATION
               </button>
             </div>

          </div>

          {/* RIGHT: TERMINAL & FILE SYSTEM */}
          <div className="w-2/3 flex flex-col bg-black">
            
            {/* TERMINAL OUTPUT */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-xs" ref={scrollRef}>
              <div className="text-slate-500 mb-2">root@agv-01:~# tail -f /var/log/edge-sentinel.log</div>
              {logs.map((log, i) => {
                const isAlert = log.includes('ANOMALY');
                const isUpload = log.includes('Upload');
                return (
                  <div key={i} className={`mb-1 ${isAlert ? 'text-neon-red font-bold' : isUpload ? 'text-neon-blue' : 'text-green-500'}`}>
                    {log}
                  </div>
                );
              })}
            </div>

            {/* VIRTUAL FILE SYSTEM STATUS */}
            <div className="h-44 border-t border-slate-800 bg-slate-900 p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <Zap size={14} className="text-neon-blue" /> Outbound Data Queue (Cloud Uplink)
              </h4>
              
              <div className="flex gap-4 overflow-x-auto pb-2">
                {faultMode !== 'NONE' ? (
                  <>
                    <div className="bg-slate-800 border border-neon-blue/50 p-3 rounded w-36 shrink-0 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-blue animate-pulse"></div>
                       <FileAudio className="text-neon-blue mb-2" size={24} />
                       <div className="text-[10px] text-white truncate font-bold">
                          {faultMode === 'IT_ATTACK' ? 'silence.wav' : faultMode === 'OT_ATTACK' ? 'strain.wav' : 'grinding.wav'}
                       </div>
                       <div className="text-[9px] text-slate-400">Audio • 1.2MB</div>
                       <div className="mt-2 text-[9px] text-neon-blue animate-pulse">UPLOADING...</div>
                    </div>

                    <div className="bg-slate-800 border border-neon-purple/50 p-3 rounded w-36 shrink-0 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-full h-0.5 bg-neon-purple animate-pulse"></div>
                       <FileText className="text-neon-purple mb-2" size={24} />
                       <div className="text-[10px] text-white truncate font-bold">
                          {faultMode === 'IT_ATTACK' ? 'ddos.pcap' : faultMode === 'OT_ATTACK' ? 'c2_traf.pcap' : 'norm_net.pcap'}
                       </div>
                       <div className="text-[9px] text-slate-400">Network • 45MB</div>
                       <div className="mt-2 text-[9px] text-neon-purple animate-pulse">UPLOADING...</div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-slate-500 text-xs italic bg-slate-800/50 p-4 rounded-lg border border-slate-800 w-full">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-ping"></div>
                    <div>
                      <p className="font-bold text-slate-400">Status: HEALTHY</p>
                      <p className="text-[10px]">Sending lightweight heartbeats (0.5KB)</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default EdgeDeviceSimulator;
