import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useFilterContext } from '@/context/FilterContext';
import { getFilteredMetroData, getMergedStations } from '@/utils/metro';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';

// Theme colors mapping
const lineColors: Record<string, string> = {
  Orange: '#f97316',
  Green: '#22c55e',
  Blue: '#3b82f6',
  Yellow: '#eab308',
  REM: '#A2C510' // Official REM green-ish yellow
};

// Component to recenter map if needed (helps when modal opens)
function MapEffect() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export function MetroMapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { filters, toggleMetro } = useFilterContext();
  const { t } = useLanguage();

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t('interactiveMap')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {t('clickToSelectMap')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-800">
          <MapContainer 
            center={[45.5017, -73.5673]} // Center of Montreal
            zoom={12} 
            className="w-full h-full"
            zoomControl={true}
          >
            <MapEffect />
            
            {/* Base Map Layer (Using CartoDB Positron for a clean look that works in both light and dark if using CSS filters, or just standard OSM) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Dark mode CSS logic can be added globally for Leaflet, but keeping it standard here */}

            {/* Draw Lines using Filtered (Original) Shape */}
            {Object.entries(getFilteredMetroData()).map(([lineName, lineData]) => {
              const color = lineColors[lineName] || '#666';
              const positions = lineData.Stations.map(station => station.coords);
              return (
                <Polyline 
                  key={`line-${lineName}`}
                  positions={positions} 
                  pathOptions={{ color, weight: 4, opacity: 0.6 }} 
                />
              );
            })}

            {/* Draw Merged Station Markers */}
            {getMergedStations().map((station, idx) => {
              // Check if ANY of the contextKeys matching this physical node are selected
              const isSelected = station.contextKeys.some(key => 
                filters.selectedMetros.includes(key) || 
                station.names.some(n => filters.selectedMetros.some(m => m.startsWith(n + ' ')))
              );
              
              const isMultiLine = station.lines.length > 1;
              const primaryColor = lineColors[station.lines[0]] || '#666';
              const displayName = station.names.join(' / ');

              return (
                <CircleMarker
                  key={`station-${idx}-${station.names[0]}`}
                  center={station.coords}
                  radius={isMultiLine ? (isSelected ? 9 : 7) : (isSelected ? 7 : 5)}
                  pathOptions={{ 
                    color: isSelected ? '#fff' : primaryColor, // White border if selected
                    fillColor: primaryColor,                   // Always keep the line's color
                    fillOpacity: isSelected ? 1 : 0.4,
                    weight: isSelected ? 3 : (isMultiLine ? 3 : 2)
                  }}
                  eventHandlers={{
                    click: () => {
                      // Toggle all context keys associated with this intersection
                      // If any is selected, we deselect all. Otherwise select all.
                      const anySelected = station.contextKeys.some(key => filters.selectedMetros.includes(key));
                      if (anySelected) {
                        // User wants to deselect
                        station.contextKeys.forEach(k => {
                          if (filters.selectedMetros.includes(k)) toggleMetro(k);
                        });
                      } else {
                        // User wants to select
                        station.contextKeys.forEach(k => {
                          if (!filters.selectedMetros.includes(k)) toggleMetro(k);
                        });
                      }
                    }
                  }}
                >
                  <Popup className="rounded-lg shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-900">{displayName}</span>
                      
                      <div className="flex flex-wrap gap-1 mt-1">
                        {station.lines.map(line => (
                          <span 
                            key={line} 
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit" 
                            style={{ backgroundColor: `${lineColors[line]}20`, color: lineColors[line] }}
                          >
                            {t(`line${line === 'Other' ? 'Other' : line}`)}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {isSelected ? `✓ ${t('selected')}` : t('clickToSelect')}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Footer (Mobile Only mostly, or just extra action) */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center sm:hidden">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filters.selectedMetros.length} {t('stationsSelected')}
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-semibold"
          >
            {t('done')}
          </button>
        </div>
        
      </div>
    </div>
  );
}
