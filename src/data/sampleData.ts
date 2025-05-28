import { ExtendedStockData } from '../components/EnhancedPortfolioTable';

export interface StockData {
  ticker: string;
  status: 'Open' | 'Closed';
  daysHeld: number | null;
  tradeMgt: string;
  setup: string;
  openRisk: number;
  sizePercent: number;
  price: number;
  returnPercent: number;
  cap?: 'Largecap' | 'Midcap' | 'Smallcap';
  position?: '1/2' | '1/3' | '1/4' | 'Full';
  sector?: string;
  chartData?: any[]; // Simplified for now
}

export interface PortfolioData {
  stocks: StockData[];
  totalOpenRisk: number;
  totalInvested: number;
}

export interface PortfolioSettings {
  title: string;
  date: string;
  maxRiskPerEntry: number;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface EnhancedPortfolioData {
  stocks: ExtendedStockData[];
  totalOpenRisk: number;
  totalInvested: number;
  settings: PortfolioSettings;
}

export const samplePortfolioData: EnhancedPortfolioData = {
  stocks: [
    {
      ticker: 'TI', status: 'Open', tradeMgt: 'SL + BE', setup: 'ITB', openRisk: 0, sizePercent: 20.90, price: 795.00, cap: 'Midcap', position: '1/3', industry: 'Breweries & Distilleries', buyPrice: 100,
    },
    {
      ticker: 'DHANI', status: 'Open', tradeMgt: 'SL + BE', setup: 'ITB', openRisk: 0, sizePercent: 15.20, price: 442.85, cap: 'Smallcap', position: '1/4', industry: 'Financial Services', buyPrice: 100,
    },
    {
      ticker: 'MOBIKWIK', status: 'Open', tradeMgt: 'Open risk', setup: 'IPO Base', openRisk: 0.56, sizePercent: 13.40, price: 768.75, cap: 'Largecap', position: '1/2', industry: 'Fintech', buyPrice: 100,
    },
    {
      ticker: 'EIEL', status: 'Open', tradeMgt: 'Open risk', setup: 'IPO Base', openRisk: 0.32, sizePercent: 10.00, price: 0, cap: 'Midcap', position: '1/4', industry: 'Engineering', buyPrice: 100,
    },
    {
      ticker: 'DAMCAPITAL', status: 'Open', tradeMgt: 'Open risk', setup: 'IPO Base', openRisk: 0.44, sizePercent: 12.50, price: 0, cap: 'Smallcap', position: '1/2', industry: 'Investment Banking', buyPrice: 100,
    },
  ] as ExtendedStockData[],
  totalOpenRisk: 1.32,
  totalInvested: 72.00,
  settings: {
    title: 'Portfolio Snapshot',
    date: '', // This will be set dynamically
    maxRiskPerEntry: 1,
  },
};

export const performanceData = [
  { date: '02-Jan', mbi: 497.2, chg: -50.9, r20: 94.6, chg20: 39.1, r50: 79.1, chg50: 18.8, s2wh: 2.2, s2wl: 0.4 },
  { date: '01-Jan', mbi: 1013, chg: 213, r20: 68, chg20: 58.5, r50: 66.6, chg50: 25.9, s2wh: 1.7, s2wl: 0.5 },
  { date: '31-Dec', mbi: 323.7, chg: 508.3, r20: 42.9, chg20: 23.5, r50: 52.9, chg50: 12, s2wh: 1.3, s2wl: 2.3 },
  { date: '30-Dec', mbi: 53.2, chg: -68.5, r20: 34.7, chg20: -9.9, r50: 47.3, chg50: -11.4, s2wh: 2.1, s2wl: 3 },
  { date: '27-Dec', mbi: 168.8, chg: 66.6, r20: 38.5, chg20: 8.5, r50: 53.3, chg50: 2.7, s2wh: 1.1, s2wl: 1.6 }
];

// Sample chart data (simplified)
export const chartData = {
  TI: [
    { date: '2025-01-01', open: 750, close: 780, high: 790, low: 745, volume: 5000 },
    { date: '2025-01-02', open: 780, close: 795, high: 810, low: 775, volume: 6200 },
  ],
  DHANI: [
    { date: '2025-01-01', open: 420, close: 430, high: 435, low: 418, volume: 3500 },
    { date: '2025-01-02', open: 430, close: 440, high: 445, low: 428, volume: 4100 },
  ],
  MOBIKWIK: [
    { date: '2025-01-01', open: 740, close: 750, high: 755, low: 735, volume: 2800 },
    { date: '2025-01-02', open: 750, close: 760, high: 765, low: 748, volume: 3200 },
  ]
};
