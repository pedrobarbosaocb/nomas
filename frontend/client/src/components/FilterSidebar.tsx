import { useState, useRef, useEffect } from 'react';
import { Map, ChevronDown, Check, SlidersHorizontal, X, Pin, PinOff } from 'lucide-react';
import { useFilterContext } from '@/context/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStationByName } from '@/utils/metro';
import { MetroMapModal } from '@/components/MetroMapModal';

export function FilterSidebar() {
  const { 
    filters, 
    setFilters, 
    showFilters, 
    setShowFilters, 
    isPinned,
    setIsPinned,
    showMetroDropdown, 
    setShowMetroDropdown, 
    metroGroups, 
    toggleMetro, 
    clearFilters,
    availableAiLabels
  } = useFilterContext();
  const { t } = useLanguage();

  const [showMap, setShowMap] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close metro dropdown whenever the main filter menu closes
  useEffect(() => {
    if (!showFilters) {
      setShowMetroDropdown(false);
    }
  }, [showFilters, setShowMetroDropdown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        !isPinned && 
        showFilters &&
        !showMap
      ) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned, showFilters, setShowFilters, showMap]);

  return (
    <div className={`
      ${showFilters ? (
        isPinned 
          ? 'hidden lg:block lg:w-[340px] lg:shrink-0 lg:bg-transparent lg:p-0 lg:flex-none'
          : 'fixed inset-0 z-50 bg-white/50 backdrop-blur-sm sm:backdrop-blur-md sm:bg-black/20 animate-in fade-in flex items-center justify-center p-4 lg:absolute lg:top-0 lg:left-0 lg:h-full lg:items-start lg:justify-start lg:bg-transparent lg:backdrop-blur-none lg:p-0 pt-[100px] lg:pt-0'
      ) : 'hidden'}
    `}>
      <div 
        ref={sidebarRef}
        className={`w-full max-w-md bg-white lg:bg-gray-50 dark:bg-gray-900 lg:dark:bg-gray-900 rounded-xl lg:border border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-sm p-5 max-h-[90vh] lg:max-h-[calc(100vh-100px)] overflow-y-auto lg:overflow-visible transition-all lg:w-[340px] lg:max-w-none ${!isPinned && showFilters ? 'lg:mt-6 lg:shadow-2xl lg:bg-white lg:dark:bg-gray-900 lg:absolute lg:z-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-4 lg:mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('filters')}</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsPinned(!isPinned)}
              className="hidden lg:flex p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isPinned ? t('unpinMenu') : t('pinMenu')}
            >
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between pointer-events-none">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('priceRange')}</label>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                <input 
                  type="number" 
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-full pl-7 pr-2 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 overflow-hidden"
                  placeholder={t('min')}
                />
              </div>
              <span className="text-gray-400 dark:text-gray-500">-</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                <input 
                  type="number" 
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full pl-7 pr-2 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 overflow-hidden"
                  placeholder={t('max')}
                />
              </div>
            </div>

            <div className="relative h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-lg mt-2">
              <div 
                className="absolute h-full bg-emerald-600 dark:bg-emerald-500 rounded-lg pointer-events-none z-10" 
                style={{ 
                  left: `${(Number(filters.minPrice) || 0) / 5000 * 100}%`, 
                  right: `${100 - (Number(filters.maxPrice === '' ? 5000 : filters.maxPrice) || 5000) / 5000 * 100}%` 
                }} 
              />
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={Number(filters.minPrice) || 0}
                onChange={(e) => {
                  const maxVal = filters.maxPrice === '' ? 5000 : Number(filters.maxPrice);
                  const val = Math.min(Number(e.target.value), maxVal - 50);
                  setFilters(prev => ({ ...prev, minPrice: val === 0 ? '' : val.toString() }));
                }}
                className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:dark:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer z-20"
              />
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={filters.maxPrice === '' ? 5000 : Number(filters.maxPrice)}
                onChange={(e) => {
                  const minVal = Number(filters.minPrice) || 0;
                  const val = Math.max(Number(e.target.value), minVal + 50);
                  setFilters(prev => ({ ...prev, maxPrice: val.toString() }));
                }}
                className="absolute w-full top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-600 [&::-webkit-slider-thumb]:dark:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer z-20"
              />
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium px-1">
              <span>$0</span>
              <span>$5000+</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('searchBy')}</label>
            <input 
              type="text" 
              value={filters.searchText}
              onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100"
              placeholder={t('searchPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t('specificMetroStations')}</label>
            
            <div className="relative">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMetroDropdown(!showMetroDropdown)}
                  className="flex-1 flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left dark:text-gray-100"
                >
                  <span className="truncate">
                    {filters.selectedMetros.length === 0 
                      ? t('selectStations')
                      : `${filters.selectedMetros.length} ${t('stationsSelected')}`}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${showMetroDropdown ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors flex items-center justify-center shrink-0"
                  aria-label={t('selectOnMap')}
                  title={t('selectOnMap')}
                >
                  <Map size={18} />
                </button>
              </div>

              {showMetroDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar space-y-4">
                    {Object.entries(metroGroups).map(([line, metros]) => (
                      <div key={line} className="space-y-2">
                        <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                          line === 'Green' ? 'text-green-600' :
                          line === 'Orange' ? 'text-orange-500' :
                          line === 'Blue' ? 'text-blue-600' :
                          line === 'Yellow' ? 'text-yellow-600' :
                          line === 'REM' ? 'text-emerald-500' :
                          'text-gray-500'
                        }`}>
                          {t(`line${line === 'Other' ? 'Other' : line}`)}
                        </h4>
                        <div className="flex flex-col gap-1">
                          {(metros as string[]).map(metro => {
                            const isSelected = filters.selectedMetros.includes(metro);
                            const resolved = getStationByName(metro);
                            const cleanLabel = resolved ? resolved.names[0] : metro.replace(/\s*\(.*?\)\s*/g, '');
                            
                            return (
                              <label
                                key={metro}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md cursor-pointer group transition-colors"
                              >
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleMetro(metro)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
                                />
                                <span className={`text-xs ${isSelected ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                                  {cleanLabel}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {Object.keys(metroGroups).length === 0 && (
                      <p className="text-xs text-gray-500 italic">{t('noMetroFound')}</p>
                    )}
                  </div>
                  
                  {/* Select on Map Button */}
                  <div className="px-3 pb-3">
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800/50"
                    >
                      <Map size={16} />
                      {t('selectOnMap')}
                    </button>
                  </div>

                  {filters.selectedMetros.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                      <button 
                        onClick={() => setFilters(prev => ({ ...prev, selectedMetros: [] }))}
                        className="text-[10px] font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 uppercase tracking-wider px-2 py-1"
                      >
                        {t('clearSelection')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4 mb-4">
            <div className="flex items-center justify-between pointer-events-none">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('maxDistanceMetro')}</label>
            </div>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  value={filters.maxDistanceToMetro}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistanceToMetro: e.target.value }))}
                  className="w-full pr-8 pl-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 overflow-hidden"
                  placeholder="Ex: 1.5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">km</span>
              </div>
              <input 
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={filters.maxDistanceToMetro === '' ? 10 : Number(filters.maxDistanceToMetro)}
                onChange={(e) => setFilters(prev => ({ ...prev, maxDistanceToMetro: e.target.value }))}
                className="w-full accent-emerald-600 dark:accent-emerald-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-medium px-1">
                <span>0 km</span>
                <span>10+ km</span>
              </div>
            </div>
          </div>

          {availableAiLabels !== undefined && (
            <div className="space-y-3 mt-4 mb-4">
              <div className="flex items-center justify-between pointer-events-none">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('listingType')}</label>
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left dark:text-gray-100 shadow-sm"
                >
                  <span className={`block truncate ${((filters as any).listingCategory || 'all') === 'all' ? 'text-gray-500 dark:text-gray-400' : 'font-medium'}`}>
                    {(() => {
                      const val = (filters as any).listingCategory || 'all';
                      if (val === 'apartment') return t('catApartment');
                      if (val === 'commercial') return t('catCommercial');
                      if (val === 'parking') return t('catParking');
                      return t('catAll');
                    })()}
                  </span>
                  <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                    <div className="absolute z-50 w-full mt-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {[
                        { value: 'all', label: t('catAll') },
                        { value: 'apartment', label: t('catApartment') },
                        { value: 'commercial', label: t('catCommercial') },
                        { value: 'parking', label: t('catParking') },
                      ].map(option => {
                        const isSelected = ((filters as any).listingCategory || 'all') === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setFilters(prev => ({ ...prev, listingCategory: option.value, aiLabels: [] }));
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {(filters as any).listingCategory === 'apartment' && (
                <div className="flex flex-wrap gap-2 mt-3 max-h-48 overflow-y-auto custom-scrollbar pb-1">
                  {availableAiLabels
                    .filter(l => ["short stay", "room(s) in shared apartment/house", "studio", "1-bed", "2-bed", "3-bed", "4-bed", "5+ bedroom apartment"].includes(l))
                    .sort((a, b) => {
                      const order = ["short stay", "room(s) in shared apartment/house", "studio", "1-bed", "2-bed", "3-bed", "4-bed", "5+ bedroom apartment"];
                      return order.indexOf(a) - order.indexOf(b);
                    })
                    .map(label => {
                      const isSelected = filters.aiLabels?.includes(label);
                      const keyMap: Record<string, string> = {
                        "short stay": "labelShortStay",
                        "room(s) in shared apartment/house": "labelRoom",
                        "studio": "labelStudio",
                        "1-bed": "label1Bed",
                        "2-bed": "label2Bed",
                        "3-bed": "label3Bed",
                        "4-bed": "label4Bed",
                        "5+ bedroom apartment": "label5Bed"
                      };
                      const displayLabel = keyMap[label] ? t(keyMap[label]) : label;
                      
                      return (
                        <button
                          key={label}
                          onClick={(e) => {
                            e.preventDefault();
                            setFilters((prev: any) => {
                              const newLabels = !isSelected
                                ? [...(prev.aiLabels || []), label]
                                : (prev.aiLabels || []).filter((l: string) => l !== label);
                              return { ...prev, aiLabels: newLabels };
                            });
                          }}
                          className={`
                            text-xs px-3 py-1.5 rounded-full border transition-all duration-200
                            ${isSelected 
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700/50 dark:text-emerald-300 shadow-sm' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800/80'}
                          `}
                        >
                          {displayLabel}
                        </button>
                      );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.electricityIncluded}
                onChange={(e) => setFilters(prev => ({ ...prev, electricityIncluded: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              {t('electricity')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.heatingIncluded}
                onChange={(e) => setFilters(prev => ({ ...prev, heatingIncluded: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              {t('heating')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.petsAllowed}
                onChange={(e) => setFilters(prev => ({ ...prev, petsAllowed: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              {t('pets')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.furnishedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, furnishedOnly: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              {t('furnished')}
            </label>
          </div>

          <div className="pt-4 mt-2 flex justify-end border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={clearFilters}
              className="text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-lg"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Map Modal Overlay */}
      <MetroMapModal isOpen={showMap} onClose={() => setShowMap(false)} />
    </div>
  );
}
