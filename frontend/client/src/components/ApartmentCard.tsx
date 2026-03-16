import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, ExternalLink, ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { RatingStatus } from '@/hooks/useApartmentRatings';

interface Apartment {
  price: string;
  link: string;
  info: {
    source: string;
    title: string;
    description: string;
    available_date: string;
    images: string[];
  };
  location_info: {
    address: string;
    data?: string;
    precision?: string;
    latitude?: number;
    longitude?: number;
    nearest_metro?: string;
    distance_to_metro_km?: number;
  };
  included?: {
    electricity: boolean | null;
    heating: boolean | null;
  };
  details?: {
    unit_details: string;
    is_furnished: boolean | null;
    pets_allowed: boolean | null;
  };
  scores?: {
    walk: string;
    transit: string;
    bike: string;
  };
}

interface ApartmentCardProps {
  apartment: Apartment;
  rating: RatingStatus;
  onLike: () => void;
  onDislike: () => void;
  variant?: 'list' | 'tinder';
}

const statusLabels = {
  'liked': <span className="flex items-center gap-1"><ThumbsUp size={12} /> Gostei</span>,
  'disliked': <span className="flex items-center gap-1"><ThumbsDown size={12} /> Não gostei</span>,
  'not-rated': 'Não avaliado'
};

const statusColors = {
  'liked': 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800',
  'disliked': 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
  'not-rated': 'bg-white border-gray-200 dark:bg-gray-950 dark:border-gray-800'
};

const statusBadgeColors = {
  'liked': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'disliked': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'not-rated': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
};

const metroLineColors: Record<string, string> = {
  'Green': 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800',
  'Orange': 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/30 dark:border-orange-800',
  'Blue': 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800',
  'Yellow': 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800',
};

function formatMetroLine(metro: string) {
  const match = metro.match(/(.*?)\s*\((.*?)\)/);
  if (!match) return <span className="text-gray-900 dark:text-gray-100">{metro}</span>;
  
  const [_, name, color] = match;
  const colorClass = metroLineColors[color] || 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700';
  
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-semibold ${colorClass}`}>
      {name}
    </span>
  );
}

export function ApartmentCard({
  apartment,
  rating,
  onLike,
  onDislike,
  variant = 'list'
}: ApartmentCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [apartment.link]);

  const images = apartment.info.images && apartment.info.images.length > 0 
    ? apartment.info.images 
    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'];

  const mainImage = images[currentImageIndex] || images[0];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    } else if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
  };

  if (variant === 'tinder') {
    return (
      <>
        <div className={`w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg flex flex-col h-[calc(100vh-160px)] min-h-[400px] max-h-[600px] overflow-hidden transition-colors`}>
        {/* Image Header */}
        <div 
          className="h-[40%] min-h-[200px] max-h-[320px] relative bg-gray-100 dark:bg-gray-950 flex-shrink-0 group"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img 
            src={mainImage} 
            alt={apartment.info.title} 
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
          
          {images.length > 1 && (
            <>
              <div 
                className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
                onClick={handlePrevImage}
              />
              <div 
                className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
                onClick={handleNextImage}
              />

              <div className="absolute inset-y-0 left-2 flex items-center shrink-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/30 text-white p-1 rounded-full backdrop-blur-sm">
                  <ChevronLeft size={20} />
                </div>
              </div>
              <div className="absolute inset-y-0 right-2 flex items-center shrink-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/30 text-white p-1 rounded-full backdrop-blur-sm">
                  <ChevronRight size={20} />
                </div>
              </div>

              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none px-4 flex-wrap pb-1">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${
                      idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 left-4 right-4 flex justify-between z-30 pointer-events-none">
            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              {apartment.info.source}
            </span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm ${statusBadgeColors[rating]}`}>
              {statusLabels[rating]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <h2 
              onClick={() => setIsModalOpen(true)}
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title="Expandir detalhes"
            >
              {apartment.info.title}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="mb-4">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500 mb-1">
                {apartment.price}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                📍 {apartment.location_info.address}
              </p>
              {apartment.location_info.nearest_metro && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-gray-400 dark:text-gray-500">🚇</span> 
                  {formatMetroLine(apartment.location_info.nearest_metro)}
                  {apartment.location_info.distance_to_metro_km && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({apartment.location_info.distance_to_metro_km}km)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                {apartment.info.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 mt-auto @container">
            <div className="flex gap-3 mb-3">
              <button
                onClick={onDislike}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                  rating === 'disliked'
                    ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-red-200 hover:text-red-600 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900'
                }`}
              >
                <ThumbsDown size={20} className="shrink-0" />
                <span className="hidden @[280px]:inline">Não gostei</span>
              </button>
              <button
                onClick={onLike}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                  rating === 'liked'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-600 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-900'
                }`}
              >
                <ThumbsUp size={20} className="shrink-0" />
                <span className="hidden @[280px]:inline">Gostei</span>
              </button>
            </div>
            
            <a
              href={apartment.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 font-medium py-2 transition-colors w-full"
            >
              <span className="hidden @[280px]:inline">Ver anúncio original</span>
              <ExternalLink size={16} className="shrink-0" />
            </a>
          </div>
        </div>
      </div>
      <ApartmentDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        apartment={apartment} 
        rating={rating} 
        onLike={onLike} 
        onDislike={onDislike} 
      />
      </>
    );
  }

  // Variant: list
  return (
    <>
      <div className={`h-full min-h-[520px] overflow-hidden border rounded-xl transition-all hover:shadow-lg flex flex-col bg-white dark:bg-gray-900 ${
      rating === 'liked' ? 'border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-50 dark:ring-emerald-900/30' : 
      rating === 'disliked' ? 'border-red-200 dark:border-red-800 opacity-60' : 
      'border-gray-200 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800/50'
    }`}>
      {/* List Image */}
      <div 
        className="h-[240px] w-full flex-shrink-0 relative group bg-gray-100 dark:bg-gray-950"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img 
          src={mainImage} 
          alt={apartment.info.title} 
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
        
        {images.length > 1 && (
          <>
            <div 
              className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
              onClick={handlePrevImage}
            />
            <div 
              className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
              onClick={handleNextImage}
            />

            <div className="absolute inset-y-0 left-1 flex items-center shrink-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/30 text-white p-0.5 rounded-full backdrop-blur-sm">
                <ChevronLeft size={16} />
              </div>
            </div>
            <div className="absolute inset-y-0 right-1 flex items-center shrink-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/30 text-white p-0.5 rounded-full backdrop-blur-sm">
                <ChevronRight size={16} />
              </div>
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-20 pointer-events-none px-2 flex-wrap pb-1">
              {images.map((_, idx) => (
                <div 
                  key={idx}
                  className={`w-1 h-1 rounded-full shadow-sm transition-all ${
                    idx === currentImageIndex ? 'bg-white w-2' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 flex gap-1 flex-col z-30 pointer-events-none">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded shadow-sm text-gray-800 uppercase">
            {apartment.info.source}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col min-w-0 @container">
        <div className="flex flex-col mb-2">
          <div className="flex justify-end mb-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 border ${statusColors[rating]}`}>
              {statusLabels[rating]}
            </span>
          </div>
          <h3 
            onClick={() => setIsModalOpen(true)}
            className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title="Expandir detalhes"
          >
            {apartment.info.title}
          </h3>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-500 mb-0.5">
            {apartment.price}
          </p>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 truncate">
              <span className="text-gray-400 dark:text-gray-500">📍</span> {apartment.location_info.address}
            </p>
            {apartment.location_info.nearest_metro && (
              <div className="mt-1.5 flex items-center gap-1.5 truncate">
                <span className="text-gray-400 dark:text-gray-500">🚇</span>
                {formatMetroLine(apartment.location_info.nearest_metro)}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed flex-1">
          {apartment.info.description}
        </p>

        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex gap-2">
            <button
              onClick={onDislike}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                rating === 'disliked'
                  ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900'
              }`}
            >
              <ThumbsDown size={16} className="shrink-0" />
              <span className="hidden @[280px]:inline">Não gostei</span>
            </button>
            <button
              onClick={onLike}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                rating === 'liked'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-900'
              }`}
            >
              <ThumbsUp size={16} className="shrink-0" />
              <span className="hidden @[280px]:inline">Gostei</span>
            </button>
          </div>
          <a
            href={apartment.link}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver anúncio original"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm w-full dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <span className="hidden @[280px]:inline">Ver anúncio original</span>
            <ExternalLink size={16} className="shrink-0" />
          </a>
        </div>
      </div>
    </div>
    <ApartmentDetailsModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      apartment={apartment} 
      rating={rating} 
      onLike={onLike} 
      onDislike={onDislike} 
    />
    </>
  );
}

// Modal Component defined in the same file to keep imports clean
function ApartmentDetailsModal({ 
  isOpen, 
  onClose, 
  apartment, 
  rating, 
  onLike, 
  onDislike 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  apartment: Apartment; 
  rating: RatingStatus;
  onLike: () => void;
  onDislike: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 pr-8 truncate">
            {apartment.info.title}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 flex flex-col gap-8">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column: Images */}
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-950 shadow-inner">
                <img 
                  src={apartment.info.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3'} 
                  alt="Main"
                  className="w-full h-full object-cover"
                />
              </div>
              {apartment.info.images && apartment.info.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {apartment.info.images.slice(1, 9).map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details */}
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{apartment.price}</span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide border ${statusColors[rating]}`}>
                    {statusLabels[rating]}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 text-lg">
                  📍 {apartment.location_info.address}
                </p>
                {apartment.location_info.nearest_metro && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-gray-400 dark:text-gray-500">🚇</span>
                    {formatMetroLine(apartment.location_info.nearest_metro)}
                    {apartment.location_info.distance_to_metro_km && (
                      <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                        ({apartment.location_info.distance_to_metro_km}km)
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 tracking-wider">Fonte</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{apartment.info.source}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold mb-1 tracking-wider">Disponibilidade</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{apartment.info.available_date || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-colors ${apartment.scores?.walk ? 'bg-emerald-50/80 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/50' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-800'}`}>
                  <p className={`text-[10px] uppercase font-bold mb-0.5 tracking-wider ${apartment.scores?.walk ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>Walk</p>
                  <p className={`text-xl font-bold ${apartment.scores?.walk ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'}`}>{apartment.scores?.walk || '-'}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-colors ${apartment.scores?.transit ? 'bg-blue-50/80 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-800'}`}>
                  <p className={`text-[10px] uppercase font-bold mb-0.5 tracking-wider ${apartment.scores?.transit ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>Transit</p>
                  <p className={`text-xl font-bold ${apartment.scores?.transit ? 'text-blue-700 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`}>{apartment.scores?.transit || '-'}</p>
                </div>
                <div className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-colors ${apartment.scores?.bike ? 'bg-orange-50/80 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-800'}`}>
                  <p className={`text-[10px] uppercase font-bold mb-0.5 tracking-wider ${apartment.scores?.bike ? 'text-orange-600 dark:text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>Bike</p>
                  <p className={`text-xl font-bold ${apartment.scores?.bike ? 'text-orange-700 dark:text-orange-400' : 'text-gray-300 dark:text-gray-600'}`}>{apartment.scores?.bike || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Row: Specs & Description */}
          <div className="flex flex-col md:flex-row gap-8 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full md:w-1/3">
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 h-full w-full">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 pb-2">Incluso</h4>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300 pt-1">
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">{apartment.details?.is_furnished === true ? '✅' : apartment.details?.is_furnished === false ? '❌' : <span className="text-gray-400 dark:text-gray-500 font-bold">?</span>}</span> Mobiliado
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">{apartment.details?.pets_allowed === true ? '✅' : apartment.details?.pets_allowed === false ? '❌' : <span className="text-gray-400 dark:text-gray-500 font-bold">?</span>}</span> Aceita Pets
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">{apartment.included?.electricity === true ? '✅' : apartment.included?.electricity === false ? '❌' : <span className="text-gray-400 dark:text-gray-500 font-bold">?</span>}</span> Eletricidade
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 text-center">{apartment.included?.heating === true ? '✅' : apartment.included?.heating === false ? '❌' : <span className="text-gray-400 dark:text-gray-500 font-bold">?</span>}</span> Aquecimento
                  </li>
                </ul>
              </div>
            </div>

            <div className="w-full md:w-2/3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">Descrição</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {apartment.info.description}
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
          <button
            onClick={onDislike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
              rating === 'disliked'
                ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-red-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-red-400'
            }`}
          >
            <ThumbsDown size={20} /> Não gostei
          </button>
          <a
            href={apartment.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-md"
          >
            Site Original <ExternalLink size={18} />
          </a>
          <button
            onClick={onLike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
              rating === 'liked'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 hover:text-emerald-600 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-emerald-400'
            }`}
          >
            <ThumbsUp size={20} /> Gostei
          </button>
        </div>

      </div>
    </div>
  );
}
