import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import apartments from '@/data/apartments.json';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';

type FilterType = 'all' | 'liked' | 'disliked' | 'not-rated';

export default function ListingPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredApartments = useMemo(() => {
    if (filter === 'all') return apartments;
    return apartments.filter(apt => getRating(apt.id) === filter);
  }, [filter, getRating]);

  const stats = {
    liked: apartments.filter(apt => getRating(apt.id) === 'liked').length,
    disliked: apartments.filter(apt => getRating(apt.id) === 'disliked').length,
    notRated: apartments.filter(apt => getRating(apt.id) === 'not-rated').length,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Apartamentos
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-gray-900">{apartments.length}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-700 font-medium">Gostei</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.liked}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">Não gostei</p>
              <p className="text-2xl font-bold text-red-600">{stats.disliked}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">Não avaliado</p>
              <p className="text-2xl font-bold text-gray-900">{stats.notRated}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-medium transition-all ${
                filter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={16} />
              Todos
            </button>
            <button
              onClick={() => setFilter('liked')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filter === 'liked'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Gostei ({stats.liked})
            </button>
            <button
              onClick={() => setFilter('disliked')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filter === 'disliked'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              Não gostei ({stats.disliked})
            </button>
            <button
              onClick={() => setFilter('not-rated')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filter === 'not-rated'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Não avaliado ({stats.notRated})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredApartments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum apartamento encontrado com este filtro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredApartments.map(apartment => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                rating={getRating(apartment.id)}
                onLike={() => toggleLike(apartment.id)}
                onDislike={() => toggleDislike(apartment.id)}
                variant="list"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
