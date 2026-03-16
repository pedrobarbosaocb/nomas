import metroDataRaw from '@/data/metro_stations.json';

export interface StationInfo {
  name: string;
  coords: [number, number];
}

export interface LineData {
  Stations: StationInfo[];
}

export interface MergedStation {
  names: string[];
  coords: [number, number];
  lines: string[];
  contextKeys: string[];
}

export const unbuiltREMStations = new Set([
  'Des Sources', 
  'Fairview-Pointe-Claire', 
  'Kirkland', 
  "Anse-à-l'Orme", 
  'Marie-Curie', 
  'YUL-Aéroport-Montréal-Trudeau'
]);

export function getFilteredMetroData(): Record<string, LineData> {
  // Deep clone to avoid mutating the original JSON import
  const data = JSON.parse(JSON.stringify(metroDataRaw)) as Record<string, LineData>;
  if (data['REM']) {
    data['REM'].Stations = data['REM'].Stations.filter(s => !unbuiltREMStations.has(s.name));
  }
  return data;
}

// Cache the merged result to avoid recalculating unnecessarily
let cachedMergedStations: MergedStation[] | null = null;

export function getMergedStations(): MergedStation[] {
  if (cachedMergedStations) return cachedMergedStations;

  const data = getFilteredMetroData();
  const merged: MergedStation[] = [];
  
  Object.entries(data).forEach(([lineName, lineData]) => {
    lineData.Stations.forEach(station => {
      // Find if it's close to an existing merged station (distance < 0.003 degrees, ~300 meters)
      const existing = merged.find(m => {
        const dist = Math.sqrt(
          Math.pow(m.coords[0] - station.coords[0], 2) + 
          Math.pow(m.coords[1] - station.coords[1], 2)
        );
        return dist < 0.003; 
      });

      const contextKey = `${station.name} (${lineName})`;

      if (existing) {
        if (!existing.lines.includes(lineName)) existing.lines.push(lineName);
        if (!existing.contextKeys.includes(contextKey)) existing.contextKeys.push(contextKey);
        if (!existing.names.includes(station.name)) existing.names.push(station.name);
      } else {
        merged.push({
          names: [station.name],
          coords: station.coords,
          lines: [lineName],
          contextKeys: [contextKey]
        });
      }
    });
  });
  
  cachedMergedStations = merged;
  return merged;
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

export function getStationByName(stationNameStr: string): MergedStation | undefined {
    const merged = getMergedStations();
    const cleanName = stationNameStr.replace(/\s*\(.*?\)\s*/g, '').trim();
    const normClean = normalize(cleanName);
    
    // Exact match first
    let station = merged.find(m => m.names.some(n => normalize(n) === normClean));
    
    // Fallback if no exact match (but string includes)
    if (!station) {
        station = merged.find(m => m.names.some(n => {
            const normN = normalize(n);
            return normN.includes(normClean) || normClean.includes(normN);
        }));
    }
    
    return station;
}

// Find all lines servicing a particular station name, useful for cards
export function getLinesForStationName(stationNameStr: string): string[] {
    const station = getStationByName(stationNameStr);
    return station ? station.lines : [];
}
