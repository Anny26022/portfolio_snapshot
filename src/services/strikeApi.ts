import { useState, useEffect } from 'react';

interface CircuitLimit {
  upper: number;  // in percentage
  lower: number;  // in percentage
  upperPrice?: number;  // actual upper circuit price
  lowerPrice?: number;  // actual lower circuit price
}

interface StockInfo {
  symbol: string;
  name: string;
  last_price: number;
  upper_circuit: number;
  lower_circuit: number;
  // Add other fields as needed
}

interface StrikeApiResponse {
  stocks: StockInfo[];
  indices: any[];
  tools: any[];
}

const CIRCUIT_LIMIT_CACHE: Record<string, { data: CircuitLimit; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

function calculateCircuitPercentage(price: number, circuitPrice: number): number {
  if (!price || price === 0) return 0;
  return ((circuitPrice - price) / price) * 100;
}

export async function getStockCircuitLimit(ticker: string): Promise<CircuitLimit | null> {
  const normalizedTicker = ticker.toUpperCase().replace('.NS', '');
  const now = Date.now();

  // Check cache first
  const cached = CIRCUIT_LIMIT_CACHE[normalizedTicker];
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://api-prod.strike.money/v1/api/search?q=${encodeURIComponent(normalizedTicker)}&limit=1&skip=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data: StrikeApiResponse = await response.json();
    
    if (!data.stocks || data.stocks.length === 0) {
      console.warn(`No data found for ticker: ${normalizedTicker}`);
      return null;
    }
    
    const stockInfo = data.stocks[0];
    
    if (stockInfo.upper_circuit === undefined || stockInfo.lower_circuit === undefined) {
      console.warn(`No circuit limits found for ticker: ${normalizedTicker}`);
      return null;
    }
    
    const currentPrice = stockInfo.last_price || 0;
    const circuitLimit: CircuitLimit = {
      upper: calculateCircuitPercentage(currentPrice, stockInfo.upper_circuit),
      lower: calculateCircuitPercentage(currentPrice, stockInfo.lower_circuit),
      upperPrice: stockInfo.upper_circuit,
      lowerPrice: stockInfo.lower_circuit
    };
    
    // Update cache
    CIRCUIT_LIMIT_CACHE[normalizedTicker] = {
      data: circuitLimit,
      timestamp: now
    };
    
    return circuitLimit;
  } catch (error) {
    console.error(`Error fetching circuit limit for ${normalizedTicker}:`, error);
    return null;
  }
}

// Hook for React components
export function useCircuitLimit(ticker: string | null) {
  const [circuitLimit, setCircuitLimit] = useState<CircuitLimit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ticker) {
      setCircuitLimit(null);
      return;
    }

    let isMounted = true;

    const fetchCircuitLimit = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const limit = await getStockCircuitLimit(ticker);
        if (isMounted) {
          setCircuitLimit(limit);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch circuit limit'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to prevent too many rapid requests
    const timer = setTimeout(fetchCircuitLimit, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [ticker]);

  return { circuitLimit, isLoading, error };
}
