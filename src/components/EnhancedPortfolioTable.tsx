import React, { useState, useEffect, useMemo } from 'react';
import { parseCsvToIndustryMap, SymbolIndustryMap } from '../csvUtils';
import { useAuthContext } from '../context/AuthContext';
import { useCircuitLimit } from '../services/strikeApi';

interface ExtendedStockData {
  ticker: string;
  status: string;
  buyDateString?: string; // dd-mm-yyyy
  tradeMgt: string;
  setup: string;
  openRisk: number;
  sizePercent: number;
  price: number;
  returnPercent?: number;
  industry: string;
  cap: string;
  position: string;
  buyPrice?: number;
}

const setupTypes = [
  'ITB',
  'Chop BO',
  'IPO Base',
  '3/5/8',
  '21/50',
  'Breakout',
  'Pullback',
  'Reversal',
  'Continuation',
  'Gap Fill',
  'OTB',
  'Stage 2',
  'ONP BO',
  'EP',
  'Pivot Bo',
  'Cheat',
  'Flag',
  'Other'
];

const statusTypes = [
  'Open',
  'Closed',
  'Watch'
];

const tradeMgtTypes = [
  'Open risk',
  'Trailing stop',
  'Take profit',
  'Stop loss',
  'SL=BE',
  'SL>BE',
  'SL<BE',
  'Hold',
  'Cost'
];

const statusOptions = ['Open', 'Closed'];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (X11; Linux i686; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 Edg/131.0.2903.86",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Helper to get current IST date/time
function getISTDate() {
  // IST is UTC+5:30
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (5.5 * 60 * 60 * 1000));
}

function getStrikeApiUrl(ticker: string): string {
  const strikeTicker = `EQ:${ticker.replace('.NS', '')}`;
  const encodedTicker = encodeURIComponent(strikeTicker);
  const istNow = getISTDate();
  const yyyy = istNow.getFullYear();
  const mm = String(istNow.getMonth() + 1).padStart(2, '0');
  const dd = String(istNow.getDate()).padStart(2, '0');
  const dayOfWeek = istNow.getDay(); // 0=Sunday, 6=Saturday
  const pad = (n: number) => String(n).padStart(2, '0');

  // Market hours in IST
  const marketOpen = new Date(istNow);
  marketOpen.setHours(9, 15, 0, 0);
  const marketClose = new Date(istNow);
  marketClose.setHours(15, 30, 0, 0);

  let candleInterval, from, to;
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend: fetch historical daily data
    candleInterval = '1d';
    from = `2023-01-01T09:15:59+05:30`;
    to = `${yyyy}-${mm}-${dd}T15:30:00+05:30`;
  } else if (istNow >= marketOpen && istNow <= marketClose) {
    // Market day and within market hours: fetch today's 1m data
    candleInterval = '1m';
    from = `${yyyy}-${mm}-${dd}T09:15:59+05:30`;
    to = `${yyyy}-${mm}-${dd}T${pad(istNow.getHours())}:${pad(istNow.getMinutes())}:${pad(istNow.getSeconds())}+05:30`;
  } else {
    // Market day but outside market hours: fetch historical daily data
    candleInterval = '1d';
    from = `2023-01-01T09:15:59+05:30`;
    to = `${yyyy}-${mm}-${dd}T15:30:00+05:30`;
  }
  const encodedFrom = encodeURIComponent(from);
  const encodedTo = encodeURIComponent(to);
  return `https://api-prod-v21.strike.money/v2/api/equity/priceticks?candleInterval=${candleInterval}&from=${encodedFrom}&to=${encodedTo}&securities=${encodedTicker}`;
}

async function fetchStrikeLatestClose(ticker: string): Promise<number | null> {
  const url = getStrikeApiUrl(ticker);
  try {
    const res = await fetch(url);
    const json = await res.json();
    const ticks = json.data?.ticks?.[ticker.replace('.NS', '')];
    if (ticks && ticks.length > 0) {
      const lastTick = ticks[ticks.length - 1];
      return lastTick[4]; // close price
    }
  } catch (error) {
    console.error('Error fetching Strike price:', error);
  }
  return null;
}

const TickerTooltip: React.FC<{ ticker: string }> = ({ ticker }) => {
  const { circuitLimit, isLoading } = useCircuitLimit(ticker);
  
  if (isLoading) return null;
  if (!circuitLimit?.upperPrice || !circuitLimit?.lowerPrice) return null;
  
  // Calculate the percentage difference between upper and lower circuit
  const midPrice = (circuitLimit.upperPrice + circuitLimit.lowerPrice) / 2;
  const upperDiff = ((circuitLimit.upperPrice - midPrice) / midPrice * 100).toFixed(2);
  const lowerDiff = ((midPrice - circuitLimit.lowerPrice) / midPrice * 100).toFixed(2);
  
  return (
    <div className="absolute left-1/2 -translate-x-1/2 -top-1 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 pointer-events-none">
      <div className="relative">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
        <div className="bg-white border border-gray-200 rounded-md shadow-md px-2 py-1 whitespace-nowrap relative">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
              <span className="text-xs font-medium">+{upperDiff}%</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
              <span className="text-xs font-medium">-{lowerDiff}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EnhancedPortfolioTable: React.FC<{
  stocks: ExtendedStockData[];
  onStocksChange: (newStocks: ExtendedStockData[]) => void;
}> = ({ stocks, onStocksChange }) => {
  const { user } = useAuthContext();
  const [editCell, setEditCell] = useState<{ rowIdx: number | null; field: keyof ExtendedStockData | null }>({ rowIdx: null, field: null });
  const [editValue, setEditValue] = useState<string | number | null | undefined>(null);
  const [symbolIndustryMap, setSymbolIndustryMap] = useState<SymbolIndustryMap>({});
  const [tickerSuggestions, setTickerSuggestions] = useState<string[]>([]);
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);
  const [editingBuyDateIdx, setEditingBuyDateIdx] = useState<number | null>(null);
  const [priceLoadingIdx, setPriceLoadingIdx] = useState<number | null>(null);
  const [priceErrorIdx, setPriceErrorIdx] = useState<number | null>(null);
  const [highlightedRows, setHighlightedRows] = useState<number[]>([]);

  // Load CSV and parse mapping on mount
  useEffect(() => {
    fetch('/Basic_RS_Setup.csv')
      .then(res => res.text())
      .then(csv => setSymbolIndustryMap(parseCsvToIndustryMap(csv)))
      .catch(() => setSymbolIndustryMap({}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout | null = null;
    const istNow = getISTDate();
    const dayOfWeek = istNow.getDay();
    const marketOpen = new Date(istNow);
    marketOpen.setHours(9, 15, 0, 0);
    const marketClose = new Date(istNow);
    marketClose.setHours(15, 30, 0, 0);
    const isMarketLive = (dayOfWeek >= 1 && dayOfWeek <= 5) && (istNow >= marketOpen && istNow <= marketClose);

    const updateAll = async () => {
      const updatedStocks = [...stocks];
      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        if (stock.buyPrice && !isNaN(stock.buyPrice) && stock.buyPrice > 0) {
          const currentPrice = await fetchStrikeLatestClose(stock.ticker);
          if (currentPrice !== null) {
            const newReturn = ((currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
            if (updatedStocks[i].returnPercent !== newReturn) {
              updatedStocks[i] = {
                ...stock,
                returnPercent: newReturn,
              };
              setHighlightedRows(prev => [...prev, i]);
              setTimeout(() => {
                setHighlightedRows(prev => prev.filter(idx => idx !== i));
              }, 500); // highlight for 0.5s
            } else {
              updatedStocks[i] = {
                ...stock,
                returnPercent: newReturn,
              };
            }
          }
          // Wait 1.5 seconds between API calls
          await new Promise(res => setTimeout(res, 1500));
          if (cancelled) return;
        }
      }
      onStocksChange(updatedStocks);
    };

    if (isMarketLive) {
      updateAll(); // Initial fetch
      interval = setInterval(updateAll, 60 * 1000); // Refresh every 1 minute
    } else {
      updateAll(); // Fetch once outside market hours
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Progress bar calculations
  const openRiskPercent = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + (stock.openRisk || 0), 0).toFixed(2);
  }, [stocks]);
  const investedPercent = useMemo(() => {
    return stocks.reduce((sum, stock) => sum + (stock.sizePercent || 0), 0).toFixed(2);
  }, [stocks]);

  const getSizePercentColor = (size: number) => {
    if (size >= 10) return 'bg-yellow-100';
    return '';
  };

  const getTradeMgtColor = (tradeMgt: string) => {
    if (tradeMgt === 'Open risk') return 'text-red-600 bg-red-100';
    if (tradeMgt === 'Trailing stop') return 'text-green-600 bg-green-100';
    return '';
  };

  const getReturnPillStyle = (returnPercent: number) => {
    const baseStyle = 'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap';
    if (returnPercent > 0) return `${baseStyle} bg-green-100 text-green-800`;
    if (returnPercent < 0) return `${baseStyle} bg-red-100 text-red-800`;
    return `${baseStyle} bg-gray-100 text-gray-800`;
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0) return 'text-red-600';
    if (risk < 0) return 'text-green-600';
    return 'text-gray-800';
  };

  const commonTransition = "transition-all duration-150 ease-in-out";

  const getStatusPillStyle = (status: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (status) {
      case 'Open': pillClass += 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'; break;
      case 'Closed': pillClass += 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'; break;
      case 'Watch': pillClass += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  const getTradeMgtPillStyle = (tradeMgt: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (tradeMgt) {
      case 'Open risk': pillClass += 'bg-red-200 text-red-800 hover:bg-red-300 border border-red-200'; break;
      case 'Trailing stop': pillClass += 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'; break;
      case 'Take profit': pillClass += 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'; break;
      case 'Stop loss': pillClass += 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'; break;
      case 'Hold': pillClass += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'; break;
      case 'Cost': pillClass += 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border border-cyan-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  const getCapStyle = (cap: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (cap) {
      case 'Large Cap': pillClass += 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'; break;
      case 'Mid Cap': pillClass += 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'; break;
      case 'Small Cap': pillClass += 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'; break;
      case 'Micro Cap': pillClass += 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'; break;
      case 'Nano Cap': pillClass += 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  const getSetupPillStyle = (setup: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (setup) {
      case 'ITB': pillClass += 'bg-pink-100 text-pink-700 hover:bg-pink-200 border border-pink-200'; break;
      case 'Pivot BO': pillClass += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'; break;
      case 'OTB': pillClass += 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  const getIndustryStyle = (industry: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (industry) {
      case 'Technology': pillClass += 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'; break;
      case 'Financial': pillClass += 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'; break;
      case 'Healthcare': pillClass += 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'; break;
      case 'Consumer Cyclical': pillClass += 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'; break;
      case 'Industrial': pillClass += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'; break;
      case 'Energy': pillClass += 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-200'; break;
      case 'Utilities': pillClass += 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'; break;
      case 'Communication': pillClass += 'bg-pink-100 text-pink-800 hover:bg-pink-200 border border-pink-200'; break;
      case 'Basic Materials': pillClass += 'bg-teal-100 text-teal-800 hover:bg-teal-200 border border-teal-200'; break;
      case 'Real Estate': pillClass += 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  const getPositionStyle = (position: string) => {
    let pillClass = `px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full whitespace-nowrap ${commonTransition} hover:shadow-md cursor-pointer `;
    switch (position) {
      case '1/4': pillClass += 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'; break;
      case '1/2': pillClass += 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'; break;
      case '3/4': pillClass += 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'; break;
      case 'Full': pillClass += 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'; break;
      case '2x': pillClass += 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200'; break;
      case '3x': pillClass += 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-200'; break;
      default: pillClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'; break;
    }
    return pillClass;
  };

  // TypeScript type definitions for arrays
  const industries: string[] = [
    'Technology',
    'Financial',
    'Healthcare',
    'Consumer Cyclical',
    'Industrial',
    'Energy',
    'Utilities',
    'Communication',
    'Basic Materials',
    'Real Estate'
  ];
  
  const marketCaps: string[] = [
    'Large Cap',
    'Mid Cap',
    'Small Cap',
    'Micro Cap',
    'Nano Cap'
  ];
  
  const positionSizes: string[] = [
    '1/4',
    '1/2',
    '3/4',
    'Full',
    '2x',
    '3x'
  ];
  
  // Alias the style functions for consistency
  const getIndustryPillStyle = getIndustryStyle;
  const getCapPillStyle = getCapStyle;
  const getPositionPillStyle = getPositionStyle;

  const handleCellEdit = (rowIdx: number, field: keyof ExtendedStockData, value: any) => {
    setEditCell({ rowIdx, field });
    if (field === 'returnPercent') {
      setEditValue(stocks[rowIdx].buyPrice ?? '');
    } else {
      setEditValue(value);
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { value } = e.target;
    // If editing the ticker, auto-fill industry if mapping exists
    if (editCell.field === 'ticker') {
      const upperTicker = value.toUpperCase();
      // Autocomplete suggestions
      const allTickers = Object.keys(symbolIndustryMap);
      const suggestions = allTickers.filter(ticker => ticker.startsWith(upperTicker)).slice(0, 10);
      setTickerSuggestions(suggestions);
      setShowTickerDropdown(true);
      const mappedIndustry = symbolIndustryMap[upperTicker];
      if (mappedIndustry !== undefined) {
        // Update the industry cell for this row
        const updatedStocks = stocks.map((stock, idx) =>
          idx === editCell.rowIdx ? { ...stock, industry: mappedIndustry } : stock
        );
        onStocksChange(updatedStocks);
      }
    }
    setEditValue(value);
  };

  // When a ticker suggestion is selected
  const handleTickerSuggestionSelect = (suggestion: string) => {
    setEditValue(suggestion.toUpperCase());
    setShowTickerDropdown(false);
    // Auto-fill industry
    const mappedIndustry = symbolIndustryMap[suggestion];
    if (mappedIndustry !== undefined && editCell.rowIdx !== null) {
      const updatedStocks = stocks.map((stock, idx) =>
        idx === editCell.rowIdx ? { ...stock, industry: mappedIndustry } : stock
      );
      onStocksChange(updatedStocks);
    }
  };

  // Helper function to find closest ticker match
  const findClosestTicker = (inputTicker: string): string | null => {
    if (!inputTicker) return null;
    
    const upperTicker = inputTicker.toUpperCase();
    const allTickers = Object.keys(symbolIndustryMap);
    
    // First try exact match
    if (allTickers.includes(upperTicker)) {
      return upperTicker;
    }
    
    // Try to find similar tickers (case-insensitive contains)
    const similarTickers = allTickers.filter(ticker => 
      ticker.includes(upperTicker) || 
      upperTicker.includes(ticker) ||
      ticker.replace(/\./g, '').includes(upperTicker.replace(/\./g, '')) ||
      upperTicker.replace(/\./g, '').includes(ticker.replace(/\./g, ''))
    );
    
    // Return the first similar ticker if found
    return similarTickers.length > 0 ? similarTickers[0] : null;
  };

  const handleCellBlur = (rowIdx: number, field: keyof ExtendedStockData) => {
    // If ticker field is being cleared, remove the entire row
    if (field === 'ticker' && (!editValue || editValue === '')) {
      deleteStock(rowIdx);
      setEditCell({ rowIdx: null, field: null });
      setEditValue(null);
      return;
    }

    const newStocks = [...stocks];
    let valueToUpdate: any = editValue;

    if (field === 'ticker' && valueToUpdate) {
      // For ticker field, try to find the closest match
      const closestTicker = findClosestTicker(valueToUpdate as string);
      if (closestTicker) {
        valueToUpdate = closestTicker;
        // Update industry if ticker was corrected
        const mappedIndustry = symbolIndustryMap[closestTicker];
        if (mappedIndustry) {
          newStocks[rowIdx].industry = mappedIndustry;
        }
      } else if (valueToUpdate === 'NEW') {
        valueToUpdate = ''; // Clear the default 'NEW' value if no match found
      }
    } else if (typeof stocks[rowIdx][field] === 'number' || stocks[rowIdx][field] === null) {
      // Handle numeric fields
      if (editValue === '' || editValue === null || editValue === undefined) {
        valueToUpdate = null;
      } else {
        valueToUpdate = parseFloat(editValue as string);
        if (isNaN(valueToUpdate)) valueToUpdate = null;
      }
    }

    (newStocks[rowIdx] as any)[field] = valueToUpdate;
    onStocksChange(newStocks);
    setEditCell({ rowIdx: null, field: null });
    setEditValue(null);
    setShowTickerDropdown(false);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, rowIdx: number, field: keyof ExtendedStockData) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      setEditCell({ rowIdx: null, field: null });
      setEditValue(null);
    }
  };

  const addNewStock = () => {
    const newStockData: ExtendedStockData = {
      ticker: 'NEW',
      status: 'Open',
      buyDateString: '',
      tradeMgt: 'Open risk',
      setup: 'ITB',
      openRisk: 0,
      sizePercent: 0,
      price: 0,
      returnPercent: 0,
      industry: 'Financial',
      cap: 'Mid Cap',
      position: '1/2'
    };
    onStocksChange([...stocks, newStockData]);
  };

  const deleteStock = (index: number) => {
    const newStocks = stocks.filter((_, i) => i !== index);
    onStocksChange(newStocks);
  };

  const commonInputClass = `border border-gray-300 px-3 py-2 w-full min-w-[80px] text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white z-10 ${commonTransition}`;
  const selectInputClass = `${commonInputClass} ring-2 ring-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500`;

  const parseDateString = (dateStr?: string) => {
    if (!dateStr) return null;
    let day, month, year;
    const cleaned = dateStr.replace(/\s+/g, '');
    if (cleaned.includes('-') || cleaned.includes('/')) {
      const parts = cleaned.split(/[-\/]/);
      if (parts.length === 3) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
      }
    } else if (cleaned.length === 8) {
      day = parseInt(cleaned.slice(0, 2), 10);
      month = parseInt(cleaned.slice(2, 4), 10);
      year = parseInt(cleaned.slice(4, 8), 10);
    } else if (cleaned.length === 6) {
      day = parseInt(cleaned.slice(0, 2), 10);
      month = parseInt(cleaned.slice(2, 4), 10);
      year = parseInt(cleaned.slice(4, 6), 10) + 2000;
    }
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const calculateDaysHeld = (dateStr?: string) => {
    const buyDate = parseDateString(dateStr);
    if (!(buyDate instanceof Date) || isNaN(buyDate.getTime())) return '-';
    const now = new Date();
    const diff = Math.floor((now.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : '-';
  };

  const handleBuyPriceChange = async (index: number) => {
    const stock = stocks[index];
    const buyPrice = parseFloat(editValue as string);
    const updatedStocks = [...stocks];
    updatedStocks[index].buyPrice = buyPrice;
    setPriceLoadingIdx(index);
    setPriceErrorIdx(null);
    try {
      const currentPrice = await fetchStrikeLatestClose(stock.ticker);
      if (currentPrice !== null && !isNaN(buyPrice) && buyPrice > 0) {
        updatedStocks[index].returnPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
      } else {
        updatedStocks[index].returnPercent = undefined;
        setPriceErrorIdx(index);
      }
      onStocksChange(updatedStocks);
    } catch (err) {
      setPriceErrorIdx(index);
    } finally {
      setPriceLoadingIdx(null);
    }
  };

  return (
    <>
      <div className="flex items-center mb-4 space-x-4 px-4">
        <div className="flex items-center space-x-2">
          <div className="w-24 h-2 bg-red-200 rounded">
            <div className="h-2 bg-red-500 rounded" style={{ width: `${openRiskPercent}%` }} />
          </div>
          <span className="text-xs text-gray-700">{openRiskPercent}% Open Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-24 h-2 bg-blue-200 rounded">
            <div className="h-2 bg-blue-500 rounded" style={{ width: `${investedPercent}%` }} />
          </div>
          <span className="text-xs text-gray-700">{investedPercent}% Invested</span>
        </div>
      </div>
      <div className="mb-4 w-full px-4 pt-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Portfolio Holdings</h3>
        <button
          onClick={addNewStock}
          className="p-1 text-black hover:text-gray-600 transition-all duration-150 ease-in-out inline-flex items-center"
          aria-label="Add Stock"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="w-full overflow-x-auto">
          <table className="min-w-full border-collapse">
            <colgroup>
              <col className="w-32" /> {/* Ticker */}
              <col className="w-24" /> {/* Status */}
              <col className="w-20" /> {/* Buy Date (dd-mm-yyyy) */}
              <col className="w-20" /> {/* Days Held */}
              <col className="w-28" /> {/* Setup */}
              <col className="w-24" /> {/* Trade Mgt */}
              <col className="w-16" /> {/* Risk % */}
              <col className="w-20" /> {/* Return % */}
              <col className="w-16" /> {/* Size % */}
              <col className="w-24" /> {/* Industry */}
              <col className="w-20" /> {/* Position */}
              <col className="w-16" /> {/* Delete */}
            </colgroup>
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">

            <th className="py-2 pr-4 whitespace-nowrap">Ticker</th>
            <th className="py-2 px-4 whitespace-nowrap">Status</th>
            <th className="py-2 px-4 whitespace-nowrap">Days Held</th>
            <th className="py-2 px-4 whitespace-nowrap">Setup</th>
            <th className="py-2 px-4 whitespace-nowrap">Trade Mgt</th>
            <th className="py-2 px-4 whitespace-nowrap">Risk %</th>
            <th className="py-2 px-4 whitespace-nowrap">Return %</th>
            <th className="py-2 px-4 whitespace-nowrap">Size %</th>
            <th className="py-2 px-4 whitespace-nowrap">Industry</th>
            <th className="py-2 px-4 whitespace-nowrap">Position</th>
            <th className="py-2 px-4 whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index} className={`text-sm hover:bg-gray-50 ${commonTransition} ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="py-2 pr-4 whitespace-nowrap">
                <div className="flex items-center">
                  {editCell.rowIdx === index && editCell.field === 'ticker' ? (
                    <div className="relative">
                      <div className="flex items-center">
                        <span className="text-gray-700 font-bold text-xs mr-1 w-4 text-right relative top-0.5">{index + 1}.</span>
                        <input 
                          type="text" 
                          value={(editValue as string ?? stock.ticker).toUpperCase()} 
                          onChange={handleCellChange} 
                          onBlur={() => { setTimeout(() => setShowTickerDropdown(false), 100); handleCellBlur(index, 'ticker'); }}
                          onFocus={() => setShowTickerDropdown(true)}
                          onKeyDown={(e) => handleCellKeyDown(e, index, 'ticker')} 
                          className={`${commonInputClass} w-full bg-transparent`} 
                          autoFocus 
                          autoComplete="off"
                        />
                      </div>
                      {showTickerDropdown && tickerSuggestions.length > 0 && (
                        <ul className="absolute z-50 bg-white mt-1 w-full" style={{listStyleType: 'none', margin: 0, padding: 0}}>
                          {tickerSuggestions.map((suggestion) => (
                            <li
                              key={suggestion}
                              className="px-3 py-1 cursor-pointer hover:bg-blue-100 text-sm"
                              onMouseDown={() => handleTickerSuggestionSelect(suggestion)}
                              style={{border: 'none', boxShadow: 'none'}}>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="relative flex items-center group">
                      <span className="text-gray-700 font-bold text-xs mr-1 w-4 text-right relative top-0.5">{index + 1}.</span>
                      <div className="relative group inline-block">
                        <span 
                          className="cursor-pointer font-medium text-gray-800 hover:opacity-75 block w-full px-2 py-1"
                          onClick={() => handleCellEdit(index, 'ticker', stock.ticker)}
                        >
                          {stock.ticker}
                        </span>
                        <TickerTooltip ticker={stock.ticker} />
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-4 whitespace-nowrap">
                {editCell.rowIdx === index && editCell.field === 'status' ? (
                   <select value={editValue as string ?? stock.status} onChange={handleCellChange} onBlur={() => handleCellBlur(index, 'status')} onKeyDown={(e) => handleCellKeyDown(e, index, 'status')} className={commonInputClass} autoFocus>
                    {statusTypes.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                ) : (
                  <div className={getStatusPillStyle(stock.status)} onClick={() => handleCellEdit(index, 'status', stock.status)}>
                    <span>{stock.status}</span>
                    <span className="ml-1.5">▼</span>
                  </div>
                )}
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="flex flex-col">
                  <input
                    type="text"
                    placeholder="Buy Date (ddmmyyyy, ddmmyy, dd-mm-yyyy, dd-mm-yy, dd/mm/yyyy, dd/mm/yy)"
                    value={
                      editingBuyDateIdx === index
                        ? (stock.buyDateString || '')
                        : stock.buyDateString
                          ? `${calculateDaysHeld(stock.buyDateString)} days`
                          : ''
                    }
                    onFocus={() => setEditingBuyDateIdx(index)}
                    onBlur={() => setEditingBuyDateIdx(null)}
                    onChange={e => {
                      const updatedStocks = [...stocks];
                      updatedStocks[index].buyDateString = e.target.value;
                      onStocksChange(updatedStocks);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={commonInputClass}
                    maxLength={20}
                  />
                </div>
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'setup' ? (
                    <select 
                      value={editValue as string ?? stock.setup} 
                      onChange={handleCellChange} 
                      onBlur={() => handleCellBlur(index, 'setup')} 
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'setup')} 
                      className={`${commonInputClass} w-full ring-2 ring-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white z-10 ${commonTransition}`} 
                      autoFocus
                    >
                      {setupTypes.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <div className={getSetupPillStyle(stock.setup)} onClick={() => handleCellEdit(index, 'setup', stock.setup)}>
                      {stock.setup}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'tradeMgt' ? (
                    <select 
                      value={editValue as string ?? stock.tradeMgt} 
                      onChange={handleCellChange} 
                      onBlur={() => handleCellBlur(index, 'tradeMgt')} 
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'tradeMgt')} 
                      className={`${commonInputClass} w-full ring-2 ring-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white z-10 ${commonTransition}`} 
                      autoFocus
                    >
                      {tradeMgtTypes.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <div className={getTradeMgtPillStyle(stock.tradeMgt)} onClick={() => handleCellEdit(index, 'tradeMgt', stock.tradeMgt)}>
                      {stock.tradeMgt}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'openRisk' ? (
                    <input 
                      type="number" 
                      value={editValue as string ?? stock.openRisk} 
                      onChange={handleCellChange} 
                      onBlur={() => handleCellBlur(index, 'openRisk')} 
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'openRisk')} 
                      step="0.01" 
                      className={`${commonInputClass} w-full`} 
                      autoFocus 
                    />
                  ) : (
                    <span 
                      className={`cursor-pointer ${getRiskColor(stock.openRisk)} hover:opacity-75 ${commonTransition} block w-full px-2 py-1`} 
                      onClick={() => handleCellEdit(index, 'openRisk', stock.openRisk)}>
                      {stock.openRisk === 0 ? '0%' : `${stock.openRisk > 0 ? '' : '-'}${Math.abs(stock.openRisk).toFixed(2)}%`}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'returnPercent' ? (
                    <input 
                      type="number" 
                      placeholder="Buy Price"
                      value={editValue as string ?? stock.buyPrice ?? ''}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => {
                        setEditCell({ rowIdx: null, field: null });
                        setEditValue(null);
                      }}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          const buyPrice = parseFloat(editValue as string);
                          const updatedStocks = [...stocks];
                          updatedStocks[index].buyPrice = buyPrice;
                          setPriceLoadingIdx(index);
                          setPriceErrorIdx(null);
                          try {
                            const currentPrice = await fetchStrikeLatestClose(stock.ticker);
                            if (currentPrice !== null && !isNaN(buyPrice) && buyPrice > 0) {
                              updatedStocks[index].returnPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
                            } else {
                              updatedStocks[index].returnPercent = undefined;
                              setPriceErrorIdx(index);
                            }
                            onStocksChange(updatedStocks);
                          } catch (err) {
                            setPriceErrorIdx(index);
                          } finally {
                            setPriceLoadingIdx(null);
                          }
                          setEditCell({ rowIdx: null, field: null });
                          setEditValue(null);
                        }
                        if (e.key === 'Escape') {
                          setEditCell({ rowIdx: null, field: null });
                          setEditValue(null);
                        }
                      }}
                      step="0.01"
                      className={`${commonInputClass} w-full`}
                      autoFocus
                    />
                  ) : (
                    <div className="flex justify-center">
                      <span 
                        className={`cursor-pointer ${getReturnPillStyle(stock.returnPercent ?? 0)} ${highlightedRows.includes(index) ? 'bg-yellow-200 transition-all' : ''} hover:opacity-75 ${commonTransition} inline-flex items-center`} 
                        onClick={() => handleCellEdit(index, 'returnPercent', stock.returnPercent)}>
                        {stock.returnPercent === 0 ? '0%' : `${(stock.returnPercent ?? 0) > 0 ? '+' : ''}${Math.abs(stock.returnPercent ?? 0).toFixed(2)}%`}
                      </span>
                    </div>
                  )}
                </div>
              </td>
              <td className={`py-2 px-2 whitespace-nowrap ${editCell.rowIdx === index && editCell.field === 'sizePercent' ? '' : getSizePercentColor(stock.sizePercent)}`}>
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'sizePercent' ? (
                    <input 
                      type="number" 
                      value={editValue as string ?? stock.sizePercent} 
                      onChange={handleCellChange} 
                      onBlur={() => handleCellBlur(index, 'sizePercent')} 
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'sizePercent')} 
                      step="0.01" 
                      className={`${commonInputClass} w-full bg-transparent`} 
                      autoFocus 
                    />
                  ) : (
                    <span 
                      className={`cursor-pointer font-medium text-gray-800 hover:opacity-75 ${commonTransition} block w-full px-2 py-1`} 
                      onClick={() => handleCellEdit(index, 'sizePercent', stock.sizePercent)}>
                      {stock.sizePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  <div className={getIndustryPillStyle(stock.industry)}>
                    {stock.industry}
                  </div>
                </div>
              </td>

              <td className="py-2 px-2 whitespace-nowrap">
                <div className="relative">
                  {editCell.rowIdx === index && editCell.field === 'position' ? (
                    <select 
                      value={editValue as string ?? stock.position} 
                      onChange={handleCellChange} 
                      onBlur={() => handleCellBlur(index, 'position')} 
                      onKeyDown={(e) => handleCellKeyDown(e, index, 'position')} 
                      className={`${selectInputClass} w-full`} 
                      autoFocus>
                      {positionSizes.map((pos: string) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  ) : (
                    <div className={getPositionPillStyle(stock.position)} onClick={() => handleCellEdit(index, 'position', stock.position)}>
                      {stock.position}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-4 whitespace-nowrap text-center">
                <button 
                  onClick={() => deleteStock(index)} 
                  className={`p-1.5 text-red-500 rounded hover:bg-red-100 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 ${commonTransition}`}
                  aria-label="Delete stock"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}

          <tr className="text-sm font-medium bg-gray-50 border-t border-gray-200">
            <td className="py-2 px-2"></td> {/* Ticker */}
            <td className="py-2 px-2"></td> {/* Status */}
            <td className="py-2 px-2"></td> {/* Days Held */}
            <td className="py-2 px-2"></td> {/* Setup */}
            <td className="py-2 px-2"></td> {/* Trade Mgt */}
            <td className="py-2 px-2 text-right font-semibold text-gray-800">
              {stocks.reduce((sum, stock) => sum + (stock.openRisk || 0), 0).toFixed(2)}%
            </td>
            <td className="py-2 px-2 text-right font-semibold text-gray-800">
              {stocks.length > 0 
                ? (stocks.reduce((sum, stock) => sum + (stock.returnPercent || 0), 0) / stocks.length).toFixed(2) 
                : '0.00'}%
            </td>
            <td className="py-2 px-2 text-right font-semibold text-gray-800">
              {stocks.reduce((sum, stock) => sum + (stock.sizePercent || 0), 0).toFixed(2)}%
            </td>
            <td className="py-2 px-2"></td> {/* Industry */}
            <td className="py-2 px-2"></td> {/* Position */}
          </tr>
        </tbody>
      </table>
    </div>
  </>
  );
};

export { EnhancedPortfolioTable };
export type { ExtendedStockData };
export { setupTypes, tradeMgtTypes, fetchStrikeLatestClose };
export default EnhancedPortfolioTable;
