
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

// OpenGradient Testnet Configuration
const OG_TESTNET_PARAMS = {
  chainId: '0x1F4E', // Hypothetical Chain ID for OpenGradient Testnet
  chainName: 'OpenGradient Testnet',
  nativeCurrency: {
    name: 'OpenGradient',
    symbol: 'OG',
    decimals: 18
  },
  rpcUrls: ['https://rpc.testnet.opengradient.ai'],
  blockExplorerUrls: ['https://explorer.testnet.opengradient.ai']
};

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
   * Real MetaMask Connection Logic
   */
  connectWallet: async (): Promise<string> => {
    const { ethereum } = window as any;
    
    if (!ethereum) {
      throw new Error("MetaMask is not installed. Please install it to continue.");
    }

    try {
      // 1. Request Account Access
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // 2. Try to Switch to OpenGradient Testnet
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: OG_TESTNET_PARAMS.chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [OG_TESTNET_PARAMS],
            });
          } catch (addError) {
            console.error("Failed to add OpenGradient Testnet", addError);
          }
        }
        console.error("Failed to switch network", switchError);
      }

      return address;
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("Connection request was rejected by the user.");
      }
      throw error;
    }
  }
};
