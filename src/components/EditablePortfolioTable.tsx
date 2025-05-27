import React, { useState } from 'react';
import { StockData } from '../data/sampleData';

interface EditablePortfolioTableProps {
  stocks: StockData[];
  onStocksChange: (newStocks: StockData[]) => void;
}

const capOptions = ['Largecap', 'Midcap', 'Smallcap'];
const positionOptions = ['1/2', '1/3', '1/4', 'Full'];
const sectorOptions = ['Financial', 'IT', 'Commodities', 'Auto', 'Healthcare', 'Industrials', 'Consumer Goods', 'Energy', 'Materials', 'Real Estate', 'Utilities', 'Telecom']; // Added more sectors
const statusOptions = ['Open', 'Closed'];
const tradeMgtOptions = ['SL + BE', 'Open risk', 'Trailing SL', 'Partial Exit', 'Closed'];

const EditablePortfolioTable: React.FC<EditablePortfolioTableProps> = ({ stocks, onStocksChange }) => {
  const [editCell, setEditCell] = useState<{ rowIdx: number | null; field: string | null }>({ rowIdx: null, field: null });
  const [editValue, setEditValue] = useState<string | number | null | undefined>(null);

  const getReturnColor = (returnPercent?: number) => {
    if (returnPercent === undefined || returnPercent === null) return 'text-gray-900';
    if (returnPercent > 0) return 'text-green-500';
    if (returnPercent < 0) return 'text-red-500';
    return 'text-gray-900'; 
  };

  const getSizePercentColor = (size?: number) => {
    if (size === undefined || size === null) return '';
    if (size >= 20) return 'bg-yellow-400';
    if (size >= 15) return 'bg-yellow-300';
    if (size >= 10) return 'bg-yellow-200';
    return ''; 
  };

  const getStatusPill = (status: string) => {
    return (
      <span className="px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full bg-blue-100 text-blue-600 whitespace-nowrap">
        {status}
        <span className="ml-1.5">▼</span>
      </span>
    );
  };

  const getTradeMgtPill = (tradeMgt: string) => {
    let pillClass = "px-2.5 py-1 inline-flex text-xs font-semibold rounded-full whitespace-nowrap ";
    if (tradeMgt === 'SL + BE') {
      pillClass += 'bg-green-100 text-green-600';
    } else if (tradeMgt === 'Open risk') {
      pillClass += 'bg-red-100 text-red-600';
    } else {
      pillClass += 'bg-gray-100 text-gray-700'; 
    }
    return <span className={pillClass}>{tradeMgt}</span>;
  };

  const getCapPill = (cap?: 'Largecap' | 'Midcap' | 'Smallcap') => {
    if (!cap) return <span className="text-gray-400">-</span>;
    let pillClass = "px-2.5 py-1 inline-flex text-xs font-semibold rounded-full whitespace-nowrap ";
    if (cap === 'Largecap') {
        pillClass += 'bg-blue-100 text-blue-700'; // Darker blue for Largecap as per new screenshot
    } else if (cap === 'Midcap') {
        pillClass += 'bg-green-100 text-green-700';
    } else if (cap === 'Smallcap') {
        pillClass += 'bg-orange-100 text-orange-600'; // Orange for Smallcap
    }
    return <span className={pillClass}>{cap}</span>;
  };

  const handleCellEdit = (rowIdx: number, field: string, value: any) => {
    setEditCell({ rowIdx, field });
    setEditValue(value);
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellBlur = (rowIdx: number, field: string) => {
    const newStocks = [...stocks];
    let valueToSet: any = editValue;

    if (editValue === '' && (field === 'daysHeld' || field === 'openRisk' || field === 'sizePercent' || field === 'returnPercent' || field === 'price')) {
      valueToSet = null;
    } else if (field === 'daysHeld' && editValue !== null && editValue !== undefined) {
      valueToSet = parseInt(editValue as string, 10);
    } else if (['openRisk', 'sizePercent', 'returnPercent', 'price'].includes(field) && editValue !== null && editValue !== undefined) {
      valueToSet = parseFloat(editValue as string);
    } else if (editValue === undefined && (field === 'cap' || field === 'position' || field === 'sector')) {
        valueToSet = undefined; // Explicitly set to undefined if cleared
    }

    (newStocks[rowIdx] as any)[field] = valueToSet;
    onStocksChange(newStocks);
    setEditCell({ rowIdx: null, field: null });
    setEditValue(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, rowIdx: number, field: string) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement | HTMLSelectElement).blur();
    } else if (e.key === 'Escape') {
      setEditCell({ rowIdx: null, field: null });
      setEditValue(null);
    }
  };

  const addNewStock = () => {
    const newStock: StockData = {
      ticker: 'NEW',
      status: 'Open',
      daysHeld: null,
      tradeMgt: 'Open risk',
      setup: 'ITB', 
      openRisk: 0,
      sizePercent: 0, 
      price: 0, 
      returnPercent: 0,
      cap: 'Midcap',
      position: '1/2',
      sector: 'Financial'
    };
    onStocksChange([...stocks, newStock]);
  };

  const deleteStock = (index: number) => {
    const newStocks = [...stocks];
    newStocks.splice(index, 1);
    onStocksChange(newStocks);
  };
  
  const commonInputClass = "px-2 py-1 border border-gray-300 rounded text-sm w-full";
  const commonSelectClass = commonInputClass;

  return (
    <div className="mb-6 overflow-x-auto p-1 bg-white shadow-md rounded-lg">
       <div className="flex justify-between items-center mb-4 px-2 pt-2">
        <h3 className="text-xl font-semibold text-gray-800">Portfolio Holdings</h3>
        <button 
          onClick={addNewStock}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Add Stock
        </button>
      </div>
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-left bg-gray-50">
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200"><input type="checkbox" className="mr-2" />Ticker</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Status</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Days Held</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Trade Mgt</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Risk %</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Return %</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200 whitespace-nowrap">Size %</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Sector</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Cap</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Position</th>
            <th className="p-3 text-xs font-semibold text-gray-600 border-b border-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock, rowIdx) => (
            <tr key={rowIdx} className="text-sm hover:bg-gray-50">
              <td className="p-3 border-b border-gray-100">
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-gray-500 mr-2 font-medium">{rowIdx + 1}</span>
                  {editCell.rowIdx === rowIdx && editCell.field === 'ticker' ? (
                    <input type="text" value={editValue as string ?? stock.ticker} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'ticker')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'ticker')} className={`${commonInputClass} w-24`} autoFocus />
                  ) : (
                    <span className="font-semibold text-gray-700 cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'ticker', stock.ticker)}>{stock.ticker}</span>
                  )}
                </div>
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'status' ? (
                  <select value={editValue as string ?? stock.status} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'status')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'status')} className={commonSelectClass} autoFocus>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <div className="cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'status', stock.status)}>{getStatusPill(stock.status)}</div>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'daysHeld' ? (
                  <input type="number" value={editValue === null || editValue === undefined ? '' : editValue as number} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'daysHeld')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'daysHeld')} className={`${commonInputClass} w-20`} autoFocus />
                ) : (
                  <span className="text-gray-700 cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'daysHeld', stock.daysHeld)}>{stock.daysHeld !== null ? `${stock.daysHeld} days` : '-'}</span>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'tradeMgt' ? (
                  <select value={editValue as string ?? stock.tradeMgt} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'tradeMgt')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'tradeMgt')} className={commonSelectClass} autoFocus>
                     {tradeMgtOptions.map(tm => <option key={tm} value={tm}>{tm}</option>)}
                  </select>
                ) : (
                  <div className="cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'tradeMgt', stock.tradeMgt)}>{getTradeMgtPill(stock.tradeMgt)}</div>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'openRisk' ? (
                  <input type="number" value={editValue as number ?? stock.openRisk} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'openRisk')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'openRisk')} step="0.01" className={`${commonInputClass} w-20`} autoFocus />
                ) : (
                  <span className={`cursor-pointer ${stock.openRisk > 0 ? 'text-red-500' : 'text-gray-700'}`} onClick={() => handleCellEdit(rowIdx, 'openRisk', stock.openRisk)}>{stock.openRisk > 0 ? `${stock.openRisk.toFixed(2)}%` : '0%'}</span>
                )}
              </td>
               <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'returnPercent' ? (
                  <input type="number" value={editValue as number ?? stock.returnPercent} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'returnPercent')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'returnPercent')} step="0.01" className={`${commonInputClass} w-20`} autoFocus />
                ) : (
                  <span className={`cursor-pointer font-medium ${getReturnColor(stock.returnPercent)}`} onClick={() => handleCellEdit(rowIdx, 'returnPercent', stock.returnPercent)}>{stock.returnPercent > 0 ? '+' : ''}{stock.returnPercent !== null ? stock.returnPercent.toFixed(2) : '0.00'}%</span>
                )}
              </td>
              <td className={`p-3 border-b border-gray-100 whitespace-nowrap ${getSizePercentColor(stock.sizePercent)}`}>
                {editCell.rowIdx === rowIdx && editCell.field === 'sizePercent' ? (
                  <input type="number" value={editValue as number ?? stock.sizePercent} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'sizePercent')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'sizePercent')} step="0.01" className={`${commonInputClass} w-20 bg-transparent`} autoFocus />
                ) : (
                  <span className="cursor-pointer font-medium text-gray-800" onClick={() => handleCellEdit(rowIdx, 'sizePercent', stock.sizePercent)}>{stock.sizePercent !== null ? stock.sizePercent.toFixed(2) : '0.00'}%</span>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'sector' ? (
                  <select value={editValue as string ?? stock.sector ?? ''} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'sector')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'sector')} className={commonSelectClass} autoFocus>
                    <option value="">- Select -</option>
                    {sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="text-gray-700 cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'sector', stock.sector)}>{stock.sector || '-'}</span>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'cap' ? (
                  <select value={editValue as string ?? stock.cap ?? ''} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'cap')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'cap')} className={commonSelectClass} autoFocus>
                    <option value="">- Select -</option>
                    {capOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <div className="cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'cap', stock.cap)}>{getCapPill(stock.cap)}</div>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                {editCell.rowIdx === rowIdx && editCell.field === 'position' ? (
                  <select value={editValue as string ?? stock.position ?? ''} onChange={handleCellChange} onBlur={() => handleCellBlur(rowIdx, 'position')} onKeyDown={e => handleCellKeyDown(e, rowIdx, 'position')} className={commonSelectClass} autoFocus>
                    <option value="">- Select -</option>
                    {positionOptions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <span className="text-gray-700 cursor-pointer" onClick={() => handleCellEdit(rowIdx, 'position', stock.position)}>{stock.position || '-'}</span>
                )}
              </td>
              <td className="p-3 border-b border-gray-100 whitespace-nowrap">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleCellEdit(rowIdx, 'ticker', stock.ticker)} 
                    className="px-2.5 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors whitespace-nowrap"
                  >Edit</button>
                  <button 
                    onClick={() => deleteStock(rowIdx)} 
                    className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-full hover:bg-red-600 transition-colors whitespace-nowrap"
                  >Delete</button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="text-sm font-medium bg-gray-50">
            <td colSpan={4} className="p-3 border-t-2 border-gray-200"></td>
            <td className="p-3 border-t-2 border-gray-200 text-right font-semibold text-gray-700">{stocks.reduce((sum, stock) => sum + (stock.openRisk || 0), 0).toFixed(2)}%</td>
            <td className="p-3 border-t-2 border-gray-200 text-right font-semibold text-gray-700">{stocks.reduce((sum, stock) => sum + (stock.returnPercent || 0), 0).toFixed(2)}%</td>
            <td className="p-3 border-t-2 border-gray-200 text-right font-semibold text-gray-700">{stocks.reduce((sum, stock) => sum + (stock.sizePercent || 0), 0).toFixed(2)}%</td>
            <td colSpan={4} className="p-3 border-t-2 border-gray-200"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EditablePortfolioTable;
