
import React, { useState, useRef, useEffect } from 'react';
import { AgentMessage, ModelTestResult, AgentTrace } from '../types';
import { agentOrchestrator } from '../services/agentOrchestrator';
import { Bot, User, Play, Search, Terminal, Cpu, CheckCircle, XCircle, FileCode, Database, Activity, BarChart3, Lock, UploadCloud, ChevronRight, Zap, ScrollText, Network } from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';

const ResearchLab: React.FC = () => {
  const [objective, setObjective] = useState("Implement SOTA Transformer model for bearing fault prediction");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [showTraces, setShowTraces] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const refreshTraces = () => {
    setTraces(agentOrchestrator.getTraces());
  };

  const handleStart = async () => {
    setSessionActive(true);
    setIsProcessing(true);
    const msg = await agentOrchestrator.startSession(objective);
    setMessages([msg]);
    refreshTraces();
    setIsProcessing(false);
  };

  const handleApprove = async (msgId: string) => {
    setIsProcessing(true);
    // Optimistic update
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, approved: true } : m));
    
    const newMsgs = await agentOrchestrator.processApproval(msgId, true);
    setMessages(prev => [...prev, ...newMsgs]);
    refreshTraces();
    setIsProcessing(false);
  };

  // Helper: Render Agent Avatar
  const getAgentIcon = (role: string) => {
    switch (role) {
      case 'AIO': return <div className="bg-neon-purple p-2 rounded-lg"><Bot className="text-white" size={20} /></div>;
      case 'AIS': return <div className="bg-blue-500 p-2 rounded-lg"><Search className="text-white" size={20} /></div>;
      case 'ATA': return <div className="bg-orange-500 p-2 rounded-lg"><Activity className="text-white" size={20} /></div>;
      case 'AID': return <div className="bg-green-500 p-2 rounded-lg"><UploadCloud className="text-white" size={20} /></div>;
      default: return <div className="bg-slate-700 p-2 rounded-lg"><User className="text-white" size={20} /></div>;
    }
  };

  const getAgentName = (role: string) => {
    switch (role) {
      case 'AIO': return 'Orchestrator (AIO)';
      case 'AIS': return 'Search Agent (AIS)';
      case 'ATA': return 'Test Agent (ATA)';
      case 'AID': return 'Deploy Agent (AID)';
      default: return 'Supervisor';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200 font-sans">
      
      {/* LEFT: ORCHESTRATOR CHAT */}
      <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10 flex justify-between items-center">
           <div>
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
               <Bot className="text-neon-purple" /> AI Agent Orchestrator
             </h2>
             <p className="text-xs text-slate-400 mt-1">Autonomous Research & Deployment Pipeline (HIL Enabled)</p>
           </div>
           <button 
             onClick={() => setShowTraces(!showTraces)}
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${showTraces ? 'bg-neon-purple text-white border-neon-purple' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
           >
             <ScrollText size={14} /> {showTraces ? 'Hide Traces' : 'Show Traces'}
           </button>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
          
          {/* OBSERVABILITY OVERLAY */}
          {showTraces && (
            <div className="absolute inset-0 bg-slate-950/95 z-20 p-6 overflow-y-auto custom-scrollbar backdrop-blur-sm">
               <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                 <Network size={16} className="text-neon-blue" /> Live Agent Trace (A2A Protocol)
               </h3>
               <div className="space-y-2 font-mono text-xs">
                 {traces.map((trace) => (
                   <div key={trace.stepId} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-start gap-3">
                      <div className={`mt-0.5 w-2 h-2 rounded-full ${trace.status === 'SUCCESS' ? 'bg-neon-green' : trace.status === 'FAILURE' ? 'bg-neon-red' : 'bg-neon-orange animate-pulse'}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between text-slate-400 mb-1">
                          <span className="font-bold text-white">{trace.agent} &rarr; {trace.action}</span>
                          <span>{trace.latencyMs.toFixed(0)}ms</span>
                        </div>
                        <div className="text-slate-500 mb-1">Input: "{trace.input.substring(0, 50)}..."</div>
                        {trace.output && <div className="text-neon-blue">Output: {trace.output.substring(0, 50)}...</div>}
                      </div>
                   </div>
                 ))}
                 {traces.length === 0 && <div className="text-slate-500 italic">No traces available yet. Start a session.</div>}
               </div>
            </div>
          )}

          {!sessionActive ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
               <Bot size={64} className="mb-4 text-slate-600" />
               <p>Enter a Research Objective to instantiate the Agent Swarm.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                 <div className="flex gap-4">
                   {getAgentIcon(msg.role)}
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-300">{getAgentName(msg.role)}</span>
                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                        {msg.content}
                        
                        {/* URLS */}
                        {msg.metadata?.researchUrls && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                             <p className="text-xs font-bold text-slate-500 mb-1">FOUND RESOURCES:</p>
                             {msg.metadata.researchUrls.map((url, i) => (
                               <a key={i} href={url} className="block text-xs text-neon-blue hover:underline truncate" target="_blank">{url}</a>
                             ))}
                          </div>
                        )}
                      </div>

                      {/* HIL GATE */}
                      {msg.requiresHIL && !msg.approved && (
                        <div className="mt-3 flex gap-3 animate-pulse">
                           <button 
                             onClick={() => handleApprove(msg.id)}
                             disabled={isProcessing}
                             className="bg-neon-green hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-neon-green/20"
                           >
                             <CheckCircle size={14} /> APPROVE ACTION
                           </button>
                           <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                             <XCircle size={14} /> DENY / REFINE
                           </button>
                        </div>
                      )}
                      
                      {msg.requiresHIL && msg.approved && (
                        <div className="mt-2 text-xs text-neon-green font-bold flex items-center gap-1 opacity-70">
                           <CheckCircle size={12} /> Approved by Human Supervisor
                        </div>
                      )}
                   </div>
                 </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="relative">
             <input 
               type="text" 
               className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-4 pr-12 text-sm text-white focus:border-neon-purple outline-none shadow-inner"
               placeholder="Define Research Objective (e.g. 'Optimize Energy Consumption Model for Press-B')"
               value={objective}
               onChange={(e) => setObjective(e.target.value)}
               disabled={sessionActive}
             />
             <button 
               onClick={handleStart}
               disabled={sessionActive || !objective.trim()}
               className="absolute right-2 top-2 bottom-2 bg-neon-purple hover:bg-purple-600 text-white rounded-lg px-3 transition-colors disabled:opacity-50"
             >
               {sessionActive ? <Activity className="animate-spin" size={18} /> : <Play size={18} />}
             </button>
          </div>
        </div>
      </div>

      {/* RIGHT: WORKBENCH (DYNAMIC) */}
      <div className="w-1/2 flex flex-col bg-slate-950 overflow-y-auto custom-scrollbar p-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
           <div>
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <Terminal className="text-slate-400" /> Research Workbench
             </h3>
             <p className="text-sm text-slate-500">Jupyter/Colab Integration & Testing Suite</p>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-slate-400">
             <Lock size={12} /> RESTRICTED ACCESS
           </div>
        </div>

        {/* 1. NOTEBOOK LOADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
             <FileCode size={16} className="text-neon-blue" /> Algorithm Source
           </h4>
           
           <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center hover:border-neon-blue/50 transition-colors cursor-pointer bg-slate-950/50">
              <UploadCloud size={32} className="text-slate-500 mb-2" />
              <p className="text-sm text-slate-400 font-bold">Drag & Drop Jupyter Notebook (.ipynb)</p>
              <p className="text-xs text-slate-500 mt-1">or paste GitHub/Colab Link</p>
           </div>
           
           {messages.some(m => m.metadata?.researchUrls) && (
             <div className="mt-4 bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileCode size={16} className="text-neon-orange" />
                  <span className="text-sm text-white font-mono">PatchTST_Industrial_v1.ipynb</span>
                </div>
                <span className="text-[10px] bg-neon-green/10 text-neon-green px-2 py-1 rounded">AUTO-GENERATED BY ATA</span>
             </div>
           )}
        </div>

        {/* 2. TEST BENCH CONFIG */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 opacity-80 hover:opacity-100 transition-opacity">
           <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
             <Database size={16} className="text-neon-orange" /> Test Bench Configuration
           </h4>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-950 p-3 rounded border border-slate-800">
               <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Data Source</label>
               <div className="text-sm text-white flex items-center gap-2">
                 <Database size={14} /> AGV-01 History (30 Days)
               </div>
             </div>
             <div className="bg-slate-950 p-3 rounded border border-slate-800">
               <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Injected Faults</label>
               <div className="text-sm text-white flex items-center gap-2">
                 <Zap size={14} /> Dataset #3 (Mechanical)
               </div>
             </div>
             <div className="bg-slate-950 p-3 rounded border border-slate-800 col-span-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit Tests</label>
               <div className="flex gap-2">
                 <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Inference Speed check</span>
                 <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Memory Leak check</span>
                 <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">Accuracy vs Baseline</span>
               </div>
             </div>
           </div>
        </div>

        {/* 3. TEST RESULTS (METRICS CARD) */}
        {messages.some(m => m.metadata?.testMetrics) ? (
           <div className="bg-slate-900 border border-neon-green/30 rounded-xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-fade-in-up">
              <div className="flex justify-between items-start mb-6">
                 <div>
                   <h4 className="text-lg font-bold text-white flex items-center gap-2">
                     <BarChart3 className="text-neon-green" /> Model Evaluation Report
                   </h4>
                   <p className="text-xs text-slate-400">Agent: ATA (Automated Test Agent) | Status: <span className="text-neon-green font-bold">PASSED</span></p>
                 </div>
                 <div className="text-right">
                   <div className="text-2xl font-bold text-neon-green">98.5%</div>
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Accuracy Score</div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Accuracy', A: 98, fullMark: 100 },
                        { subject: 'Precision', A: 96, fullMark: 100 },
                        { subject: 'Recall', A: 99, fullMark: 100 },
                        { subject: 'Speed', A: 90, fullMark: 100 },
                        { subject: 'Efficiency', A: 85, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="PatchTST" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                       <span className="text-xs text-slate-400">Inference Speed</span>
                       <span className="text-sm font-bold text-white">14.2 ms <span className="text-[10px] text-neon-green">(-2ms vs baseline)</span></span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                       <span className="text-xs text-slate-400">Memory Footprint</span>
                       <span className="text-sm font-bold text-white">240 MB</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                       <span className="text-xs text-slate-400">AUC-ROC</span>
                       <span className="text-sm font-bold text-white">0.992</span>
                    </div>
                 </div>
              </div>
           </div>
        ) : (
           <div className="border border-dashed border-slate-800 rounded-xl h-40 flex items-center justify-center text-slate-600">
             <p className="text-xs font-bold uppercase">Waiting for Test Results...</p>
           </div>
        )}

      </div>
    </div>
  );
};

export default ResearchLab;
