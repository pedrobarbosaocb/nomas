import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { unbuiltREMStations } from '@/utils/metro';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'distance_asc';

export interface SortCriterion {
  id: 'price' | 'distance';
  direction: 'asc' | 'desc';
}

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  maxDistanceToMetro: string;
  selectedMetros: string[];
  searchText: string;
  electricityIncluded: boolean;
  heatingIncluded: boolean;
  petsAllowed: boolean;
  furnishedOnly: boolean;
  sortBy: SortOption;
  advancedSorting: boolean;
  advancedSortItems: SortCriterion[];
}

interface FilterContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  showSortSidebar: boolean;
  setShowSortSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  isPinned: boolean;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  isSortPinned: boolean;
  setIsSortPinned: React.Dispatch<React.SetStateAction<boolean>>;
  showMetroDropdown: boolean;
  setShowMetroDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  metroGroups: Record<string, string[]>;
  toggleMetro: (metro: string) => void;
  clearFilters: () => void;
  apartments: any[];
  setApartments: React.Dispatch<React.SetStateAction<any[]>>;
  isLoadingListings: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSortSidebar, setShowSortSidebar] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSortPinned, setIsSortPinned] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    maxDistanceToMetro: '',
    selectedMetros: [],
    searchText: '',
    electricityIncluded: false,
    heatingIncluded: false,
    petsAllowed: false,
    furnishedOnly: false,
    sortBy: 'default',
    advancedSorting: false,
    advancedSortItems: [{ id: 'price', direction: 'asc' }, { id: 'distance', direction: 'asc' }],
  });

  const [apartments, setApartments] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  useEffect(() => {
    fetch(`${API_BASE}/api/listings`)
      .then(res => res.json())
      .then(data => {
        setApartments(data);
        setIsLoadingListings(false);
      })
      .catch(err => {
        console.error("Failed to fetch listings:", err);
        setIsLoadingListings(false);
      });
  }, []);

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      maxDistanceToMetro: '',
      selectedMetros: [],
      searchText: '',
      electricityIncluded: false,
      heatingIncluded: false,
      petsAllowed: false,
      furnishedOnly: false,
      sortBy: 'default',
      advancedSorting: false,
      advancedSortItems: [{ id: 'price', direction: 'asc' }, { id: 'distance', direction: 'asc' }],
    });
  };

  const metroGroups = useMemo(() => {
    const metros = apartments
      .map(apt => apt.location_info?.nearest_metro)
      .filter((metro): metro is string => Boolean(metro))
      .filter(metro => {
        const match = metro.match(/(.*?)\s*\(/);
        if(!match) return true;
        return !unbuiltREMStations.has(match[1].trim());
      });
    
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
  }, [apartments]);

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
      showSortSidebar,
      setShowSortSidebar,
      isPinned,
      setIsPinned,
      isSortPinned,
      setIsSortPinned,
      showMetroDropdown,
      setShowMetroDropdown,
      metroGroups,
      toggleMetro,
      clearFilters,
      apartments,
      setApartments,
      isLoadingListings
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
