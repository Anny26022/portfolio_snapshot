// Utility to parse CSV and create a mapping from stock symbol to industry

export type SymbolIndustryMap = Record<string, string>;

export function parseCsvToIndustryMap(csv: string): SymbolIndustryMap {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const map: SymbolIndustryMap = {};
  // Find header indices
  const header = lines[0].split(',');
  const symbolIdx = header.findIndex(h => h.trim().toLowerCase() === 'stock name');
  const industryIdx = header.findIndex(h => h.trim().toLowerCase() === 'basic industry');
  if (symbolIdx === -1 || industryIdx === -1) return map;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const symbol = cols[symbolIdx]?.trim().toUpperCase();
    const industry = cols[industryIdx]?.trim();
    if (symbol && industry) {
      map[symbol] = industry;
    }
  }
  return map;
}
