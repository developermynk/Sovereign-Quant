
import React from 'react';
import { ShieldCheck, Database, Server, RefreshCw, Wallet as WalletIcon, Link2 } from 'lucide-react';
import { AgentState } from '../types';

interface Props {
  state: AgentState;
  onRefresh: () => void;
  onConnect: () => void;
  isSyncing: boolean;
  isConnecting: boolean;
}

const DashboardHeader: React.FC<Props> = ({ state, onRefresh, onConnect, isSyncing, isConnecting }) => {
  const truncatedAddress = state.walletAddress 
    ? `${state.walletAddress.substring(0, 6)}...${state.walletAddress.substring(state.walletAddress.length - 4)}` 
    : null;

  return (
    <header className="glass sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="bg-cyan-500 p-2 rounded-xl glow-cyan shadow-cyan-500/20 shadow-lg">
          <Server size={24} className="text-slate-950" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            SOVEREIGN <span className="text-cyan-400">QUANT</span>
            <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/50 tracking-widest font-normal uppercase">Agent v4.1</span>
          </h1>
          <div className="flex items-center gap-3 text-[10px] text-white/40 font-semibold tracking-wider uppercase">
            <span className="text-cyan-400 flex items-center gap-1.5">
              <Link2 size={10} />
              {state.network}
            </span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>ID: {state.walletAddress ? '0x82...1F4E' : 'UNCONNECTED'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusBadge icon={<ShieldCheck size={14} />} label="TEE" status="VERIFIED" color="emerald" />
        <StatusBadge icon={<Database size={14} />} label="MEMSYNC" status="ACTIVE" color="blue" />
        
        <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />

        <button 
          onClick={onConnect}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 font-bold text-xs ${
            state.walletAddress 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {isConnecting ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <WalletIcon size={14} />
          )}
          {state.walletAddress ? truncatedAddress : 'Connect Wallet'}
        </button>

        <button 
          onClick={onRefresh}
          disabled={isSyncing}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={18} className={`text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};

const StatusBadge: React.FC<{ icon: React.ReactNode; label: string; status: string; color: string }> = ({ 
  icon, label, status, color 
}) => {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };
  
  return (
    <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${colorMap[color] || ''}`}>
      {icon}
      <span className="opacity-60">{label}:</span>
      <span className="tracking-widest">{status}</span>
    </div>
  );
};

export default DashboardHeader;
