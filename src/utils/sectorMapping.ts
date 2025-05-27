interface SectorMapping {
  [ticker: string]: string;
}

let sectorMapping: SectorMapping = {};

export const loadSectorMapping = async (): Promise<void> => {
  try {
    // Try both paths in case the file is in different locations
    let response;
    try {
      response = await fetch('/Basic RS Setup (1).csv');
    } catch (e) {
      response = await fetch('/Basic%20RS%20Setup%20(1).csv');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    console.log('CSV content sample:', csvText.substring(0, 200)); // Log first 200 chars for debugging
    
    // Parse CSV
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log(`Found ${lines.length} lines in CSV`);
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('stock name') ? 1 : 0;
    
    sectorMapping = lines.slice(startIndex).reduce((acc: SectorMapping, line, index) => {
      try {
        // Split by comma but handle quoted fields correctly
        const parts = line.split(',').reduce((acc: string[], part, i, arr) => {
          // If part starts with quote but doesn't end with quote, combine with next part
          if (part.startsWith('"') && !part.endsWith('"')) {
            const nextPart = arr[i + 1] || '';
            return [...acc, `${part},${nextPart}`];
          }
          // If previous part started a quoted field, skip this part as it's already included
          if (i > 0 && arr[i - 1].startsWith('"') && !arr[i - 1].endsWith('"')) {
            return acc;
          }
          return [...acc, part];
        }, []).map(part => part.replace(/^"|"$/g, '').trim());

        const ticker = parts[0]; // First column is Stock Name
        const sector = parts[parts.length - 1]; // Last column is Sector
        
        // Debug log for specific tickers if needed
        if (ticker && ['TI', 'DHANI', 'MOBIKWIK', 'BSE', 'NACLIND', 'PANACEABIO'].includes(ticker)) {
          console.log(`Processing ${ticker}:`, { 
            ticker, 
            sector, 
            parts,
            lineNumber: index + startIndex + 1 
          });
        }
        
        // Only add if we have both ticker and sector
        if (ticker && sector && sector !== 'NA') {
          acc[ticker] = sector;
        } else if (ticker) {
          console.log(`Skipping ${ticker}:`, { 
            reason: !ticker ? 'No ticker' : 'No sector',
            parts 
          });
        }
      } catch (error) {
        console.error(`Error processing line ${index + startIndex + 1}:`, error);
      }
      
      return acc; // Make sure to return the accumulator
    }, {});
    
    console.log('Sector mapping loaded:', Object.keys(sectorMapping).length, 'tickers mapped');
    
  } catch (error) {
    console.error('Error loading sector mapping:', error);
    throw error; // Re-throw to be caught by the component
  }
};

export const getSectorForTicker = (ticker: string): string => {
  return sectorMapping[ticker] || 'Other';
};

export const getSectorMapping = (): SectorMapping => {
  return { ...sectorMapping };
};
