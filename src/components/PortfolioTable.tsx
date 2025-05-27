import React from 'react';
import { StockData } from '../data/sampleData';

interface PortfolioTableProps {
  stocks: StockData[];
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ stocks }) => {
  // Function to determine background color for size percentage
  const getSizePercentColor = (size: number) => {
    if (size >= 20) return 'bg-yellow-400';
    if (size >= 15) return 'bg-yellow-300';
    if (size >= 10) return 'bg-yellow-200';
    if (size >= 5) return 'bg-yellow-100';
    return 'bg-yellow-50';
  };

  // Function to determine text color for trade management
  const getTradeMgtColor = (tradeMgt: string) => {
    if (tradeMgt === 'SL + BE') return 'text-green-600';
    if (tradeMgt === 'Open risk') return 'text-red-600';
    return 'text-black';
  };

  // Function to determine text color for setup
  const getSetupColor = (setup: string) => {
    if (setup === 'ITB') return 'text-purple-600';
    if (setup === 'Chop BO') return 'text-orange-600';
    if (setup === 'IPO Base') return 'text-blue-600';
    return 'text-black';
  };

  return (
    <div className="mb-6 overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="text-left text-sm">
            <th className="py-2 pr-4"><input type="checkbox" className="mr-2" />Ticker</th>
            <th className="py-2 px-4">Status</th>
            <th className="py-2 px-4">Days Held</th>
            <th className="py-2 px-4">Trade Mgt</th>
            <th className="py-2 px-4">Setup</th>
            <th className="py-2 px-4">Open Risk</th>
            <th className="py-2 px-4">Size %</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, index) => (
            <tr key={index} className="text-sm">
              <td className="py-2 pr-4">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>{index + 1}</span>
                  <span className="ml-2">{stock.ticker}</span>
                </div>
              </td>
              <td className="py-2 px-4">
                <div className="flex items-center text-blue-600">
                  <span>Open</span>
                  <span className="ml-1">▼</span>
                </div>
              </td>
              <td className="py-2 px-4">
                {stock.daysHeld ? `${stock.daysHeld} days` : '-'}
              </td>
              <td className="py-2 px-4">
                <span className={getTradeMgtColor(stock.tradeMgt)}>
                  {stock.tradeMgt}
                </span>
              </td>
              <td className="py-2 px-4">
                <span className={getSetupColor(stock.setup)}>
                  {stock.setup}
                </span>
              </td>
              <td className="py-2 px-4">
                {stock.openRisk > 0 ? `${stock.openRisk.toFixed(2)}%` : '0%'}
              </td>
              <td className={`py-2 px-4 ${getSizePercentColor(stock.sizePercent)}`}>
                {stock.sizePercent.toFixed(1)}%
              </td>
            </tr>
          ))}
          <tr className="text-sm font-medium">
            <td colSpan={5}></td>
            <td className="py-2 px-4">{stocks.reduce((sum, stock) => sum + stock.openRisk, 0).toFixed(2)}%</td>
            <td className="py-2 px-4">{stocks.reduce((sum, stock) => sum + stock.sizePercent, 0).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioTable;
