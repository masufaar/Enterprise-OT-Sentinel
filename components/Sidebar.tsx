import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, TrendingUp, ShieldCheck, Cpu, Factory, FlaskConical, Lock } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const navItems = [
    { view: ViewState.DASHBOARD, label: 'OT Landscape', icon: <LayoutDashboard size={20} /> },
    { view: ViewState.PLANNING, label: 'Scenario Planning', icon: <Factory size={20} /> },
    { view: ViewState.PREDICTIVE, label: 'Predictive Maint.', icon: <TrendingUp size={20} /> },
    { view: ViewState.COMPLIANCE, label: 'Compliance & Reports', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-start gap-3 border-b border-slate-700">
        <div className="bg-neon-blue p-2 rounded-lg mt-1">
          <Cpu className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-tight">ENTERPRISE<br/>OT SENTINEL</h1>
          <p className="text-xs text-slate-400 mt-1">AI Monitor v3.0</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentView === item.view || (currentView === ViewState.MACHINE_DETAIL && item.view === ViewState.DASHBOARD)
                ? 'bg-slate-800 text-neon-blue border border-slate-700 shadow-lg'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {/* Separator */}
        <div className="h-px bg-slate-800 my-4 mx-4"></div>

        {/* Restricted Area */}
        <button
            onClick={() => onChangeView(ViewState.RESEARCH_LAB)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === ViewState.RESEARCH_LAB
                ? 'bg-slate-950 text-neon-purple border border-neon-purple/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                : 'text-slate-500 hover:bg-slate-950 hover:text-white'
            }`}
          >
            <FlaskConical size={20} className={currentView === ViewState.RESEARCH_LAB ? 'text-neon-purple' : 'group-hover:text-neon-purple'} />
            <div className="flex-1 text-left">
              <span className="font-medium block">AI Research Lab</span>
              <span className="text-[9px] flex items-center gap-1 opacity-70"><Lock size={8} /> Admin Only</span>
            </div>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-2">SYSTEM STATUS</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            <span className="text-sm text-slate-300">Raspberry Pi Grid: Online</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse"></span>
            <span className="text-sm text-slate-300">Agent Swarm: Idle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;