import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apartments from '@/data/apartments.json';
import { ApartmentCard } from '@/components/ApartmentCard';
import { useApartmentRatings } from '@/hooks/useApartmentRatings';

export default function TinderPage() {
  const { getRating, toggleLike, toggleDislike } = useApartmentRatings();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrar apenas apartamentos não avaliados
  const notRatedApartments = useMemo(() => {
    return apartments.filter(apt => getRating(apt.link) === 'not-rated');
  }, [getRating]);

  const currentApartment = notRatedApartments[currentIndex];

  const handleNext = () => {
    if (currentIndex < notRatedApartments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleLike = () => {
    if (currentApartment) {
      toggleLike(currentApartment.id);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleDislike = () => {
    if (currentApartment) {
      toggleDislike(currentApartment.id);
      if (currentIndex === notRatedApartments.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  };

  if (notRatedApartments.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Parabéns! 🎉
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Você avaliou todos os apartamentos.
          </p>
          <p className="text-gray-500">
            Volte para a listagem para ver seus favoritos ou adicione novos apartamentos.
          </p>
        </div>
      </div>
    );
  }

  const evaluatedCount = apartments.length - notRatedApartments.length;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Avalie Apartamentos
        </h1>
        <p className="text-gray-600">
          {evaluatedCount} de {apartments.length} avaliados
        </p>
      </div>

      {/* Card Container */}
      <div className="w-full flex items-center justify-center mb-8">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-lg mr-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>

        {/* Card */}
        <div className="flex-1">
          {currentApartment && (
            <ApartmentCard
              apartment={currentApartment}
              rating={getRating(currentApartment.link)}
              onLike={handleLike}
              onDislike={handleDislike}
              variant="tinder"
            />
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentIndex === notRatedApartments.length - 1}
          className="p-3 rounded-lg ml-4 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          <ChevronRight size={24} className="text-gray-700" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md bg-gray-200 rounded-full h-2">
        <div
          className="bg-emerald-600 h-2 rounded-full transition-all"
          style={{
            width: `${(evaluatedCount / apartments.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}
