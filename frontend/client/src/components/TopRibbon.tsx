import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import apartments from '@/data/apartments.json';
import { useFilterContext } from '@/context/FilterContext';
import { Filter, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface TopRibbonProps {
  currentPage: 'listing' | 'tinder';
  onPageChange: (page: 'listing' | 'tinder') => void;
}

export function TopRibbon({ currentPage, onPageChange }: TopRibbonProps) {
  const { getRating } = useApartmentRatings();
  const { showFilters, setShowFilters, filters } = useFilterContext();
  const { theme, toggleTheme } = useTheme();

  const stats = {
    total: apartments.length,
    liked: apartments.filter(apt => getRating(apt.link) === 'liked').length,
    disliked: apartments.filter(apt => getRating(apt.link) === 'disliked').length,
    notRated: apartments.filter(apt => getRating(apt.link) === 'not-rated').length,
  };

  const hasActiveFilters = filters.maxPrice || filters.maxDistanceToMetro || filters.searchText || filters.selectedMetros.length > 0 || filters.furnishedOnly || filters.petsAllowed;

  return (
    <div className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Navigation and Filters */}
        <div className="flex items-center h-full gap-2 sm:gap-6">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border text-xs font-medium ${
              showFilters 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                : hasActiveFilters 
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button
            onClick={() => onPageChange('listing')}
            className={`h-full px-2 text-sm font-medium transition-all border-b-2 flex items-center ${
              currentPage === 'listing'
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            Listagem
          </button>
          <button
            onClick={() => onPageChange('tinder')}
            className={`h-full px-2 text-sm font-medium transition-all border-b-2 flex items-center ${
              currentPage === 'tinder'
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            Avaliar
          </button>
        </div>

        {/* Right: Stats & Theme Toggle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-gray-500 dark:text-gray-400">Total:</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-emerald-600 dark:text-emerald-500">Gostei:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{stats.liked}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-red-500 dark:text-red-400">Não:</span>
              <span className="text-red-600 dark:text-red-500 font-bold">{stats.disliked}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
              <span className="text-gray-500 dark:text-gray-400">A avaliar:</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">{stats.notRated}</span>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
