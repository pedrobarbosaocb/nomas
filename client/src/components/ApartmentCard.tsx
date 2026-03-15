import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
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

const statusColors = {
  'liked': 'bg-emerald-50 border-emerald-200',
  'disliked': 'bg-red-50 border-red-200',
  'not-rated': 'bg-white border-gray-200'
};

const statusBadgeColors = {
  'liked': 'bg-emerald-100 text-emerald-700',
  'disliked': 'bg-red-100 text-red-700',
  'not-rated': 'bg-gray-100 text-gray-600'
};

const statusLabels = {
  'liked': 'Gostei',
  'disliked': 'Não gostei',
  'not-rated': 'Não avaliado'
};

export function ApartmentCard({
  apartment,
  rating,
  onLike,
  onDislike,
  variant = 'list'
}: ApartmentCardProps) {
  const mainImage = apartment.info.images && apartment.info.images.length > 0 
    ? apartment.info.images[0] 
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';

  if (variant === 'tinder') {
    return (
      <div className={`w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col h-[700px] overflow-hidden`}>
        {/* Image Header */}
        <div className="h-64 relative bg-gray-100 flex-shrink-0">
          <img 
            src={mainImage} 
            alt={apartment.info.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide text-gray-800 shadow-sm border border-gray-200/50">
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
            <h2 className="text-xl font-semibold text-gray-900 leading-tight line-clamp-2">
              {apartment.info.title}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="mb-4">
              <p className="text-3xl font-bold text-emerald-600 mb-1">
                {apartment.price}
              </p>
              <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                📍 {apartment.location_info.address}
              </p>
              {apartment.location_info.nearest_metro && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  🚇 {apartment.location_info.nearest_metro}
                  {apartment.location_info.distance_to_metro_km && (
                    <span className="ml-1 opacity-75">
                      ({apartment.location_info.distance_to_metro_km}km)
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-700 leading-relaxed text-sm">
                {apartment.info.description}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 mt-auto">
            <div className="flex gap-3 mb-3">
              <button
                onClick={onDislike}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                  rating === 'disliked'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-red-200 hover:text-red-600'
                }`}
              >
                <ThumbsDown size={20} />
                Não gostei
              </button>
              <button
                onClick={onLike}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-sm ${
                  rating === 'liked'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-600'
                }`}
              >
                <ThumbsUp size={20} />
                Gostei
              </button>
            </div>
            
            <a
              href={apartment.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-medium py-2 transition-colors"
            >
              Ver anúncio original
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Variant: list
  return (
    <div className={`overflow-hidden border rounded-xl transition-all hover:shadow-lg flex flex-col sm:flex-row bg-white ${
      rating === 'liked' ? 'border-emerald-200 ring-1 ring-emerald-50' : 
      rating === 'disliked' ? 'border-red-200 opacity-60' : 
      'border-gray-200'
    }`}>
      {/* List Image */}
      <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 relative">
        <img 
          src={mainImage} 
          alt={apartment.info.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-1 flex-col">
          <span className="bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded shadow-sm text-gray-800 uppercase">
            {apartment.info.source}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-2 mt-0.5">
            {apartment.info.title}
          </h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${statusBadgeColors[rating]}`}>
            {statusLabels[rating]}
          </span>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-bold text-emerald-600 mb-0.5">
            {apartment.price}
          </p>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-gray-600 flex items-center gap-1.5 truncate">
              <span className="text-gray-400">📍</span> {apartment.location_info.address}
            </p>
            {apartment.location_info.nearest_metro && (
              <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                <span className="text-gray-400">🚇</span> {apartment.location_info.nearest_metro}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-1">
          {apartment.info.description}
        </p>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={onDislike}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              rating === 'disliked'
                ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
            }`}
          >
            <ThumbsDown size={16} />
            Não gostei
          </button>
          <button
            onClick={onLike}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              rating === 'liked'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
            }`}
          >
            <ThumbsUp size={16} />
            Gostei
          </button>
          <a
            href={apartment.link}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver anúncio original"
            className="flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
