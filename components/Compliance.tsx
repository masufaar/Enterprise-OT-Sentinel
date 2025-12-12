import React, { useState } from 'react';
import { ComplianceItem } from '../types';
import { generateComplianceReport } from '../services/geminiService';
import { ShieldCheck, CheckCircle, XCircle, AlertCircle, RefreshCw, XSquare, AlertTriangle, UserCheck, Bot, ExternalLink, Download, MessageSquare, FileInput, Lock, BarChart3, Globe, Fingerprint } from 'lucide-react';
import { jsPDF } from "jspdf";

type WorkflowState = 'IDLE' | 'AGENT_PROPOSAL' | 'AGENT_WORKING' | 'HIL_REVIEW' | 'HIL_REFINE' | 'PDF_GENERATING' | 'COMPLETED';

const Compliance: React.FC = () => {
  // Mock data with completion percentages
  const [items, setItems] = useState<ComplianceItem[]>([
    { 
      id: 'c1', 
      standard: 'IEC 62443-3-3', 
      status: 'Fail', 
      completionPercentage: 65,
      details: 'System security requirements not fully met. Critical segmentation gaps.', 
      lastChecked: '10 mins ago',
      missingRequirements: [
        'SR 5.1 - Network Segmentation: Zones and conduits not clearly defined for Cell 3.',
        'SR 3.2 - Malicious Code Protection: Endpoint protection outdated on HMI-04.',
        'SR 1.1 - Human User Identification: MFA not enabled for maintenance access.',
        'SR 2.1 - Audit Log Retention: Logs < 30 days on PLC Gateway.'
      ]
    },
    { 
      id: 'c2', 
      standard: 'ISO 27001', 
      status: 'Fail', 
      completionPercentage: 78,
      details: 'Information security controls audit failed.', 
      lastChecked: '2 mins ago',
      missingRequirements: [
        'A.12.6.1 - Technical Vulnerability Management: Unpatched CVE-2023-45 detected.',
        'A.9.4.1 - Access Control: Shared credentials found in config files.',
        'A.13.1.1 - Network Controls: Unencrypted Telnet traffic observed.',
        'A.8.1.1 - Inventory of Assets: 3 rogue devices detected on OT VLAN.'
      ]
    },
    { 
      id: 'gdpr', 
      standard: 'EU GDPR', 
      status: 'Fail', 
      completionPercentage: 50,
      details: 'General Data Protection Regulation. Privacy gaps in historian data.', 
      lastChecked: '45 mins ago',
      missingRequirements: [
        'Art 17 - Right to Erasure: No mechanism to scrub operator biometric data from HMI logs.',
        'Art 25 - Privacy by Design: Default PLC configs transmit Operator IDs in cleartext.',
        'Art 32 - Security of Processing: Shift logs containing PII stored on unencrypted local drives.',
      ]
    },
    { 
      id: 'c3', 
      standard: 'NIST CSF', 
      status: 'Review', 
      completionPercentage: 85,
      details: 'Framework adherence partial. Detection capabilities need review.', 
      lastChecked: '1 hour ago',
      missingRequirements: [
        'DE.AE-1 - Anomalies Detection: Baseline traffic not established for new robotic arm.',
        'PR.DS-5 - Data Leakage Protection: No monitoring on USB ports.',
        'RS.MI-2 - Incident Analysis: Root cause analysis templates missing.',
        'RC.RP-1 - Recovery Planning: Backups not tested in > 90 days.'
      ]
    },
    { 
      id: 'dora', 
      standard: 'EU DORA', 
      status: 'Fail', 
      completionPercentage: 45,
      details: 'Digital Operational Resilience Act. ICT Risk Management gaps.', 
      lastChecked: '15 mins ago',
      missingRequirements: [
        'Art 6.1 - ICT Risk Management Framework: Not formally documented for OT environment.',
        'Art 10.2 - Critical ICT Third-party Providers: No register of external OT vendors.',
        'Art 18.3 - Digital Operational Resilience Testing: TLPT (Red Teaming) not performed.',
        'Art 11.1 - Backup Policies: Offline (air-gapped) backups not automated.'
      ]
    },
    { 
      id: 'cisa', 
      standard: 'CISA CPGs', 
      status: 'Review', 
      completionPercentage: 60,
      details: 'Cybersecurity Performance Goals (Cross-Sector).', 
      lastChecked: '30 mins ago',
      missingRequirements: [
        '1.1 - Asset Inventory: Incomplete list of Level 0/1 devices.',
        '1.2 - Vulnerability Disclosure: No public process for receiving vulnerability reports.',
        '2.1 - Default Passwords: 12 devices flagged with factory default credentials.',
        '4.1 - Log Collection: Centralized logging not capturing east-west traffic.'
      ]
    },
    { 
      id: 'c4', 
      standard: 'Safety SIS', 
      status: 'Pass', 
      completionPercentage: 100,
      details: 'Emergency stop loop integrity confirmed. All safety PLCs operational.', 
      lastChecked: '5 mins ago',
      missingRequirements: []
    },
  ]);

  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowState>('IDLE');
  const [agentStatus, setAgentStatus] = useState("Waiting for request...");
  const [userFeedback, setUserFeedback] = useState("");

  const handleInitializeAgent = () => {
    setWorkflowState('AGENT_PROPOSAL');
  };

  const handleApproveToolUsage = async () => {
    setWorkflowState('AGENT_WORKING');
    setAgentStatus("Authorized: Accessing Google Search for latest DORA & CISA CPG requirements...");
    
    setTimeout(() => setAgentStatus("Agent: Analyzing telemetry against IEC 62443 & DORA Art 6..."), 2000);
    setTimeout(() => setAgentStatus("Agent: Estimating Remediation Budget (CAPEX/OPEX)..."), 4000);
    setTimeout(() => setAgentStatus("Agent: Drafting Board Executive Summary..."), 6000);

    const result = await generateComplianceReport(items);
    setReport(result.text);
    setSources(result.sources);
    setWorkflowState('HIL_REVIEW');
  };

  const handleRefineReport = async () => {
    if (!report) return;
    setWorkflowState('AGENT_WORKING');
    setAgentStatus("Agent: Processing supervisor feedback and refining Board Report...");
    
    const result = await generateComplianceReport(items, report, userFeedback);
    setReport(result.text);
    setSources(result.sources);
    setUserFeedback(""); 
    setWorkflowState('HIL_REVIEW');
  };

  const handleApproveAndDownload = () => {
    setWorkflowState('PDF_GENERATING');
    if (!report) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // HELPER: Draw Header
      const drawHeader = (title: string) => {
        // Dark Header Background
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Neon Accent Line
        doc.setDrawColor(59, 130, 246); // Neon Blue
        doc.setLineWidth(1);
        doc.line(0, 40, pageWidth, 40);

        // Text
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(title, 15, 25);
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text("ENTERPRISE OT SENTINEL | BOARD BRIEFING", pageWidth - 15, 25, { align: 'right' });
      };

      // HELPER: Draw Footer
      const drawFooter = (pageNo: number) => {
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`CONFIDENTIAL - GENERATED BY AI WITH HUMAN SUPERVISION - PAGE ${pageNo}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // --- PAGE 1: EXECUTIVE DASHBOARD ---
      drawHeader("Executive Compliance Scorecard");

      // BACKGROUND
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.rect(0, 40, pageWidth, pageHeight - 40, 'F');

      let yPos = 55;

      // 1. COMPLIANCE GRAPHS (SCORECARD)
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Current Compliance Posture", 15, yPos);
      yPos += 15;

      items.forEach((item) => {
         // Label
         doc.setFontSize(11);
         doc.setTextColor(51, 65, 85);
         doc.text(item.standard, 15, yPos);
         
         // Bar Background
         doc.setFillColor(226, 232, 240);
         doc.roundedRect(60, yPos - 5, 100, 8, 2, 2, 'F');
         
         // Bar Fill (Color coded)
         if (item.completionPercentage >= 90) doc.setFillColor(16, 185, 129); // Green
         else if (item.completionPercentage >= 70) doc.setFillColor(249, 115, 22); // Orange
         else doc.setFillColor(239, 68, 68); // Red
         
         const fillWidth = (item.completionPercentage / 100) * 100;
         doc.roundedRect(60, yPos - 5, fillWidth, 8, 2, 2, 'F');
         
         // Score Text
         doc.setFontSize(10);
         doc.text(`${item.completionPercentage}%`, 165, yPos);
         
         // Status Badge
         doc.setFontSize(9);
         if (item.status === 'Pass') doc.setTextColor(22, 163, 74);
         else if (item.status === 'Review') doc.setTextColor(234, 88, 12);
         else doc.setTextColor(220, 38, 38);
         doc.text(item.status.toUpperCase(), 185, yPos);
         
         yPos += 12;
      });

      yPos += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(15, yPos, pageWidth - 15, yPos);
      yPos += 15;

      // 2. AI EXECUTIVE SUMMARY (First part of report)
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Board Executive Summary", 15, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      // Heuristic: Extract first 1000 chars or first few paragraphs for the dashboard page
      const summaryText = report.substring(0, 1200) + "...";
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 30);
      doc.text(splitSummary, 15, yPos);
      
      drawFooter(1);

      // --- PAGE 2: STRATEGIC ANALYSIS (RISK & BUDGET) ---
      doc.addPage();
      drawHeader("Strategic Analysis");
      
      yPos = 55;

      // BOX 1: RISK
      doc.setFillColor(254, 242, 242); // Red-50
      doc.setDrawColor(252, 165, 165); // Red-300
      doc.roundedRect(15, yPos, pageWidth - 30, 80, 3, 3, 'FD');
      
      doc.setFontSize(12);
      doc.setTextColor(185, 28, 28); // Red-700
      doc.text("Critical Risk Assessment (AI Quantification)", 20, yPos + 10);
      
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("Based on DORA Art 6.1 and IEC 62443 gaps, the organization faces HIGH exposure.", 20, yPos + 20);
      doc.text("Projected Impact: Financial penalties up to 2% of global turnover (DORA).", 20, yPos + 30);
      doc.text("Operational Impact: Potential 48hr downtime in Cell 3 due to lack of segmentation.", 20, yPos + 40);
      
      yPos += 90;

      // BOX 2: BUDGET
      doc.setFillColor(236, 253, 245); // Emerald-50
      doc.setDrawColor(110, 231, 183); // Emerald-300
      doc.roundedRect(15, yPos, pageWidth - 30, 80, 3, 3, 'FD');

      doc.setFontSize(12);
      doc.setTextColor(4, 120, 87); // Emerald-700
      doc.text("Remediation Budget Estimate (ROM)", 20, yPos + 10);

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("Hardware (Firewalls/Gateways): $45,000 - $60,000", 20, yPos + 20);
      doc.text("Software (Endpoint/MFA): $15,000 / yr", 20, yPos + 30);
      doc.text("Professional Services (Audit/Red Teaming): $80,000", 20, yPos + 40);
      doc.text("Total Estimated CapEx: $155,000", 20, yPos + 60);

      drawFooter(2);

      // --- PAGE 3: DETAILED REPORT CONTENT ---
      doc.addPage();
      drawHeader("Full AI Audit Report");
      
      yPos = 55;
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      
      const fullReportLines = doc.splitTextToSize(report, pageWidth - 30);
      
      for(let i=0; i < fullReportLines.length; i++) {
        if(yPos > pageHeight - 30) {
            drawFooter(3);
            doc.addPage();
            drawHeader("Full AI Audit Report (Cont.)");
            yPos = 55;
        }
        doc.text(fullReportLines[i], 15, yPos);
        yPos += 5;
      }

      // SOURCES
      if (sources.length > 0) {
          yPos += 10;
          doc.setTextColor(59, 130, 246);
          doc.setFontSize(10);
          doc.text("Reference Sources:", 15, yPos);
          yPos += 5;
          doc.setTextColor(100, 116, 139);
          sources.forEach(src => {
              doc.textWithLink(src, 15, yPos, { url: src });
              yPos += 5;
          });
      }

      drawFooter(3);

      doc.save("Board_Executive_OT_Compliance_Report.pdf");
      setWorkflowState('COMPLETED');
    } catch (e) {
      console.error(e);
      alert("Error generating PDF");
      setWorkflowState('HIL_REVIEW');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldCheck className="text-neon-green" /> Board Compliance & Reporting
          </h2>
          <p className="text-slate-400">Executive dashboard with GDPR, DORA, CISA, IEC 62443, and ISO 27001 auditing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        
        {/* LEFT COLUMN: STANDARD CHECKLISTS */}
        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item) => (
            <div key={item.id} className={`p-6 rounded-xl border ${
              item.status === 'Pass' ? 'bg-slate-800/50 border-slate-700' : 
              item.status === 'Fail' ? 'bg-slate-900 border-neon-red/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 
              'bg-slate-900 border-neon-orange/50'
            }`}>
               
               {/* HEADER */}
               <div className="flex items-start gap-4 mb-4">
                 <div className="mt-1">
                   {item.standard.includes('DORA') ? <Globe className="text-neon-purple" size={28} /> : 
                    item.standard.includes('GDPR') ? <Fingerprint className="text-neon-orange" size={28} /> :
                    item.standard.includes('CISA') ? <BarChart3 className="text-neon-blue" size={28} /> :
                    item.status === 'Pass' ? <CheckCircle className="text-neon-green" size={28} /> :
                    item.status === 'Fail' ? <XCircle className="text-neon-red" size={28} /> :
                    <AlertCircle className="text-neon-orange" size={28} />}
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-center mb-1">
                     <h3 className="text-lg font-bold text-white">{item.standard}</h3>
                     <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                       item.status === 'Pass' ? 'bg-neon-green/20 text-neon-green' : 
                       item.status === 'Fail' ? 'bg-neon-red/20 text-neon-red' : 'bg-neon-orange/20 text-neon-orange'
                     }`}>
                       {item.status.toUpperCase()}
                     </span>
                   </div>
                   <p className="text-sm text-slate-400">{item.details}</p>
                   
                   {/* COMPLETION PERCENTAGE BAR */}
                   <div className="mt-3">
                     <div className="flex justify-between text-xs text-slate-500 mb-1">
                       <span>Compliance Score</span>
                       <span className="font-bold text-white">{item.completionPercentage}%</span>
                     </div>
                     <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                       <div 
                         className={`h-full transition-all duration-1000 ${
                           item.completionPercentage >= 90 ? 'bg-neon-green' :
                           item.completionPercentage > 60 ? 'bg-neon-orange' : 'bg-neon-red'
                         }`} 
                         style={{ width: `${item.completionPercentage}%` }}
                       />
                     </div>
                   </div>

                   <p className="text-xs text-slate-500 mt-2">Last Checked: {item.lastChecked}</p>
                 </div>
               </div>

               {/* MISSING REQUIREMENTS */}
               {item.status !== 'Pass' && item.missingRequirements && item.missingRequirements.length > 0 && (
                 <div className="mt-4 bg-black/20 rounded-lg p-4 border border-white/5">
                   <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                     <AlertTriangle size={12} className={item.status === 'Fail' ? 'text-neon-red' : 'text-neon-orange'} />
                     Gap Analysis
                   </h4>
                   <ul className="space-y-3">
                     {item.missingRequirements.map((req, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 group">
                         <XSquare size={16} className={`mt-0.5 shrink-0 ${
                           item.status === 'Fail' ? 'text-neon-red/70 group-hover:text-neon-red' : 'text-neon-orange/70 group-hover:text-neon-orange'
                         }`} />
                         <span className="leading-tight">{req}</span>
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: AGENT HIL INTERFACE */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
           
           {/* HEADER */}
           <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-6 shrink-0 relative z-10">
             <div className="bg-neon-blue/20 p-3 rounded-xl border border-neon-blue/30">
               <Bot className="text-neon-blue" size={28} />
             </div>
             <div>
               <h3 className="text-xl font-bold text-white">AI Compliance Agent</h3>
               <p className="text-sm text-slate-400">Board Report Generator (DORA/CISA/IEC)</p>
             </div>
           </div>
           
           {/* AGENT STATE AREA */}
           <div className="flex-1 flex flex-col relative z-10">
             
             {/* STATE 1: IDLE */}
             {workflowState === 'IDLE' && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                 <Bot size={64} className="text-slate-600 mb-6" />
                 <h4 className="text-lg font-bold text-white mb-2">Generate Board Report?</h4>
                 <p className="text-slate-400 max-w-sm mb-8">
                   The Agent will analyze DORA, CISA, and IEC gaps to create a strategic PDF report for the Board of Directors.
                 </p>
                 <button 
                   onClick={handleInitializeAgent}
                   className="bg-neon-blue hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-lg hover:shadow-neon-blue/25 hover:scale-105"
                 >
                   <RefreshCw size={18} /> Initialize Agent
                 </button>
               </div>
             )}

             {/* STATE 2: PROPOSAL */}
             {workflowState === 'AGENT_PROPOSAL' && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                 <div className="bg-slate-900 border border-neon-orange/30 p-6 rounded-xl max-w-md shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-neon-orange"></div>
                    <Lock className="text-neon-orange mx-auto mb-4" size={32} />
                    <h4 className="text-lg font-bold text-white mb-2">Research Authorization</h4>
                    <p className="text-sm text-slate-300 mb-6">
                      Agent requires permission to use <strong>Google Search</strong> to verify latest <strong>EU DORA</strong> penalties and <strong>CISA</strong> critical infrastructure guidelines.
                    </p>
                    <div className="flex gap-4">
                      <button 
                         onClick={() => setWorkflowState('IDLE')}
                         className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 text-sm"
                      >
                        Deny
                      </button>
                      <button 
                         onClick={handleApproveToolUsage}
                         className="flex-1 py-2 rounded-lg bg-neon-orange hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-neon-orange/20"
                      >
                        Approve
                      </button>
                    </div>
                 </div>
               </div>
             )}

             {/* STATE 3: WORKING */}
             {workflowState === 'AGENT_WORKING' && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                 <div className="relative">
                   <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-neon-blue animate-spin"></div>
                   <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-blue" size={24} />
                 </div>
                 <div className="bg-slate-900/50 px-6 py-3 rounded-lg border border-slate-700">
                    <p className="text-neon-blue font-mono text-sm animate-pulse">
                      {agentStatus}
                    </p>
                 </div>
               </div>
             )}

             {/* STATE 4: REVIEW & ITERATION */}
             {(workflowState === 'HIL_REVIEW' || workflowState === 'HIL_REFINE' || workflowState === 'PDF_GENERATING' || workflowState === 'COMPLETED') && report && (
               <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neon-orange uppercase tracking-wider flex items-center gap-2">
                      <UserCheck size={14} /> Human Review Required
                    </span>
                    <span className="text-xs text-slate-500">
                      {workflowState === 'COMPLETED' ? 'Final PDF Ready' : 'Executive Draft (Editable)'}
                    </span>
                  </div>
                  
                  {/* DRAFT PREVIEW */}
                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-6 overflow-y-auto custom-scrollbar mb-4 relative">
                    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{report}</pre>
                    </div>
                    {/* SOURCES */}
                    {sources.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <p className="text-xs font-bold text-slate-500 mb-2">REFERENCES:</p>
                        <ul className="space-y-1">
                          {sources.map((src, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-neon-blue">
                              <ExternalLink size={10} />
                              <a href={src} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-xs">{src}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* ITERATION CONTROLS */}
                  <div className="shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
                    
                    {workflowState === 'HIL_REVIEW' && (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setWorkflowState('HIL_REFINE')}
                          className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={16} /> Request Changes
                        </button>
                        <button 
                          onClick={handleApproveAndDownload}
                          className="flex-[2] bg-neon-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-neon-green/20"
                        >
                           <Download size={18} /> Download Board Report (PDF)
                        </button>
                      </div>
                    )}

                    {workflowState === 'HIL_REFINE' && (
                       <div className="animate-fade-in">
                         <label className="text-xs font-bold text-slate-400 mb-2 block">SUPERVISOR FEEDBACK:</label>
                         <textarea 
                           className="w-full h-20 bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white focus:border-neon-blue outline-none mb-3 resize-none"
                           placeholder="E.g. 'Emphasize the financial risk of DORA non-compliance. Adjust the budget for a phased rollout.'"
                           value={userFeedback}
                           onChange={(e) => setUserFeedback(e.target.value)}
                         />
                         <div className="flex gap-3">
                           <button 
                             onClick={() => setWorkflowState('HIL_REVIEW')}
                             className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-sm"
                           >
                             Cancel
                           </button>
                           <button 
                             onClick={handleRefineReport}
                             disabled={!userFeedback.trim()}
                             className="flex-1 bg-neon-blue hover:bg-blue-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             <RefreshCw size={16} /> Update Report
                           </button>
                         </div>
                       </div>
                    )}
                    
                    {workflowState === 'PDF_GENERATING' && (
                       <div className="text-center text-neon-green font-bold text-sm animate-pulse flex items-center justify-center gap-2">
                          <RefreshCw className="animate-spin" size={16} /> Generating Graphical Board Report...
                       </div>
                    )}

                    {workflowState === 'COMPLETED' && (
                       <div className="text-center text-neon-green font-bold text-sm flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> PDF Downloaded.
                       </div>
                    )}

                  </div>
               </div>
             )}

           </div>

           {/* Background Grid Decoration */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-20"></div>
        </div>

      </div>
    </div>
  );
};

export default Compliance;