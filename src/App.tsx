import { useState, useRef, useEffect } from 'react';
import EnhancedPortfolioTable, { ExtendedStockData, fetchStrikeLatestClose } from './components/EnhancedPortfolioTable';
import Stats from './components/Stats';
import EditableRiskInvestmentSummary from './components/EditableRiskInvestmentSummary';
// import { getCurrentDate, formatDisplayDate } from './utils/localStorage'; // Only import date utils if needed, otherwise define locally
// import { loadCSVData } from './utils/csvLoader';
import './App.css';
import Header from './components/Header';
import { AuthModal } from './components/AuthModal';
import { useAuthContext } from './context/AuthContext';
import { saveUserPortfolioData, loadUserPortfolioData, subscribeToPortfolioChanges } from './components/utils/userDataService';
import { samplePortfolioData, EnhancedPortfolioData } from './data/sampleData';
import NSEHolidayBanner from './components/NSEHolidayBanner';
import React from 'react';
import domtoimage from 'dom-to-image';

// Default extended sample data - MODIFIED to use sampleData directly for consistency
const defaultExtendedData: EnhancedPortfolioData = {
  stocks: samplePortfolioData.stocks.map(stock => ({
    ...stock, // Spread all properties from samplePortfolioData.stocks
    // Ensure all necessary fields for ExtendedStockData are present if not in StockData
    // For example, if ExtendedStockData has fields not in StockData, provide defaults here:
    // price: stock.price !== undefined ? stock.price : 0, // Already in StockData
    // setup: stock.setup || 'Default Setup', // Already in StockData
    // chartData: stock.chartData || [], // Already in StockData
  })) as ExtendedStockData[], // Cast to ExtendedStockData[]
  totalOpenRisk: samplePortfolioData.totalOpenRisk,
  totalInvested: samplePortfolioData.totalInvested,
  settings: {
    title: 'Portfolio Snapshot',
    date: '', // getCurrentDate(),
    maxRiskPerEntry: 1
    // dateRange can be initialized if needed, e.g., dateRange: { from: '', to: '' }
  }
};

// Sample holidays array (replace with real API data as needed)
const holidays = [
  { holidayDate: '2025-01-26', purpose: 'Republic Day' },
  { holidayDate: '2025-03-17', purpose: 'Holi' },
  { holidayDate: '2025-04-14', purpose: 'Ambedkar Jayanti' },
  { holidayDate: '2025-08-15', purpose: 'Independence Day' },
  { holidayDate: '2025-10-02', purpose: 'Gandhi Jayanti' },
  { holidayDate: '2025-12-25', purpose: 'Christmas' },
  // ...add more or fetch from API
];

// Try to import User2 from lucide-react, fallback to a simple SVG if not available
const FallbackUserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className={className}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 8-4 8-4s8 0 8 4"/></svg>
);
let UserIcon: React.FC<{ className?: string }> = FallbackUserIcon;
try {
  // @ts-ignore
  // eslint-disable-next-line
  UserIcon = require('lucide-react').User2 || FallbackUserIcon;
} catch {}

function formatDateToDDMMYYYY(dateStr: string) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}-${month}-${year}`;
}

// Helper to get today's date in yyyy-mm-dd
function getTodayYYYYMMDD() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Replace DownloadIcon with a modern minimal SVG
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"/><path d="M6 15l6 6 6-6"/><rect x="4" y="21" width="16" height="2" rx="1" fill="black"/></svg>
);

function App() {
  const [portfolioData, setPortfolioData] = useState<EnhancedPortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuthContext();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  const [holidays, setHolidays] = useState<{ holidayDate: string; purpose: string }[]>([]);
  const hasLoaded = useRef(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [hideDatePicker, setHideDatePicker] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);

  // Load data based on authentication state
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    let interval: NodeJS.Timeout | null = null;

    const updateSamplePrices = async () => {
      setPortfolioData(prev => {
        if (!prev) return prev;
        return { ...prev, loadingPrices: true };
      });

      portfolioData?.stocks.forEach(async (stock, idx) => {
        if (typeof stock.buyPrice === 'number' && stock.buyPrice > 0) {
          const buyPrice = stock.buyPrice;
          const latestPrice = await fetchStrikeLatestClose(stock.ticker);
          if (latestPrice !== null) {
            setPortfolioData(prev2 => {
              if (!prev2) return prev2;
              const updatedStocks = [...prev2.stocks];
              updatedStocks[idx] = {
                ...updatedStocks[idx], // Use the latest stock, not the stale one
                price: latestPrice,
                returnPercent: ((latestPrice - buyPrice) / buyPrice) * 100,
              };
              return { ...prev2, stocks: updatedStocks };
            });
          }
        }
      });
    };

    const loadData = async () => {
      if (user) {
        try {
          const userData = await loadUserPortfolioData();
          if (!cancelled) {
            if (userData) {
              setPortfolioData({
                ...userData,
                settings: {
                  ...userData.settings,
                  date: userData.settings.date || getTodayYYYYMMDD(),
                },
              });
            } else {
              // No user data, start with empty portfolio
              setPortfolioData({
                stocks: [],
                totalOpenRisk: 0,
                totalInvested: 0,
                settings: {
                  title: 'Portfolio Snapshot',
                  date: getTodayYYYYMMDD(),
                  maxRiskPerEntry: 1,
                },
              });
            }
          }
        } catch (e) {
          if (!cancelled) {
            setError('Failed to load portfolio from Supabase. Please try again later.');
            setPortfolioData({
              stocks: [],
              totalOpenRisk: 0,
              totalInvested: 0,
              settings: {
                title: 'Portfolio Snapshot',
                date: getTodayYYYYMMDD(),
                maxRiskPerEntry: 1,
              },
            });
          }
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      } else {
        // Not logged in: show sample data, unless user has interacted
        if (!hasUserInteracted) {
          setPortfolioData({
            ...samplePortfolioData,
            settings: {
              ...samplePortfolioData.settings,
              date: getTodayYYYYMMDD(),
            },
          });
        }
        setIsLoading(false);
        // Immediately update prices on mount
        updateSamplePrices();
        // Set up interval to update prices every minute
        interval = setInterval(updateSamplePrices, 60 * 1000);
      }
    };
    loadData();
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [user, hasUserInteracted]);

  // Set up real-time subscription when user is authenticated
  useEffect(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (user) {
      subscriptionRef.current = subscribeToPortfolioChanges(user.id, (updatedData) => {
        setPortfolioData(updatedData);
      });
    }
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [user]);

  // Save data to Supabase whenever it changes (if logged in and not loading)
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      return; // Skip first run (initial load)
    }
    if (user && portfolioData && !isLoading && hasUserInteracted) {
      setIsSaving(true);
      setError(null);
      saveUserPortfolioData(portfolioData)
        .then((result) => {
          if (result && result.success) {
            setLastSaved(new Date());
          } else if (result && result.error) {
            setError('Failed to save portfolio data to Supabase.');
          }
        })
        .catch(() => {
          setError('Failed to save portfolio data to Supabase.');
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  }, [portfolioData, user, isLoading, hasUserInteracted]);

  useEffect(() => {
    // Complex obfuscation for the holidays API URL
    const parts = [
      "aG9saWRheXM=", // holidays
      "ZXF1aXR5",     // equity
      "YXBp",         // api
      "djI=",         // v2
      "bW9uZXk=",     // money
      "c3RyaWtl",     // strike
      "YXBpLXByb2QtdjIx", // api-prod-v21
      "aHR0cHM6",     // https:
    ];
    const url =
      atob(parts[7]) + "//" +
      atob(parts[6]) + "." +
      atob(parts[5]) + "." +
      atob(parts[4]) + "/" +
      atob(parts[3]) + "/" +
      atob(parts[2]) + "/" +
      atob(parts[1]) + "/" +
      atob(parts[0]);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setHolidays(data.data.map((h: any) => ({
            holidayDate: h.holidayDate,
            purpose: h.purpose
          })));
        }
      })
      .catch(() => setHolidays([]));
  }, []);

  // Handlers
  const handleStocksChange = (newStocks: ExtendedStockData[]) => {
    setHasUserInteracted(true);
    setPortfolioData((prev: EnhancedPortfolioData | null) => {
      if (!prev) return null;
      return {
        ...prev,
        stocks: newStocks,
        totalOpenRisk: parseFloat(newStocks.reduce((sum, stock) => sum + (stock.openRisk || 0), 0).toFixed(2)),
        totalInvested: parseFloat(newStocks.reduce((sum, stock) => sum + (stock.sizePercent || 0), 0).toFixed(2)),
      };
    });
  };

  const handlePortfolioDataChange = (newData: Partial<EnhancedPortfolioData>) => {
    setHasUserInteracted(true);
    setPortfolioData((prev: EnhancedPortfolioData | null) => prev ? { ...prev, ...newData } : null);
  };

  const handleSettingsChange = (newSettings: Partial<EnhancedPortfolioData['settings']>) => {
    setHasUserInteracted(true);
    setPortfolioData((prev: EnhancedPortfolioData | null) => {
      if (!prev) return null;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings,
        },
      };
    });
  };

  // Screenshot handler
  const handleScreenshot = async () => {
    setHideDatePicker(true);
    await new Promise(res => setTimeout(res, 100)); // Wait for UI to update
    if (snapshotRef.current) {
      // @ts-expect-error dom-to-image supports scale at runtime, but types may not
      domtoimage.toPng(snapshotRef.current as Node, { scale: 2 })
        .then(function (dataUrl: string) {
          const link = document.createElement('a');
          link.download = 'portfolio-snapshot.png';
          link.href = dataUrl;
          link.click();
        })
        .catch(function (error: unknown) {
          alert('Screenshot failed: ' + error);
        })
        .finally(() => {
          setHideDatePicker(false);
        });
    } else {
      setHideDatePicker(false);
    }
  };

  // Render
  if (isLoading || !portfolioData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Loading portfolio data...</p>
      </div>
    );
  }

  const displayDate = portfolioData.settings.date;

  return (
    <>
      <NSEHolidayBanner holidays={holidays} />
      {/* Show warning if not logged in */}
      {!user && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-center text-sm font-medium">
          You are not signed in. Changes will not be saved.
        </div>
      )}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg font-semibold text-base hover:from-indigo-500 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <UserIcon className="w-5 h-5" />
            {user ? 'My Account' : 'Sign In / Sign Up'}
          </button>
        </div>
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
        )}
        <div 
          ref={snapshotRef} 
          className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
        >
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-handwriting">
                {portfolioData.settings.title} as on {formatDateToDDMMYYYY(displayDate)} ✍️
              </h1>
              {!hideDatePicker && isSaving && (
                <p className="text-xs text-gray-500 mt-1">Saving changes...</p>
              )}
              {!hideDatePicker && lastSaved && !isSaving && (
                <p className="text-xs text-gray-500 mt-1">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
            {/* Hide date picker during screenshot */}
            {!hideDatePicker && (
              <input 
                type="date" 
                value={portfolioData.settings.date}
                onChange={(e) => handleSettingsChange({ date: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
              />
            )}
          </div>
          {/* Download Screenshot Button */}
          {!hideDatePicker && (
            <div className="flex justify-end mb-2">
              <button
                onClick={handleScreenshot}
                className="p-1 rounded-full hover:bg-gray-200 transition-all"
                title="Download Screenshot"
                aria-label="Download Screenshot"
              >
                <DownloadIcon className="w-5 h-5" />
              </button>
            </div>
          )}
          <EditableRiskInvestmentSummary 
            data={{
              totalOpenRisk: portfolioData.totalOpenRisk,
              totalInvested: portfolioData.totalInvested
            }}
            onDataChange={(newData) => {
              handlePortfolioDataChange({
                totalOpenRisk: newData.totalOpenRisk,
                totalInvested: newData.totalInvested
              });
            }}
          />
          <EnhancedPortfolioTable 
            stocks={portfolioData.stocks as ExtendedStockData[]} 
            onStocksChange={handleStocksChange} 
          />
          <Stats stocks={portfolioData.stocks.filter(stock => stock.status === 'Open')} />
          {portfolioData.settings.dateRange && (
            <div className="mt-4 text-sm text-gray-600">
              * from {portfolioData.settings.dateRange.from} to {portfolioData.settings.dateRange.to}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
