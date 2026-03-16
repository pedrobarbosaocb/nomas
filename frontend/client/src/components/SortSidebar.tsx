import { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X, Pin, PinOff, GripVertical, Plus } from 'lucide-react';
import { useFilterContext, SortOption } from '@/context/FilterContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function SortSidebar() {
  const { t } = useLanguage();
  const { 
    filters,
    setFilters,
    showSortSidebar,
    setShowSortSidebar,
    isSortPinned,
    setIsSortPinned
  } = useFilterContext();

  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        !isSortPinned && 
        showSortSidebar
      ) {
        setShowSortSidebar(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortPinned, showSortSidebar, setShowSortSidebar]);

  const moveSortItem = (index: number, direction: 'up' | 'down') => {
    setFilters(prev => {
      const newItems = [...prev.advancedSortItems];
      if (direction === 'up' && index > 0) {
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      } else if (direction === 'down' && index < newItems.length - 1) {
        [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
      }
      return { ...prev, advancedSortItems: newItems };
    });
  };

  const toggleSortDirection = (index: number) => {
    setFilters(prev => {
      const newItems = [...prev.advancedSortItems];
      newItems[index].direction = newItems[index].direction === 'asc' ? 'desc' : 'asc';
      return { ...prev, advancedSortItems: newItems };
    });
  };

  return (
    <div className={`
      ${showSortSidebar ? (
        isSortPinned 
          ? 'hidden lg:block lg:w-[340px] lg:shrink-0 lg:bg-transparent lg:p-0 lg:flex-none'
          : 'fixed inset-0 z-[60] bg-white/50 backdrop-blur-sm sm:backdrop-blur-md sm:bg-black/20 animate-in fade-in flex items-center justify-center p-4 lg:absolute lg:top-0 lg:left-0 lg:h-full lg:items-start lg:justify-start lg:bg-transparent lg:backdrop-blur-none lg:p-0 pt-[100px] lg:pt-0'
      ) : 'hidden'}
    `}>
      <div 
        ref={sidebarRef}
        className={`w-full max-w-sm lg:max-w-md bg-white lg:bg-gray-50 dark:bg-gray-900 lg:dark:bg-gray-900 rounded-xl lg:border shadow-xl lg:shadow-sm p-5 max-h-[90vh] lg:max-h-[calc(100vh-100px)] overflow-y-auto lg:overflow-visible transition-all lg:w-[340px] lg:max-w-none ${!isSortPinned && showSortSidebar ? 'border-gray-200 dark:border-gray-700 lg:mt-6 lg:shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] lg:bg-white lg:dark:bg-gray-800 lg:absolute lg:z-[60]' : 'border-gray-200 dark:border-gray-800'}`}
      >
        <div className="flex items-center justify-between mb-4 lg:mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('sort')}</h3>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSortPinned(!isSortPinned)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors hidden lg:block"
              title={isSortPinned ? t('toggleMenuUnpin') : t('toggleMenuPin')}
            >
              {isSortPinned ? <PinOff size={16} /> : <Pin size={16} />}
            </button>
            <button 
               onClick={() => setShowSortSidebar(false)}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              <input 
                type="checkbox"
                checked={filters.advancedSorting}
                onChange={(e) => setFilters(prev => ({ ...prev, advancedSorting: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 w-4 h-4"
              />
              {t('advancedSorting')}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
              {t('allowsMultipleCriteria')}
            </p>
          </div>

          {!filters.advancedSorting ? (
            <div className="space-y-1">
              {[
                { value: 'default', label: t('defaultSort') },
                { value: 'price_asc', label: t('lowestPrice') },
                { value: 'price_desc', label: t('highestPrice') },
                { value: 'distance_asc', label: t('closestMetro') },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, sortBy: option.value as SortOption }));
                    if (!isSortPinned) setShowSortSidebar(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors border ${
                    filters.sortBy === option.value
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-white border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800/50 dark:hover:border-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mb-2">
                {t('sortPriorityText')}
              </p>
              {filters.advancedSortItems.map((item, index) => (
                <div key={item.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {index + 1}. {item.id === 'price' ? t('sortByPrice') : t('sortByDistance')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveSortItem(index, 'up')}
                        disabled={index === 0}
                        className={`p-1.5 rounded-md ${index === 0 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500 bg-gray-50 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveSortItem(index, 'down')}
                        disabled={index === filters.advancedSortItems.length - 1}
                        className={`p-1.5 rounded-md ${index === filters.advancedSortItems.length - 1 ? 'text-gray-300 dark:text-gray-700' : 'text-gray-500 bg-gray-50 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSortDirection(index)}
                    className="text-xs w-full py-1.5 text-center font-medium bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {item.direction === 'asc' ? t('ascending') : t('descending')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
