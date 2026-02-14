
export enum RiskTolerance {
  CONSERVATIVE = 'Conservative',
  MODERATE = 'Moderate',
  DEGEN = 'Degen'
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  valueUsd: number;
  change24h: number;
}

export interface VolatilityForecast {
  timestamp: string;
  volatility: number;
  prediction: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentState {
  riskTolerance: RiskTolerance;
  teeVerified: boolean;
  memSyncActive: boolean;
  lastSync: number;
  walletAddress: string | null;
  network: string;
}
