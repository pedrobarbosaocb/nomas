import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import apartments from '@/data/apartments.json';

export interface FilterState {
  maxPrice: string;
  maxDistanceToMetro: string;
  selectedMetros: string[];
  searchText: string;
  furnishedOnly: boolean;
  petsAllowed: boolean;
}

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  showMetroDropdown: boolean;
  setShowMetroDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  metroGroups: Record<string, string[]>;
  toggleMetro: (metro: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    maxPrice: '',
    maxDistanceToMetro: '',
    selectedMetros: [],
    searchText: '',
    furnishedOnly: false,
    petsAllowed: false,
  });

  const clearFilters = () => {
    setFilters({
      maxPrice: '',
      maxDistanceToMetro: '',
      selectedMetros: [],
      searchText: '',
      furnishedOnly: false,
      petsAllowed: false,
    });
  };

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

  return (
    <FilterContext.Provider value={{
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
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
