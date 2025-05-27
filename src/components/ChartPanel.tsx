import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, ReferenceLine
} from 'recharts';

interface ChartPanelProps {
  ticker: string;
  price: number;
  chartData: any[];
}

const ChartPanel: React.FC<ChartPanelProps> = ({ ticker, price, chartData }) => {
  // Calculate min and max for chart scaling
  const priceMin = Math.min(...chartData.map(d => d.low)) * 0.98;
  const priceMax = Math.max(...chartData.map(d => d.high)) * 1.02;
  const volumeMax = Math.max(...chartData.map(d => d.volume));

  return (
    <div className="border border-gray-200 rounded p-2 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">{ticker}, 1D, NSE</div>
        <div className="text-sm font-medium">{price.toFixed(2)}</div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="70%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[priceMin, priceMax]} axisLine={false} tickLine={false} />
            <Tooltip />
            <ReferenceLine y={price} stroke="black" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#000" 
              dot={false} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        
        <ResponsiveContainer width="100%" height="30%">
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, volumeMax]} hide />
            <Bar dataKey="volume" fill="#2196F3" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-end mt-2">
        <div className="bg-gray-100 rounded px-2 py-1 text-xs">
          <span className="font-medium">Qty: </span>
          <span>{price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
