// Core types for MerajutASA platform
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'active' | 'monitoring' | 'pending';
  metrics?: {
    value: string | number;
    label: string;
    trend?: 'up' | 'down' | 'stable';
  };
}

export interface ExplorationAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  description: string;
}

export interface TrustMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  description: string;
}

export interface EquityData {
  index: number;
  description: string;
  buckets: {
    id: string;
    label: string;
    count: number;
    percentage: number;
  }[];
}

export interface HashEntry {
  id: string;
  timestamp: string;
  action: string;
  hash: string;
  verified: boolean;
}