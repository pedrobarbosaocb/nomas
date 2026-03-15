import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter, X, ChevronDown } from 'lucide-react';
import apartments from '@/data/apartments.json';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';

export default function TinderPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  
  const [filters, setFilters] = useState({
    maxPrice: '',
    maxDistanceToMetro: '',
    selectedMetros: [] as string[],
    searchText: '',
    furnishedOnly: false,
    petsAllowed: false,
  });

  // Compute unique metros dynamically and group by line
  const metroGroups = useMemo(() => {
    const metros = apartments
      .map(apt => apt.location_info?.nearest_metro)
      .filter((metro): metro is string => Boolean(metro));
    
    const unique = Array.from(new Set(metros)).sort();
    
    const groups: Record<string, string[]> = {
      'Green': [],
      'Orange': [],
      'Blue': [],
      'Yellow': [],
      'REM': [],
      'Other': []
    };

    unique.forEach(metro => {
      const match = metro.match(/\((.*?)\)/);
      if (match && groups[match[1]]) {
        groups[match[1]].push(metro);
      } else {
        groups['Other'].push(metro);
      }
    });

    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([_, list]) => list.length > 0));
  }, []);

  const toggleMetro = (metro: string) => {
    setFilters(prev => {
      const isSelected = prev.selectedMetros.includes(metro);
      return {
        ...prev,
        selectedMetros: isSelected 
          ? prev.selectedMetros.filter(m => m !== metro)
          : [...prev.selectedMetros, metro]
      };
    });
  };

  // Filtrar apenas apartamentos não avaliados e que batem com o filtro
  const notRatedApartments = useMemo(() => {
    return apartments.filter(apt => {
      // 1. Check if rated
      if (getRating(apt.link) !== 'not-rated') return false;

      // 2. Max Price Filter
      if (filters.maxPrice) {
        const priceVal = parseFloat(apt.price.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(priceVal) && priceVal > parseFloat(filters.maxPrice)) {
          return false;
        }
      }

      // 3. Max Distance to Metro
      if (filters.maxDistanceToMetro) {
        const dist = apt.location_info?.distance_to_metro_km;
        if (dist === undefined || dist > parseFloat(filters.maxDistanceToMetro)) {
          return false;
        }
      }

      // 4. Specific Metro Station (Multi-select)
      if (filters.selectedMetros.length > 0) {
        if (!apt.location_info?.nearest_metro) return false;
        if (!filters.selectedMetros.includes(apt.location_info.nearest_metro)) {
          return false;
        }
      }

      // 5. Text Search
      if (filters.searchText) {
        const query = filters.searchText.toLowerCase();
        const inTitle = apt.info?.title?.toLowerCase().includes(query) || false;
        const inDesc = apt.info?.description?.toLowerCase().includes(query) || false;
        const inAddress = apt.location_info?.address?.toLowerCase().includes(query) || false;
        if (!inTitle && !inDesc && !inAddress) return false;
      }

      // 6. Furnished
      if (filters.furnishedOnly) {
        if ((apt.details?.is_furnished as unknown as boolean) !== true) return false;
      }

      // 7. Pets Allowed
      if (filters.petsAllowed) {
        if ((apt.details?.pets_allowed as unknown as boolean) !== true) return false;
      }

      return true;
    });
  }, [getRating, filters]);

  // Reset current index if the list shrinks past it
  useMemo(() => {
    if (currentIndex >= notRatedApartments.length && notRatedApartments.length > 0) {
      setCurrentIndex(0);
    }
  }, [notRatedApartments.length, currentIndex]);

  const currentApartment = notRatedApartments[currentIndex];

  const handleNext = () => {
    if (currentIndex < notRatedApartments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleLike = () => {
    if (currentApartment) {
      toggleLike(currentApartment.link);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleDislike = () => {
    if (currentApartment) {
      toggleDislike(currentApartment.link);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  if (notRatedApartments.length === 0 && apartments.filter(a => getRating(a.link) === 'not-rated').length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Parabéns! 🎉
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Você avaliou todos os apartamentos.
          </p>
          <p className="text-gray-500">
            Volte para a listagem para ver seus favoritos ou adicione novos apartamentos.
          </p>
        </div>
      </div>
    );
  }

  const evaluatedCount = apartments.filter(a => getRating(a.link) !== 'not-rated').length;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4">
      {/* Header */}
      <div className="mb-6 w-full max-w-xl lg:max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Avalie Apartamentos
          </h1>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors lg:hidden ${showFilters ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <Filter size={20} />
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          {evaluatedCount} de {apartments.length} avaliados no total
          {notRatedApartments.length !== (apartments.length - evaluatedCount) && (
            <span className="block mt-1 text-emerald-600 font-medium">
              {notRatedApartments.length} apartamentos encontrados com os filtros atuais
            </span>
          )}
        </p>
      </div>

      <div className="w-full max-w-xl lg:max-w-5xl flex gap-8 items-start">
        {/* Filter Panel */}
        <div className={`
          ${showFilters ? 'fixed inset-0 z-50 bg-white/50 backdrop-blur-sm sm:backdrop-blur-md sm:bg-black/20 animate-in fade-in flex items-center justify-center p-4' : 'hidden'}
          lg:static lg:block lg:w-80 lg:shrink-0 lg:bg-transparent lg:p-0 lg:flex-none
        `}>
          <div className="w-full max-w-md bg-white lg:bg-gray-50 rounded-xl lg:border border-gray-200 shadow-xl lg:shadow-sm p-5 max-h-[90vh] lg:max-h-none overflow-y-auto lg:overflow-visible">
            <div className="flex items-center justify-between mb-4 lg:mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filtros</h3>
              <button 
                onClick={() => setShowFilters(false)}
                className="lg:hidden p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Preço Máximo ($)</label>
                <input 
                  type="number" 
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: 1500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Buscar (título, desc, end)</label>
                <input 
                  type="text" 
                  value={filters.searchText}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: 2-bedroom"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Estações de Metrô Específicas</label>
                
                <div className="relative">
                  <button
                    onClick={() => setShowMetroDropdown(!showMetroDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-left"
                  >
                    <span className="truncate">
                      {filters.selectedMetros.length === 0 
                        ? 'Selecionar estações...' 
                        : `${filters.selectedMetros.length} estação(ões) selecionada(s)`}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${showMetroDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showMetroDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md cursor-pointer group transition-colors"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleMetro(metro)}
                                      className="rounded text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className={`text-xs ${isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
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
                        <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-end">
                          <button 
                            onClick={() => setFilters(prev => ({ ...prev, selectedMetros: [] }))}
                            className="text-[10px] font-medium text-red-600 hover:text-red-700 uppercase tracking-wider px-2 py-1"
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Distância Máx. Metrô (km)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={filters.maxDistanceToMetro}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxDistanceToMetro: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Ex: 1.5"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.furnishedOnly}
                    onChange={(e) => setFilters(prev => ({ ...prev, furnishedOnly: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Mobiliado
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.petsAllowed}
                    onChange={(e) => setFilters(prev => ({ ...prev, petsAllowed: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Aceita Pets
                </label>
              </div>

              <div className="pt-4 mt-2 flex justify-end border-t border-gray-100">
                <button 
                  onClick={() => setFilters({ maxPrice: '', maxDistanceToMetro: '', selectedMetros: [], searchText: '', furnishedOnly: false, petsAllowed: false })}
                  className="text-xs text-red-600 font-medium hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-lg"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Container Layout */}
        <div className="flex-1 w-full min-w-0 flex flex-col items-center">
          {/* Card Engine */}
          <div className="w-full flex items-center justify-center mb-6">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-lg mr-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            {/* Card */}
            <div className="flex-1 w-full max-w-xl lg:max-w-2xl mx-4">
              {currentApartment ? (
                <ApartmentCard
                  apartment={currentApartment}
                  rating={getRating(currentApartment.link)}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  variant="tinder"
                />
              ) : (
                <div className="w-full h-[calc(100vh-160px)] min-h-[400px] max-h-[600px] border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 text-gray-500 p-8 text-center">
                  <p>Nenhum apartamento encontrado com os filtros atuais.</p>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentIndex === notRatedApartments.length - 1}
              className="p-3 rounded-lg ml-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight size={24} className="text-gray-700" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xl bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{
                width: `${(evaluatedCount / apartments.length) * 100}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
