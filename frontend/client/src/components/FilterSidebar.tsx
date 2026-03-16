import { useEffect, useRef } from 'react';
import { ChevronDown, X, Pin, PinOff } from 'lucide-react';
import { useFilterContext } from '@/context/FilterContext';

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
    clearFilters
  } = useFilterContext();

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        !isPinned && 
        showFilters
      ) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPinned, showFilters, setShowFilters]);

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
        className={`w-full max-w-md bg-white lg:bg-gray-50 dark:bg-gray-900 lg:dark:bg-gray-900/50 rounded-xl lg:border border-gray-200 dark:border-gray-800 shadow-xl lg:shadow-sm p-5 max-h-[90vh] lg:max-h-[calc(100vh-100px)] overflow-y-auto lg:overflow-visible transition-all lg:w-[340px] lg:max-w-none ${!isPinned && showFilters ? 'lg:mt-6 lg:ml-4 lg:shadow-2xl lg:bg-white lg:dark:bg-gray-900 lg:absolute lg:z-50' : ''}`}
      >
        <div className="flex items-center justify-between mb-4 lg:mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Filtros</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsPinned(!isPinned)}
              className="hidden lg:flex p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={isPinned ? "Desafixar menu" : "Fixar menu na lateral"}
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
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Preço Máximo ($)</label>
            <input 
              type="number" 
              value={filters.maxPrice}
              onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100"
              placeholder="Ex: 1500"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Buscar (título, desc, end)</label>
            <input 
              type="text" 
              value={filters.searchText}
              onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100"
              placeholder="Ex: 2-bedroom"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Estações de Metrô Específicas</label>
            
            <div className="relative">
              <button
                onClick={() => setShowMetroDropdown(!showMetroDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left dark:text-gray-100"
              >
                <span className="truncate">
                  {filters.selectedMetros.length === 0 
                    ? 'Selecionar estações...' 
                    : `${filters.selectedMetros.length} estação(ões) selecionada(s)`}
                </span>
                <ChevronDown size={16} className={`text-gray-500 dark:text-gray-400 transition-transform ${showMetroDropdown ? 'rotate-180' : ''}`} />
              </button>

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
                          Linha {line === 'Other' ? 'Outras' : line}
                        </h4>
                        <div className="flex flex-col gap-1">
                          {(metros as string[]).map(metro => {
                            const isSelected = filters.selectedMetros.includes(metro);
                            const cleanLabel = metro.replace(/\s*\(.*?\)\s*/g, '');
                            
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
                      <p className="text-xs text-gray-500 italic">Nenhuma estação de metrô encontrada.</p>
                    )}
                  </div>
                  
                  {filters.selectedMetros.length > 0 && (
                    <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                      <button 
                        onClick={() => setFilters(prev => ({ ...prev, selectedMetros: [] }))}
                        className="text-[10px] font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 uppercase tracking-wider px-2 py-1"
                      >
                        Limpar Seleção
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Distância Máx. Metrô (km)</label>
            <input 
              type="number" 
              step="0.1"
              value={filters.maxDistanceToMetro}
              onChange={(e) => setFilters(prev => ({ ...prev, maxDistanceToMetro: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-gray-100"
              placeholder="Ex: 1.5"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.furnishedOnly}
                onChange={(e) => setFilters(prev => ({ ...prev, furnishedOnly: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              Mobiliado
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.petsAllowed}
                onChange={(e) => setFilters(prev => ({ ...prev, petsAllowed: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700"
              />
              Aceita Pets
            </label>
          </div>

          <div className="pt-4 mt-2 flex justify-end border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={clearFilters}
              className="text-xs text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-lg"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
