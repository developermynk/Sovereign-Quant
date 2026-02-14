
import React from 'react';
import { RiskTolerance } from '../types';
import { AlertTriangle, ShieldCheck, Zap, Activity } from 'lucide-react';

interface Props {
  current: RiskTolerance;
  onChange: (risk: RiskTolerance) => void;
}

const RiskSettings: React.FC<Props> = ({ current, onChange }) => {
  const options = [
    { 
      type: RiskTolerance.CONSERVATIVE, 
      icon: <ShieldCheck size={18} className="text-emerald-400" />, 
      desc: "Capital protection & fixed yield focus." 
    },
    { 
      type: RiskTolerance.MODERATE, 
      icon: <Activity size={18} className="text-blue-400" />, 
      desc: "Optimized growth with risk mitigation." 
    },
    { 
      type: RiskTolerance.DEGEN, 
      icon: <Zap size={18} className="text-orange-400" />, 
      desc: "Aggressive alpha via volatility capture." 
    },
  ];

  return (
    <div className="glass border border-white/5 rounded-[32px] p-8 shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-white tracking-tight">Strategy Configuration</h3>
        <span className="text-[9px] font-bold bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 uppercase tracking-widest animate-pulse">
          MEMSYNC ACTIVE
        </span>
      </div>
      
      <div className="space-y-4">
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={`w-full group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 ${
              current === opt.type 
              ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className={`p-3 rounded-xl transition-colors duration-300 ${
              current === opt.type ? 'bg-cyan-500/20 shadow-inner' : 'bg-slate-950/50 group-hover:bg-slate-900'
            }`}>
              {opt.icon}
            </div>
            <div className="text-left">
              <div className={`font-bold text-sm tracking-tight transition-colors ${current === opt.type ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {opt.type.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 rounded-2xl bg-slate-950/50 border border-white/5">
        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold italic flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full flex-shrink-0" />
          "State updates are globally replicated via MemSync across the OpenGradient network."
        </p>
      </div>
    </div>
  );
};

export default RiskSettings;
