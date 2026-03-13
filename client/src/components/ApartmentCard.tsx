import { ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { RatingStatus } from '@/hooks/useApartmentRatings';

interface Apartment {
  id: string;
  source: string;
  title: string;
  price: string;
  location: string;
  description: string;
  link: string;
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
  if (variant === 'tinder') {
    return (
      <div className={`w-full max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg p-8 flex flex-col h-[600px]`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {apartment.source}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded ${statusBadgeColors[rating]}`}>
              {statusLabels[rating]}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
            {apartment.title}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          <div>
            <p className="text-3xl font-bold text-emerald-600 mb-1">
              {apartment.price}
            </p>
            <p className="text-sm text-gray-600">
              {apartment.location}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-700 leading-relaxed">
              {apartment.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={onDislike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded font-medium transition-all ${
              rating === 'disliked'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <ThumbsDown size={18} />
            Não gostei
          </button>
          <button
            onClick={onLike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded font-medium transition-all ${
              rating === 'liked'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp size={18} />
            Gostei
          </button>
        </div>

        {/* Link */}
        <a
          href={apartment.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver anúncio original
          <ExternalLink size={16} />
        </a>
      </div>
    );
  }

  // Variant: list
  return (
    <div className={`border rounded-lg p-6 transition-all hover:shadow-md ${statusColors[rating]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {apartment.source}
          </span>
          <h3 className="text-lg font-semibold text-gray-900 mt-2">
            {apartment.title}
          </h3>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded whitespace-nowrap ml-4 ${statusBadgeColors[rating]}`}>
          {statusLabels[rating]}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-2xl font-bold text-emerald-600">
          {apartment.price}
        </p>
        <p className="text-sm text-gray-600">
          📍 {apartment.location}
        </p>
      </div>

      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
        {apartment.description}
      </p>

      <div className="flex gap-2">
        <button
          onClick={onDislike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-all ${
            rating === 'disliked'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <ThumbsDown size={16} />
          Não gostei
        </button>
        <button
          onClick={onLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-sm font-medium transition-all ${
            rating === 'liked'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
        >
          <ThumbsUp size={16} />
          Gostei
        </button>
        <a
          href={apartment.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-2 px-3 rounded text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
