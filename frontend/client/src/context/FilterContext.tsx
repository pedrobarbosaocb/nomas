import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { getFilteredMetroData, unbuiltREMStations, getStationByName } from '@/utils/metro';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'distance_asc';

export interface SortCriterion {
  id: 'price' | 'distance';
  direction: 'asc' | 'desc';
}

export interface GlobalStats {
  total: number;
  liked: number;
  disliked: number;
  notRated: number;
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
  ratingFilter: string;
  listingCategory: string;
  aiLabels: string[];
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
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasMore: boolean;
  totalApartments: number;
  availableAiLabels: string[];
  globalStats: GlobalStats;
  gridCols: 1 | 2 | 3;
  setGridCols: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  currentPage: 'listing' | 'tinder';
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children, currentPage = 'listing' }: { children: ReactNode, currentPage?: 'listing' | 'tinder' }) {
  const [showFilters, setShowFilters] = useState(false);
  const [showSortSidebar, setShowSortSidebar] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isSortPinned, setIsSortPinned] = useState(false);
  const [showMetroDropdown, setShowMetroDropdown] = useState(false);
  
  const [filters, _setFilters] = useState<FilterState>({
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
    ratingFilter: 'all',
    listingCategory: 'all',
    aiLabels: [],
  });

  const setFilters: React.Dispatch<React.SetStateAction<FilterState>> = (action) => {
    _setFilters(action);
    setPage(1);
  };

  const [apartments, setApartments] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalApartments, setTotalApartments] = useState(0);
  const [availableAiLabels, setAvailableAiLabels] = useState<string[]>([]);
  const [allMetros, setAllMetros] = useState<string[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ total: 0, liked: 0, disliked: 0, notRated: 0 });
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);

  const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

  const APARTMENT_LABELS = ["short stay", "room(s) in shared apartment/house", "studio", "1-bed", "2-bed", "3-bed", "4-bed", "5+ bedroom apartment"];

  const buildPayload = (currentFilters: FilterState, extra: any = {}) => {
    const payload = { ...currentFilters, ...extra };
    if (payload.listingCategory === 'commercial') payload.aiLabels = ['commercial'];
    else if (payload.listingCategory === 'parking') payload.aiLabels = ['parking space'];
    else if (payload.listingCategory === 'apartment') {
      payload.aiLabels = payload.aiLabels.length > 0 ? payload.aiLabels : APARTMENT_LABELS;
    }
    else if (payload.listingCategory === 'unknown') payload.aiLabels = ['unknown'];
    else payload.aiLabels = []; // all
    return payload;
  };

  const fetchGlobalStats = (currentFilters: FilterState) => {
    fetch(`${API_BASE}/api/listings/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(currentFilters, { ratingFilter: 'all', page: 1, limit: 1 }))
    })
      .then(res => res.json())
      .then(data => setGlobalStats(data))
      .catch(err => console.error("Failed to fetch global stats", err));
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/listings/labels`)
      .then(res => res.json())
      .then(data => setAvailableAiLabels(data))
      .catch(err => console.error("Failed to fetch labels", err));

    fetch(`${API_BASE}/api/listings/metros`)
      .then(res => res.json())
      .then(data => setAllMetros(data))
      .catch(err => console.error("Failed to fetch metros", err));

    fetchGlobalStats(filters);
  }, []);

  useEffect(() => {
    fetchGlobalStats(filters);
  }, [filters]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    
    setIsLoadingListings(true);
    const effectiveRatingFilter = currentPage === 'tinder' ? 'not-rated' : filters.ratingFilter;
    
    fetch(`${API_BASE}/api/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(filters, { page, limit: 30, ratingFilter: effectiveRatingFilter })),
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        if (!isActive) return;
        if (page === 1) {
          setApartments(data.items || []);
        } else {
          setApartments(prev => [...prev, ...(data.items || [])]);
        }
        setTotalApartments(data.total || 0);
        setHasMore((data.items?.length || 0) === 30);
        setIsLoadingListings(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (!isActive) return;
        console.error("Failed to fetch listings:", err);
        setIsLoadingListings(false);
      });
      
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [filters, page, API_BASE, currentPage]);

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
      ratingFilter: 'all',
      listingCategory: 'all',
      aiLabels: [],
    });
  };

  const metroGroups = useMemo(() => {
    const groups: Record<string, string[]> = {
      'Green': [],
      'Orange': [],
      'Blue': [],
      'Yellow': [],
      'REM': [],
      'Other': []
    };

    allMetros.forEach(metroNorm => {
      if (!metroNorm) return;
      
      const station = getFilteredMetroData() && unbuiltREMStations ? null : null; // just keeping imports happy if unused
      const resolved = getStationByName(metroNorm);
      
      if (resolved && resolved.lines.length > 0) {
        // We evaluate against the first line natively serviced
        const line = resolved.lines[0];
        if (groups[line]) {
          groups[line].push(metroNorm);
        } else {
          groups['Other'].push(metroNorm);
        }
      } else {
        groups['Other'].push(metroNorm);
      }
    });

    return Object.fromEntries(Object.entries(groups).filter(([_, list]) => list.length > 0));
  }, [allMetros]);

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
      isLoadingListings,
      page,
      setPage,
      hasMore,
      totalApartments,
      availableAiLabels,
      globalStats,
      gridCols,
      setGridCols,
      currentPage
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
