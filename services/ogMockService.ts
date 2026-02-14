
import { RiskTolerance, VolatilityForecast, AgentState } from '../types';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

const BASE_PRICES: Record<string, number> = {
  ETH: 2742.58,
  BTC: 63145.20,
  SOL: 145.30,
  OG: 8.42
};

const OG_TESTNET_PARAMS = {
  chainId: '0x1F4E', 
  chainName: 'OpenGradient Testnet',
  nativeCurrency: {
    name: 'OpenGradient',
    symbol: 'OG',
    decimals: 18
  },
  rpcUrls: ['https://rpc.testnet.opengradient.ai'],
  blockExplorerUrls: ['https://explorer.testnet.opengradient.ai']
};

const DEMO_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

export const ogMockService = {
  getLivePrices: async (): Promise<PriceData[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return Object.entries(BASE_PRICES).map(([symbol, base]) => {
      const volatility = symbol === 'OG' ? 0.005 : 0.002;
      const change = (Math.random() - 0.5) * base * volatility;
      return {
        symbol,
        price: base + change,
        change24h: (Math.random() * 10) - 2
      };
    });
  },

  getVolatilityForecast: async (): Promise<VolatilityForecast[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return Array.from({ length: 24 }).map((_, i) => ({
      timestamp: `${i}:00`,
      volatility: Math.random() * 0.08 + (i > 16 ? 0.12 : 0.03),
      prediction: i > 16 ? 'HIGH' : 'LOW',
    }));
  },

  loadMemSync: (): AgentState => {
    const saved = localStorage.getItem('og_memsync_premium_v2');
    if (saved) return JSON.parse(saved);
    return {
      riskTolerance: RiskTolerance.MODERATE,
      teeVerified: true,
      memSyncActive: true,
      lastSync: Date.now(),
      walletAddress: null,
      network: 'OpenGradient Testnet'
    };
  },

  saveMemSync: (state: AgentState) => {
    localStorage.setItem('og_memsync_premium_v2', JSON.stringify({
      ...state,
      lastSync: Date.now(),
    }));
  },

  verifyTEE: async (): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  },

  /**
   * Robust Provider Discovery
   * Specifically handles getter-only window.ethereum and multi-extension conflicts.
   */
  getProvider: () => {
    const win = window as any;
    
    // 1. Check for standard injection
    let provider = win.ethereum;

    // 2. Handle multiple providers (e.g. MetaMask + other wallets)
    if (provider?.providers?.length) {
      provider = provider.providers.find((p: any) => p.isMetaMask) || provider.providers[0];
    } 
    
    // 3. Fallback to MetaMask-specific injection if window.ethereum is blocked/getter-only
    if (!provider || !provider.isMetaMask) {
      if (win.metamask) provider = win.metamask;
    }

    return provider;
  },

  connectWallet: async (simulate: boolean = false): Promise<string> => {
    if (simulate) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return DEMO_ADDRESS;
    }

    let provider = ogMockService.getProvider();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Some browsers delay injection; retry once
    if (!provider) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      provider = ogMockService.getProvider();
    }

    if (!provider) {
      if (isMobile) {
        const dappUrl = window.location.href.split('//')[1];
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
        throw new Error("MetaMask app not found. Redirecting...");
      }
      
      const isSandboxed = window.self !== window.top;
      if (isSandboxed) {
        throw new Error("SANDBOX_RESTRICTION: MetaMask cannot inject into cross-origin iframes. Please open the app in a new tab.");
      }
      
      throw new Error("METAMASK_NOT_FOUND: MetaMask extension not detected. Ensure it's installed and enabled.");
    }

    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error("Connection rejected.");
      
      const address = accounts[0];

      // Switch chain (Silent fail)
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: OG_TESTNET_PARAMS.chainId }],
        });
      } catch (e) {
        console.warn("Chain switch skipped.");
      }

      return address;
    } catch (error: any) {
      if (error.code === 4001) throw new Error("Request rejected by user.");
      if (error.code === -32002) throw new Error("A request is already pending in MetaMask.");
      throw new Error(error.message || "Failed to establish secure link.");
    }
  }
};
