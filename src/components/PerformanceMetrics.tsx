import React from 'react';
import { performanceData } from '../data/sampleData';

const PerformanceMetrics: React.FC = () => {
  // Function to determine background color based on value
  const getBackgroundColor = (value: number) => {
    if (value > 0) return 'bg-green-100';
    if (value < 0) return 'bg-red-100';
    return '';
  };

  // Function to determine text color based on value
  const getTextColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-800';
  };

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-2 px-3 text-left">MBI</th>
            <th className="py-2 px-3 text-left">4 R</th>
            <th className="py-2 px-3 text-left">4 Chg</th>
            <th className="py-2 px-3 text-left">20 R</th>
            <th className="py-2 px-3 text-left">20 Chg</th>
            <th className="py-2 px-3 text-left">50 R</th>
            <th className="py-2 px-3 text-left">50 Chg</th>
            <th className="py-2 px-3 text-left">S2WH</th>
            <th className="py-2 px-3 text-left">S2WL</th>
          </tr>
        </thead>
        <tbody>
          {performanceData.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-2 px-3 font-medium">{row.date}</td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.mbi)}`}>
                <span className={getTextColor(row.mbi)}>{row.mbi.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.chg)}`}>
                <span className={getTextColor(row.chg)}>{row.chg.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.r20)}`}>
                <span className={getTextColor(row.r20)}>{row.r20.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.chg20)}`}>
                <span className={getTextColor(row.chg20)}>{row.chg20.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.r50)}`}>
                <span className={getTextColor(row.r50)}>{row.r50.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.chg50)}`}>
                <span className={getTextColor(row.chg50)}>{row.chg50.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.s2wh)}`}>
                <span className={getTextColor(row.s2wh)}>{row.s2wh.toFixed(1)}</span>
              </td>
              <td className={`py-2 px-3 ${getBackgroundColor(row.s2wl)}`}>
                <span className={getTextColor(row.s2wl)}>{row.s2wl.toFixed(1)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PerformanceMetrics;
