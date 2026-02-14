
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ogMockService, PriceData } from './services/ogMockService';
import { AgentState, RiskTolerance, VolatilityForecast } from './types';
import DashboardHeader from './components/DashboardHeader';
import VolatilityChart from './components/VolatilityChart';
import ChatInterface from './components/ChatInterface';
import RiskSettings from './components/RiskSettings';
import { 
  ShieldCheck, 
  BarChart3, 
  Cpu, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Globe,
  TrendingUp,
  AlertCircle,
  XCircle
} from 'lucide-react';

const HOLDINGS = {
  ETH: 12.45,
  BTC: 0.15,
  SOL: 45.2,
  OG: 2400.00
};

const App: React.FC = () => {
  const [agentState, setAgentState] = useState<AgentState>(ogMockService.loadMemSync());
  const [forecast, setForecast] = useState<VolatilityForecast[]>([]);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [attesting, setAttesting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [volData, priceData, teeStatus] = await Promise.all([
        ogMockService.getVolatilityForecast(),
        ogMockService.getLivePrices(),
        ogMockService.verifyTEE()
      ]);
      setForecast(volData);
      setPrices(priceData);
      setAgentState(prev => ({ ...prev, teeVerified: teeStatus }));
    } finally {
      setIsSyncing(false);
      setTimeout(() => setAttesting(false), 1500);
    }
  }, []);

  // Listen for Wallet Changes
  useEffect(() => {
    const { ethereum } = window as any;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAgentState(prev => ({ ...prev, walletAddress: accounts[0] }));
        } else {
          setAgentState(prev => ({ ...prev, walletAddress: null }));
        }
      };

      const handleChainChanged = () => {
        // Reload page as recommended by MetaMask docs
        window.location.reload();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  useEffect(() => {
    syncData();
    const interval = setInterval(async () => {
      const newPrices = await ogMockService.getLivePrices();
      setPrices(newPrices);
    }, 5000);
    return () => clearInterval(interval);
  }, [syncData]);

  const handleRiskChange = (newRisk: RiskTolerance) => {
    const newState = { ...agentState, riskTolerance: newRisk };
    setAgentState(newState);
    ogMockService.saveMemSync(newState);
  };

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const address = await ogMockService.connectWallet();
      const newState = { ...agentState, walletAddress: address };
      setAgentState(newState);
      ogMockService.saveMemSync(newState);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while connecting your wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const getAssetPrice = (symbol: string) => prices.find(p => p.symbol === symbol)?.price || 0;
  const getAssetChange = (symbol: string) => prices.find(p => p.symbol === symbol)?.change24h || 0;

  const totalPortfolioValue = useMemo(() => {
    return Object.entries(HOLDINGS).reduce((acc, [symbol, amount]) => {
      return acc + (amount * getAssetPrice(symbol));
    }, 0);
  }, [prices]);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30">
      <DashboardHeader 
        state={agentState} 
        onRefresh={syncData} 
        onConnect={handleConnect}
        isSyncing={isSyncing} 
        isConnecting={isConnecting}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Section (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Executive Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              label="TOTAL AUM (TEE)" 
              value={`$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              subValue="Live Revaluation"
              icon={<Wallet className="text-cyan-400" />} 
            />
            <StatCard 
              label="RISK INDEX" 
              value="18.5" 
              subValue="Stable Range"
              icon={<BarChart3 className="text-purple-400" />} 
            />
            <StatCard 
              label="TEE LOAD" 
              value="14%" 
              subValue="Isolated"
              icon={<Cpu className="text-emerald-400" />} 
            />
            <StatCard 
              label="NODES" 
              value="1,402" 
              subValue="Decentralized"
              icon={<Globe className="text-blue-400" />} 
            />
          </div>

          {error && (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/20 rounded-2xl text-rose-400">
                  <XCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white tracking-tight">Wallet Error</h4>
                  <p className="text-xs text-slate-400 mt-1">{error}</p>
                </div>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {!agentState.walletAddress && !error && (
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white tracking-tight">Wallet Disconnected</h4>
                  <p className="text-xs text-slate-400 mt-1">Connect your MetaMask to the OpenGradient Testnet to view on-chain asset provenance.</p>
                </div>
              </div>
              <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
              >
                {isConnecting ? 'Opening MetaMask...' : 'Connect Now'}
              </button>
            </div>
          )}

          <VolatilityChart data={forecast} />

          {/* Secure Ledger */}
          <div className="relative glass border border-white/5 rounded-[32px] p-8 overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10">
            {attesting && (
              <div className="absolute inset-0 z-20 glass flex flex-col items-center justify-center backdrop-blur-md">
                <div className="flex items-center gap-3 bg-cyan-500/10 px-6 py-3 rounded-2xl border border-cyan-500/20 text-cyan-400 animate-pulse">
                  <Lock size={20} />
                  <span className="font-mono text-xs tracking-widest uppercase">Remote Attestation...</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <ShieldCheck size={28} className="text-emerald-500" />
                  Sovereign Ledger
                </h3>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-[0.2em]">Enclave ID: OG-TEE-MAIN-4182</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 uppercase tracking-widest">STATE: FINALIZED</div>
                <div className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black rounded-lg border border-white/10 uppercase tracking-widest">MEMSYNC: SYNCED</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="pb-5 text-left font-black">Asset Profile</th>
                    <th className="pb-5 text-right font-black">Quantity</th>
                    <th className="pb-5 text-right font-black">Spot Price</th>
                    <th className="pb-5 text-right font-black">Position Value</th>
                    <th className="pb-5 text-right font-black">Risk Inference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AssetRow symbol="ETH" name="Ethereum" amount={HOLDINGS.ETH} price={getAssetPrice('ETH')} change={getAssetChange('ETH')} />
                  <AssetRow symbol="BTC" name="Bitcoin" amount={HOLDINGS.BTC} price={getAssetPrice('BTC')} change={getAssetChange('BTC')} />
                  <AssetRow symbol="SOL" name="Solana" amount={HOLDINGS.SOL} price={getAssetPrice('SOL')} change={getAssetChange('SOL')} />
                  <AssetRow symbol="OG" name="OpenGradient" amount={HOLDINGS.OG} price={getAssetPrice('OG')} change={getAssetChange('OG')} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section (4 columns) */}
        <div className="lg:col-span-4 space-y-8">
          <ChatInterface riskLevel={agentState.riskTolerance} />
          <RiskSettings current={agentState.riskTolerance} onChange={handleRiskChange} />
          
          <div className="p-6 glass border border-white/5 rounded-[32px] bg-gradient-to-br from-cyan-500/5 to-transparent">
             <div className="flex items-center gap-3 mb-4">
               <TrendingUp size={20} className="text-cyan-400" />
               <h4 className="text-sm font-black uppercase tracking-widest">Market Context</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Quant Agent is currently optimizing for <span className="text-white font-bold">{agentState.riskTolerance}</span> risk. 
               Last MemSync snapshot was performed {(Date.now() - agentState.lastSync) / 1000 < 60 ? 'seconds ago' : 'minutes ago'}.
             </p>
          </div>
        </div>
      </main>

      <footer className="p-10 border-t border-white/5 bg-slate-950/20 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-slate-600">&copy; 2025 OPENGRADIENT SOVEREIGN QUANTITATIVE RISK SYSTEM | CONNECTED TO TESTNET</p>
      </footer>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; subValue: string; icon: React.ReactNode }> = ({ 
  label, value, subValue, icon 
}) => (
  <div className="glass border border-white/5 rounded-3xl p-6 group hover:border-cyan-500/30 transition-all cursor-default">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-cyan-500/10 transition-colors">
        {icon}
      </div>
      <div className="text-[9px] font-black text-cyan-400/60 tracking-widest uppercase">{subValue}</div>
    </div>
    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</div>
    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
  </div>
);

const AssetRow: React.FC<{ symbol: string; name: string; amount: number; price: number; change: number }> = ({ 
  symbol, name, amount, price, change 
}) => {
  const value = amount * price;
  return (
    <tr className="group hover:bg-white/[0.02] transition-colors">
      <td className="py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-[10px] border border-white/5 group-hover:border-cyan-500/50 transition-all shadow-inner">
            {symbol}
          </div>
          <div>
            <div className="font-black text-white text-sm tracking-tight">{symbol}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{name}</div>
          </div>
        </div>
      </td>
      <td className="py-6 text-right font-mono text-xs text-slate-300 font-bold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td className="py-6 text-right font-mono text-xs text-slate-300 font-bold">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td className="py-6 text-right font-mono text-sm font-black text-white">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      <td className={`py-6 text-right font-mono text-xs font-black flex items-center justify-end gap-1.5 ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {change >= 0 ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
        {Math.abs(change).toFixed(2)}%
      </td>
    </tr>
  );
};

export default App;
