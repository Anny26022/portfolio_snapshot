  import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ExtendedStockData } from './EnhancedPortfolioTable';
import { loadSectorMapping, getSectorForTicker } from '../utils/sectorMapping';

interface StatsProps {
  stocks: ExtendedStockData[];
}

interface DistributionData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = [
  'rgba(59, 130, 246, 0.85)',  // Light blue
  'rgba(34, 197, 94, 0.85)',   // Light green
  'rgba(239, 68, 68, 0.85)',   // Light red
  'rgba(249, 115, 22, 0.85)',  // Light orange
  'rgba(168, 85, 247, 0.85)',  // Light purple
  'rgba(20, 184, 166, 0.85)',  // Light teal
  'rgba(245, 158, 11, 0.85)'   // Light amber
];

const Stats: React.FC<StatsProps> = ({ stocks }) => {
  const [view, setView] = useState<'sector' | 'industry'>('sector');
  const [isLoading, setIsLoading] = useState(true);

  // Load sector mapping when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading sector mapping...');
        await loadSectorMapping();
        console.log('Sector mapping loaded successfully');
      } catch (error) {
        console.error('Error loading sector mapping:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData().catch(console.error);
    
    // Log the first few portfolio tickers for debugging
    if (stocks.length > 0) {
      console.log('Portfolio tickers:', stocks.map(s => s.ticker).join(', '));
    }
  }, [stocks]);

  // Get sector for a stock, using the mapping or falling back to the stock's sector
  const getSector = (stock: ExtendedStockData): string => {
    const sector = getSectorForTicker(stock.ticker) || stock.sector || 'Other';
    if (sector === 'Other' && stock.ticker) {
      console.log(`No sector mapping found for ticker: ${stock.ticker}`);
    }
    return sector;
  };

  // Calculate stats
  const uniqueHoldings = stocks.length;
  const maxRiskPerEntry = 1; // This could be configurable
  
  // Calculate returns
  const unrealisedReturn = stocks.reduce((sum, stock) => {
    if (stock.status === 'Open') {
      return sum + (stock.returnPercent * stock.sizePercent);
    }
    return sum;
  }, 0) / (stocks.reduce((sum, stock) => stock.status === 'Open' ? sum + stock.sizePercent : sum, 0) || 1);
  
  const realisedReturn = stocks.reduce((sum, stock) => {
    if (stock.status === 'Closed') {
      return sum + (stock.returnPercent * stock.sizePercent);
    }
    return sum;
  }, 0) / (stocks.reduce((sum, stock) => stock.status === 'Closed' ? sum + stock.sizePercent : sum, 0) || 1);

  // Calculate sector/industry distribution for pie chart
  const distribution = useMemo(() => {
    if (isLoading) return [];
    
    const distribution = stocks.reduce((acc, stock) => {
      const key = view === 'sector' ? getSector(stock) : (stock.industry || stock.ticker);
      if (!key) return acc;
      
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += stock.sizePercent || 0;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(distribution).reduce((sum, val) => sum + val, 0) || 1;
    
    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
        percentage: parseFloat(((value / total) * 100).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  }, [stocks, view, isLoading, getSector]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Loading sector data...</p>
      </div>
    );
  }
  
  const hasSectorData = distribution.length > 0;
  
  if (!hasSectorData) {
    return (
      <div className="p-4 text-center text-gray-600">
        <p>No sector data available for your portfolio.</p>
        <p className="text-sm mt-2">Check the console for debugging information.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header with Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Portfolio Distribution</h1>
          <p className="text-gray-500 text-sm mt-1">
            {view === 'sector' ? 'Sector-wise allocation' : 'Industry-wise allocation'}
          </p>
        </div>
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setView('sector')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'sector' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Sectors
          </button>
          <button
            onClick={() => setView('industry')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === 'industry' 
                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Industries
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total {view === 'sector' ? 'Sectors' : 'Industries'}</p>
          <p className="text-2xl font-bold mt-1">{distribution.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Top {view === 'sector' ? 'Sector' : 'Industry'}</p>
          <p className="text-xl font-semibold mt-1 truncate">
            {distribution[0]?.name || 'N/A'} 
            <span className="text-blue-600 dark:text-blue-400 ml-2">
              {distribution[0]?.percentage.toFixed(1)}%
            </span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Top 3 Allocation</p>
          <p className="text-xl font-semibold mt-1">
            {distribution.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex flex-wrap gap-4 mb-6">
            {distribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full opacity-85" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white transition-colors duration-200">
            {view === 'sector' ? 'Sector' : 'Industry'} Distribution
          </h3>
          <div className="h-[400px] dark:text-gray-300 transition-colors duration-200">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius * 0.8;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                    return percentage > 5 ? (
                      <g>
                        <text
                          x={x}
                          y={y}
                          fill="currentColor"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-[10px] font-medium dark:text-gray-300"
                        >
                          {`${percentage}%`}
                        </text>
                      </g>
                    ) : null;
                  }}
                  outerRadius={130}
                  innerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="#fff"
                >
                  {distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))' }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: document.documentElement.classList.contains('dark') 
                      ? 'rgba(31, 41, 55, 0.85)' 
                      : 'rgba(255, 255, 255, 0.85)',
                    color: document.documentElement.classList.contains('dark')
                      ? '#e5e7eb'
                      : '#4b5563',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    border: 'none',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Top {view === 'sector' ? 'Sectors' : 'Industries'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                barCategoryGap={8}
              >
                {/* Grid lines removed as per user request */}
                <XAxis 
                  type="number" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Allocation']}
                  contentStyle={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  animationBegin={100}
                  animationDuration={1500}
                >
                  {distribution.map((entry, index) => (
                    <Cell 
                      key={`bar-cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Detailed {view === 'sector' ? 'Sector' : 'Industry'} Allocation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {view === 'sector' ? 'Sector' : 'Industry'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {distribution.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-full mr-3"
                        style={{ 
                          backgroundColor: COLORS[index % COLORS.length],
                          boxShadow: `0 0 8px ${COLORS[index % COLORS.length]}80`
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {item.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Data as of {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default Stats;
