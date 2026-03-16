import { useApartmentRatings } from '@/hooks/useApartmentRatings';
import apartments from '@/data/apartments.json';
import { useFilterContext, SortOption } from '@/context/FilterContext';
import { useState } from 'react';
import { Filter, Moon, Sun, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface TopRibbonProps {
  currentPage: 'listing' | 'tinder';
  onPageChange: (page: 'listing' | 'tinder') => void;
}

export function TopRibbon({ currentPage, onPageChange }: TopRibbonProps) {
  const { getRating } = useApartmentRatings();
  const { showFilters, setShowFilters, filters, showSortSidebar, setShowSortSidebar } = useFilterContext();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'pt', label: 'Português' },
  ];

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
            <span className="hidden sm:inline">{t('filters')}</span>
          </button>

          <div>
            <button
              onClick={() => setShowSortSidebar(!showSortSidebar)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors border text-xs font-medium ${
                showSortSidebar
                  ? 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800'
              }`}
            >
              <ArrowUpDown size={14} />
              <span className="hidden sm:inline">{t('sort')}</span>
            </button>
          </div>

          <button
            onClick={() => onPageChange('listing')}
            className={`h-full px-2 text-sm font-medium transition-all border-b-2 flex items-center ${
              currentPage === 'listing'
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {t('listing')}
          </button>
          <button
            onClick={() => onPageChange('tinder')}
            className={`h-full px-2 text-sm font-medium transition-all border-b-2 flex items-center ${
              currentPage === 'tinder'
                ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            {t('rate')}
          </button>
        </div>

        {/* Center: App Title */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full pointer-events-none">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
            NOMAS
          </h1>
        </div>

        {/* Right: Stats & Theme Toggle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-gray-500 dark:text-gray-400">{t('total')}</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-emerald-600 dark:text-emerald-500">{t('liked')}</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{stats.liked}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-red-500 dark:text-red-400">{t('disliked')}</span>
              <span className="text-red-600 dark:text-red-500 font-bold">{stats.disliked}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
              <span className="text-gray-500 dark:text-gray-400">{t('notRated')}</span>
              <span className="text-gray-900 dark:text-gray-100 font-bold">{stats.notRated}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-gray-700 uppercase"
                aria-label="Select language"
              >
                {language}
                <ChevronDown size={14} className={`transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showLanguageDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLanguageDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="py-1">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code as 'pt' | 'en' | 'fr');
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            language === lang.code 
                              ? 'bg-gray-100 font-semibold text-gray-900 dark:bg-gray-800 dark:text-white' 
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
