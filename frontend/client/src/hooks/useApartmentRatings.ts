import { useFilterContext } from '../context/FilterContext';

export type RatingStatus = 'liked' | 'disliked' | 'not-rated';

export function useApartmentRatings() {
  const { apartments, setApartments } = useFilterContext();

  const getRating = (apartmentId: string): RatingStatus => {
    const apt = apartments.find((a: any) => a.id === apartmentId || a.link === apartmentId);
    if (!apt || !apt.preference) return 'not-rated';
    return apt.preference as RatingStatus;
  };

  const setRatingAPI = async (apartmentId: string, status: RatingStatus) => {
    // Optimistic UI Update
    const prefValue = status === 'not-rated' ? null : status;
    
    setApartments(prev => prev.map(apt => {
        if (apt.id === apartmentId || apt.link === apartmentId) {
            return { ...apt, preference: prefValue };
        }
        return apt;
    }));

    // Find exactly which ID to send to backend (in case UI passes link initially while transitioning)
    const targetApt = apartments.find((a: any) => a.id === apartmentId || a.link === apartmentId);
    if (!targetApt) return;
    const realId = targetApt.id;

    try {
        await fetch(`http://localhost:8000/api/listings/${encodeURIComponent(realId)}/preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ preference: prefValue })
        });
    } catch (e) {
        console.error("Failed to update preference:", e);
    }
  };

  const toggleLike = (apartmentId: string) => {
    const current = getRating(apartmentId);
    const newStatus = current === 'liked' ? 'not-rated' : 'liked';
    setRatingAPI(apartmentId, newStatus);
  };

  const toggleDislike = (apartmentId: string) => {
    const current = getRating(apartmentId);
    const newStatus = current === 'disliked' ? 'not-rated' : 'disliked';
    setRatingAPI(apartmentId, newStatus);
  };

  return {
    getRating,
    toggleLike,
    toggleDislike,
    isLoaded: true
  };
}
