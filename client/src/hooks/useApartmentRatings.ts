import { useState, useEffect } from 'react';

export type RatingStatus = 'liked' | 'disliked' | 'not-rated';

interface Ratings {
  [apartmentId: string]: RatingStatus;
}

export function useApartmentRatings() {
  const [ratings, setRatings] = useState<Ratings>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar ratings do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem('apartmentRatings');
    if (stored) {
      try {
        setRatings(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar ratings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Salvar ratings no localStorage sempre que mudar
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('apartmentRatings', JSON.stringify(ratings));
    }
  }, [ratings, isLoaded]);

  const getRating = (apartmentId: string): RatingStatus => {
    return ratings[apartmentId] || 'not-rated';
  };

  const setRating = (apartmentId: string, status: RatingStatus) => {
    setRatings(prev => ({
      ...prev,
      [apartmentId]: status
    }));
  };

  const toggleLike = (apartmentId: string) => {
    const current = getRating(apartmentId);
    const newStatus = current === 'liked' ? 'not-rated' : 'liked';
    setRating(apartmentId, newStatus);
  };

  const toggleDislike = (apartmentId: string) => {
    const current = getRating(apartmentId);
    const newStatus = current === 'disliked' ? 'not-rated' : 'disliked';
    setRating(apartmentId, newStatus);
  };

  return {
    ratings,
    getRating,
    setRating,
    toggleLike,
    toggleDislike,
    isLoaded
  };
}
