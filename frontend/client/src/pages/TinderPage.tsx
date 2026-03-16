import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import apartments from '@/data/apartments.json';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import { useFilterContext } from '@/context/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';

export default function TinderPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { filters, showFilters, setShowFilters, isPinned } = useFilterContext();

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
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Parabéns! 🎉
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            Você avaliou todos os apartamentos.
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Volte para a listagem para ver seus favoritos ou adicione novos apartamentos.
          </p>
        </div>
      </div>
    );
  }

  const evaluatedCount = apartments.filter(a => getRating(a.link) !== 'not-rated').length;

  return (
    <div className="h-[calc(100dvh-58px)] overflow-hidden bg-transparent flex flex-col items-center px-4">
      <div className="relative w-full max-w-[1600px] flex gap-8 items-center h-full">
        {/* Filter Panel */}
        <FilterSidebar />

        {/* Card Container Layout */}
        <div className="flex-1 w-full min-w-0 flex flex-col items-center h-full justify-center">
          {/* Card Engine */}
          <div className="w-full flex items-center justify-center mb-6">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-lg mr-2 sm:mr-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
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
                <div className="w-full h-[calc(100vh-160px)] min-h-[400px] max-h-[600px] border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 p-8 text-center transition-colors">
                  <p>Nenhum apartamento encontrado com os filtros atuais.</p>
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentIndex === notRatedApartments.length - 1}
              className="p-3 rounded-lg ml-2 sm:ml-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronRight size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xl bg-gray-200 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{
                width: `${(evaluatedCount / apartments.length) * 100}%`
              }}
            />
          </div>
        </div>
        
        {/* Dummy spacer to maintain perfect centering when sidebar is pinned */}
        {isPinned && showFilters && (
          <div className="hidden lg:block lg:w-[340px] lg:shrink-0" />
        )}
      </div>
    </div>
  );
}
