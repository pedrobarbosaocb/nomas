import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import { useFilterContext } from '@/context/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SortSidebar } from '@/components/SortSidebar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TinderPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();
  
  const { filters, showFilters, setShowFilters, isPinned, isSortPinned, showSortSidebar, apartments, isLoadingListings } = useFilterContext();

  // Filtrar apenas apartamentos não avaliados e que batem com o filtro
  const notRatedApartments = useMemo(() => {
    let result = (apartments || []).filter(apt => {
      // 1. Check if rated
      if (getRating(apt.id) !== 'not-rated') return false;

      // 1b. Min Price Filter
      if (filters.minPrice) {
        const priceVal = parseFloat(apt.price.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(priceVal) && priceVal < parseFloat(filters.minPrice)) {
          return false;
        }
      }

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

      // 8. Electricity
      if (filters.electricityIncluded) {
        if ((apt.included?.electricity as unknown as boolean) !== true) return false;
      }

      // 9. Heating
      if (filters.heatingIncluded) {
        if ((apt.included?.heating as unknown as boolean) !== true) return false;
      }

      return true;
    });

    if (filters.advancedSorting) {
      result.sort((a, b) => {
        for (const criterion of filters.advancedSortItems) {
          if (criterion.id === 'price') {
            const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, '')) || 0;
            const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, '')) || 0;
            const diff = priceA - priceB;
            if (diff !== 0) return criterion.direction === 'asc' ? diff : -diff;
          } else if (criterion.id === 'distance') {
            const distA = a.location_info?.distance_to_metro_km ?? Infinity;
            const distB = b.location_info?.distance_to_metro_km ?? Infinity;
            const diff = distA - distB;
            if (diff !== 0) return criterion.direction === 'asc' ? diff : -diff;
          }
        }
        return 0;
      });
    } else {
      if (filters.sortBy === 'price_asc') {
        result.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, '')) || 0;
          return priceA - priceB;
        });
      } else if (filters.sortBy === 'price_desc') {
        result.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, '')) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, '')) || 0;
          return priceB - priceA;
        });
      } else if (filters.sortBy === 'distance_asc') {
        result.sort((a, b) => {
          const distA = a.location_info?.distance_to_metro_km ?? Infinity;
          const distB = b.location_info?.distance_to_metro_km ?? Infinity;
          return distA - distB;
        });
      }
    }

    return result;
  }, [getRating, filters, apartments]);

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
      toggleLike(currentApartment.id);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleDislike = () => {
    if (currentApartment) {
      toggleDislike(currentApartment.id);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  if (isLoadingListings) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">
            Carregando apartamentos...
          </p>
        </div>
      </div>
    );
  }

  if (notRatedApartments.length === 0 && (apartments || []).filter(a => getRating(a.id) === 'not-rated').length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('congrats')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
            {t('allRated')}
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            {t('backToListing')}
          </p>
        </div>
      </div>
    );
  }

  const evaluatedCount = (apartments || []).filter(a => getRating(a.id) !== 'not-rated').length;

  return (
    <div className="h-[calc(100dvh-58px)] overflow-hidden bg-transparent flex flex-col items-center">
      <div className="relative w-full max-w-[1600px] mx-auto px-4 flex items-center h-full justify-center">
        
        {/* Left Sidebars Container */}
        <div className={`flex flex-col gap-6 shrink-0 z-40 w-full lg:w-auto ${
          (isPinned && showFilters) || (isSortPinned && showSortSidebar) ? 'mr-8' : ''
        }`}>
          <SortSidebar />
          <FilterSidebar />
        </div>

        {/* Card Container Layout */}
        <div className="flex-1 w-full min-w-0 flex flex-col items-center h-full justify-center py-4">
          {/* Card Engine */}
          <div className="w-full flex-1 flex items-center justify-center mb-6 min-h-0">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-lg mr-2 sm:mr-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
            </button>

            {/* Card */}
            <div className="flex-1 w-full h-full max-h-[85dvh] max-w-xl lg:max-w-2xl mx-4">
              {currentApartment ? (
                <ApartmentCard
                  apartment={currentApartment}
                  rating={getRating(currentApartment.id)}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  variant="tinder"
                />
              ) : (
                <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 p-8 text-center transition-colors">
                  <p>{t('noneFoundFilters')}</p>
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
                width: `${(evaluatedCount / Math.max((apartments || []).length, 1)) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Dummy spacer to maintain perfect centering when any sidebar is pinned */}
        <div className={`lg:w-[340px] lg:shrink-0 transition-all pointer-events-none ${
          (isPinned && showFilters) || (isSortPinned && showSortSidebar) ? 'hidden lg:block ml-8 opacity-0' : 'hidden'
        }`} />
      </div>
    </div>
  );
}
