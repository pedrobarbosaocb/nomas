import { useState } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ListingPage from './pages/ListingPage';
import TinderPage from './pages/TinderPage';

type Page = 'listing' | 'tinder';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('listing');

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          
          {/* Navigation */}
          <nav className="border-b border-gray-200 bg-white sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 flex items-center gap-8">
              <button
                onClick={() => setCurrentPage('listing')}
                className={`py-4 px-2 font-medium transition-all border-b-2 ${
                  currentPage === 'listing'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Listagem
              </button>
              <button
                onClick={() => setCurrentPage('tinder')}
                className={`py-4 px-2 font-medium transition-all border-b-2 ${
                  currentPage === 'tinder'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Avaliar
              </button>
            </div>
          </nav>

          {/* Pages */}
          {currentPage === 'listing' && <ListingPage />}
          {currentPage === 'tinder' && <TinderPage />}
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
