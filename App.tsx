
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
  XCircle,
  ExternalLink,
  HelpCircle,
  RefreshCcw,
  Monitor,
  Play
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

  useEffect(() => {
    const provider = ogMockService.getProvider();
    if (provider && provider.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAgentState(prev => ({ ...prev, walletAddress: accounts[0] }));
          setError(null);
        } else {
          setAgentState(prev => ({ ...prev, walletAddress: null }));
        }
      };
      const handleChainChanged = () => window.location.reload();

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);

      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        }
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

  const handleConnect = async (simulate: boolean = false) => {
    setError(null);
    setIsConnecting(true);
    try {
      const address = await ogMockService.connectWallet(simulate);
      const newState = { ...agentState, walletAddress: address };
      setAgentState(newState);
      ogMockService.saveMemSync(newState);
    } catch (err: any) {
      console.error("Wallet Error:", err);
      setError(err.message || "Connection failed.");
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
        onConnect={() => handleConnect(false)}
        isSyncing={isSyncing} 
        isConnecting={isConnecting}
      />

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="TOTAL AUM (TEE)" value={`$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subValue="Live Revaluation" icon={<Wallet className="text-cyan-400" />} />
            <StatCard label="RISK INDEX" value="18.5" subValue="Stable Range" icon={<BarChart3 className="text-purple-400" />} />
            <StatCard label="TEE LOAD" value="14%" subValue="Isolated" icon={<Cpu className="text-emerald-400" />} />
            <StatCard label="NODES" value="1,402" subValue="Decentralized" icon={<Globe className="text-blue-400" />} />
          </div>

          {error && (
            <div className="p-8 bg-slate-900 border border-white/5 rounded-[32px] flex flex-col gap-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/20">
                    <XCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight uppercase">Initialization Conflict</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">{error.replace('SANDBOX_RESTRICTION: ', '').replace('METAMASK_NOT_FOUND: ', '')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleConnect(false)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black transition-all text-white border border-white/10 uppercase tracking-widest"
                  >
                    <RefreshCcw size={14} /> Retry
                  </button>
                  <button 
                    onClick={() => handleConnect(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-[10px] font-black transition-all text-white shadow-lg shadow-cyan-500/20 uppercase tracking-widest"
                  >
                    <Play size={14} fill="currentColor" /> Demo Mode
                  </button>
                </div>
              </div>
              
              <div className="pt-6 border-t border-white/5">
                {error.includes('SANDBOX_RESTRICTION') ? (
                  <div className="bg-cyan-500/5 p-6 rounded-2xl border border-cyan-500/20 flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-4 bg-cyan-500/10 rounded-xl text-cyan-400">
                      <Monitor size={24} />
                    </div>
                    <div>
                      <h5 className="font-black text-white uppercase text-xs mb-1 tracking-widest">Sandbox Limitation Detected</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        MetaMask is restricted inside iframes for security. To use your real wallet, <b>open this app in a new browser tab</b>. Alternatively, use <b>Demo Mode</b> to explore the dashboard.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-xl text-white">
                      <HelpCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-white uppercase text-xs mb-1 tracking-widest">Environment Setup</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        Please ensure the MetaMask extension is installed and enabled. If it is already installed, try refreshing the page.
                      </p>
                      <a href="https://metamask.io/download/" target="_blank" className="text-[9px] font-black text-cyan-400 uppercase tracking-widest border-b border-cyan-400/30 pb-0.5">Metamask.io/Download</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!agentState.walletAddress && !error && (
            <div className="p-10 glass border border-cyan-500/20 rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-10 animate-in slide-in-from-top-4 duration-500 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={160} className="text-cyan-400" />
              </div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-5 bg-cyan-500/10 rounded-3xl text-cyan-400 border border-cyan-500/20 shadow-inner group">
                  <ShieldCheck size={40} className="group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight uppercase">Identity Attestation</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    A secure cryptographic signature is required to unlock your private TEE-secured financial enclave.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
                <button 
                  onClick={() => handleConnect(false)}
                  disabled={isConnecting}
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? 'Linking Enclave...' : 'Link MetaMask'}
                </button>
                <button 
                   onClick={() => handleConnect(true)}
                   className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                >
                   Try Demo Mode
                </button>
              </div>
            </div>
          )}

          <VolatilityChart data={forecast} />

          <div className="relative glass border border-white/5 rounded-[32px] p-8 overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10">
            {attesting && (
              <div className="absolute inset-0 z-20 glass flex flex-col items-center justify-center backdrop-blur-md">
                <div className="flex items-center gap-3 bg-cyan-500/10 px-6 py-3 rounded-2xl border border-cyan-500/20 text-cyan-400 animate-pulse">
                  <Lock size={20} />
                  <span className="font-mono text-xs tracking-widest uppercase text-center leading-loose font-bold">Verifying TEE Integrity...</span>
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

        <div className="lg:col-span-4 space-y-8">
          <ChatInterface riskLevel={agentState.riskTolerance} />
          <RiskSettings current={agentState.riskTolerance} onChange={handleRiskChange} />
          
          <div className="p-6 glass border border-white/5 rounded-[32px] bg-gradient-to-br from-cyan-500/5 to-transparent shadow-xl">
             <div className="flex items-center gap-3 mb-4">
               <TrendingUp size={20} className="text-cyan-400" />
               <h4 className="text-sm font-black uppercase tracking-widest">Risk Context</h4>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Quant Agent is currently optimizing for <span className="text-white font-bold">{agentState.riskTolerance}</span> exposure. 
               Snapshot verified at {new Date(agentState.lastSync).toLocaleTimeString()}.
             </p>
          </div>
        </div>
      </main>

      <footer className="p-10 border-t border-white/5 bg-slate-950/20 text-center">
        <p className="text-[10px] font-mono uppercase tracking-[0.5em] text-slate-600">&copy; 2025 OPENGRADIENT SOVEREIGN QUANTITATIVE RISK SYSTEM | TESTNET NODE</p>
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
