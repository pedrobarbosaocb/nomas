import { useState } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ListingPage from './pages/ListingPage';
import TinderPage from './pages/TinderPage';
import { FilterProvider } from './context/FilterContext';
import { TopRibbon } from './components/TopRibbon';

type Page = 'listing' | 'tinder';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('listing');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <ThemeProvider defaultTheme="light" switchable={true}>
          <FilterProvider>
            <TooltipProvider>
              <Toaster />
            
            <TopRibbon 
              currentPage={currentPage} 
              onPageChange={setCurrentPage} 
            />

          {/* Pages */}
            {currentPage === 'listing' && <ListingPage />}
            {currentPage === 'tinder' && <TinderPage />}
            </TooltipProvider>
          </FilterProvider>
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
