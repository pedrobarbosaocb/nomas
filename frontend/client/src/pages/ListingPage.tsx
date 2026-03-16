import { useState, useMemo } from 'react';
import { Home, ThumbsUp, ThumbsDown } from 'lucide-react';
import apartments from '@/data/apartments.json';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import { useFilterContext } from '@/context/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';

type FilterType = 'all' | 'liked' | 'disliked' | 'not-rated';

export default function ListingPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [filter, setFilter] = useState<FilterType>('all');
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(2);
  const { filters, showFilters, setShowFilters } = useFilterContext();

  const filteredApartments = useMemo(() => {
    return apartments.filter(apt => {
      // 1. Check local rating filter
      if (filter !== 'all' && getRating(apt.link) !== filter) return false;

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
  }, [filter, getRating, filters]);

  const stats = {
    liked: apartments.filter(apt => getRating(apt.link) === 'liked').length,
    disliked: apartments.filter(apt => getRating(apt.link) === 'disliked').length,
    notRated: apartments.filter(apt => getRating(apt.link) === 'not-rated').length,
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      {/* Header Container for Filters only */}
      <div className="bg-white dark:bg-gray-950 sticky top-14 z-40 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 py-3">

          {/* Local Filters vs Global Filters Split */}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Home size={16} />
              Todos
            </button>
            <button
              onClick={() => setFilter('liked')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium transition-all ${
                filter === 'liked'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
              }`}
            >
              <ThumbsUp size={16} />
              Gostei ({stats.liked})
            </button>
            <button
              onClick={() => setFilter('disliked')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium transition-all ${
                filter === 'disliked'
                  ? 'bg-red-600 text-white dark:bg-red-500'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'
              }`}
            >
              <ThumbsDown size={16} />
              Não gostei ({stats.disliked})
            </button>
            <button
              onClick={() => setFilter('not-rated')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filter === 'not-rated'
                  ? 'bg-gray-600 text-white dark:bg-gray-500'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              Não avaliado ({stats.notRated})
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">Cards por linha:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setGridCols(num as 1|2|3)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                    gridCols === num ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-[1600px] mx-auto px-4 py-8 flex gap-8 items-start">
        {/* Sidebar */}
        <FilterSidebar />

        {/* Content */}
        <div className="flex-1 w-full min-w-0">
          {filteredApartments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Nenhum apartamento encontrado com este filtro.
              </p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              gridCols === 1 ? 'grid-cols-1' :
              gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {filteredApartments.map(apartment => (
                <ApartmentCard
                  key={apartment.link}
                  apartment={apartment}
                  rating={getRating(apartment.link)}
                  onLike={() => toggleLike(apartment.link)}
                  onDislike={() => toggleDislike(apartment.link)}
                  variant="list"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
