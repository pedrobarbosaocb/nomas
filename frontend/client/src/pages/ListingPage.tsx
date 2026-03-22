import { useState } from 'react';
import { Home, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import { useFilterContext } from '@/context/FilterContext';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SortSidebar } from '@/components/SortSidebar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ListingPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const { t } = useLanguage();
  const { 
    filters, setFilters, 
    isPinned, isSortPinned, 
    apartments, isLoadingListings,
    page, setPage, hasMore, totalApartments, globalStats,
    gridCols, setGridCols
  } = useFilterContext();

  const handleRatingFilter = (type: string) => {
    setFilters((prev: any) => ({ ...prev, ratingFilter: type }));
  };

  return (
    <div className="min-h-screen bg-transparent transition-colors">
      <div className="bg-white dark:bg-gray-950 sticky top-14 z-40 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 py-3">

          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleRatingFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all ${
                filters.ratingFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Home size={16} />
              {t('all')}
            </button>
            <button
              onClick={() => handleRatingFilter('liked')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium transition-all ${
                filters.ratingFilter === 'liked'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/50'
              }`}
            >
              <ThumbsUp size={16} />
              {t('liked')}
            </button>
            <button
              onClick={() => handleRatingFilter('disliked')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded font-medium transition-all ${
                filters.ratingFilter === 'disliked'
                  ? 'bg-red-600 text-white dark:bg-red-500'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50'
              }`}
            >
              <ThumbsDown size={16} />
              {t('disliked')}
            </button>
            <button
              onClick={() => handleRatingFilter('not-rated')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filters.ratingFilter === 'not-rated'
                  ? 'bg-gray-600 text-white dark:bg-gray-500'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
              }`}
            >
              {t('notRatedBtn')}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t('cardsPerRow')}</span>
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

      <div className={`relative max-w-[1600px] mx-auto px-4 py-8 flex flex-col lg:flex-row items-start ${isPinned || isSortPinned ? 'gap-6 lg:gap-8' : ''}`}>
        <div className="flex flex-col gap-6 shrink-0 z-40 w-full lg:w-auto">
          <SortSidebar />
          <FilterSidebar />
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="mb-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{totalApartments} {t('apartmentsFound')}</span>
          </div>

          {!isLoadingListings && apartments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {t('noApartments')}
              </p>
            </div>
          ) : (
            <>
              {(() => {
                const sortedApartments = [...apartments].sort((a: any, b: any) => {
                  const ratingA = getRating(a.id);
                  const ratingB = getRating(b.id);
                  if (ratingA === 'disliked' && ratingB !== 'disliked') return 1;
                  if (ratingA !== 'disliked' && ratingB === 'disliked') return -1;
                  return 0;
                });
                
                return (
                  <div className={`grid gap-6 ${
                    gridCols === 1 ? 'grid-cols-1' :
                    gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {sortedApartments.map((apartment: any, idx: number) => (
                  <ApartmentCard
                    key={`${apartment.id}-${idx}`}
                    apartment={apartment}
                    rating={getRating(apartment.id)}
                    onLike={() => toggleLike(apartment.id)}
                      onDislike={() => toggleDislike(apartment.id)}
                      variant="list"
                    />
                  ))}
                  </div>
                );
              })()}
              
              {isLoadingListings && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">
                     {t('loading')}
                  </p>
                </div>
              )}

              {hasMore && !isLoadingListings && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={isLoadingListings}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {t('loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
