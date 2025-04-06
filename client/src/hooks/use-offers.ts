import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Offer, OfferSearch } from "@shared/schema";
import { useState, useEffect } from "react";
import { CardFormValues } from "@/components/card-form";

interface OffersResponse {
  offers: Offer[];
  bestOffer: Offer;
}

interface CardOffersMapping {
  card: CardFormValues;
  offers: Offer[];
  bestOffer: Offer | null;
}

export function useOffers(searchParams: OfferSearch | null) {
  const [allCards, setAllCards] = useState<CardFormValues[]>([]);
  const [allCardOffers, setAllCardOffers] = useState<CardOffersMapping[]>([]);
  const [combinedOffers, setCombinedOffers] = useState<Offer[]>([]);
  const [globalBestOffer, setGlobalBestOffer] = useState<Offer | null>(null);
  const [isSearchingAllCards, setIsSearchingAllCards] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Query for the current card's offers
  const { data, isLoading: isCurrentCardLoading, error } = useQuery<OffersResponse>({
    queryKey: ['api/offers/search', searchParams],
    enabled: !!searchParams,
    queryFn: async () => {
      if (!searchParams) return { offers: [], bestOffer: null };
      
      const response = await apiRequest('POST', '/api/offers/search', searchParams);
      return response.json();
    }
  });

  // First, load all saved cards from localStorage
  useEffect(() => {
    const storedCards = localStorage.getItem('savedCards');
    if (storedCards) {
      try {
        const cards = JSON.parse(storedCards);
        if (Array.isArray(cards)) {
          setAllCards(cards);
          // If we're reloading the cards and already had a search initiated,
          // we should clear the lastCardSearch to force a new search
          if (!isInitialLoad) {
            localStorage.removeItem('lastCardSearch');
          }
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error("Error parsing saved cards:", err);
      }
    }
  }, [isInitialLoad]);

  // This effect will run search for all saved cards once the current card search is complete
  useEffect(() => {
    // Only run this effect if:
    // 1. We have search parameters
    // 2. We have saved cards to search
    // 3. We're not already searching
    // 4. The data for the current card has been loaded
    // 5. We have a service type selected
    if (!searchParams || !allCards.length || isSearchingAllCards || !data || !searchParams.serviceType) return;
    
    // Create a unique key for this search to prevent duplicate searches
    const searchKey = `${searchParams.serviceType}_${JSON.stringify(allCards.map(c => c.cardName))}`;
    
    // Use localStorage to track if we've already performed this search
    const lastSearch = localStorage.getItem('lastCardSearch');
    if (lastSearch === searchKey) {
      return; // Skip if we've already performed this exact search
    }
    
    setIsSearchingAllCards(true);
    localStorage.setItem('lastCardSearch', searchKey);
    
    // Create a search promise for each saved card
    const searchPromises = allCards.map(async (card) => {
      // Skip the current card as we already have its results
      if (card.cardName === searchParams.cardName && 
          card.cardType === searchParams.cardType && 
          card.bankName === searchParams.bankName) {
        return null;
      }
      
      const cardSearchParams = {
        ...searchParams,
        cardName: card.cardName,
        cardType: card.cardType,
        bankName: card.bankName
      };
      
      try {
        const response = await apiRequest('POST', '/api/offers/search', cardSearchParams);
        const data = await response.json();
        
        return {
          card: card,
          offers: data.offers || [],
          bestOffer: data.bestOffer
        };
      } catch (err) {
        console.error(`Error searching offers for card ${card.cardName}:`, err);
        return null;
      }
    });
    
    // Execute all searches and update state
    Promise.all(searchPromises)
      .then(results => {
        // Filter out null results and those with no offers
        const validResults = results.filter(result => result && result.offers && result.offers.length > 0);
        setAllCardOffers(validResults);
        
        // Combine all unique offers
        const allOffers = new Map<number, Offer>();
        validResults.forEach(cardResult => {
          if (cardResult && cardResult.offers) {
            cardResult.offers.forEach(offer => {
              allOffers.set(offer.id, offer);
            });
          }
        });
        
        const uniqueOffers = Array.from(allOffers.values());
        
        // Find the best overall offer
        let bestOffer: Offer | null = null;
        let maxDiscount = 0;
        
        validResults.forEach(cardResult => {
          if (cardResult && cardResult.bestOffer && 
              cardResult.bestOffer.maxDiscountRs > maxDiscount) {
            maxDiscount = cardResult.bestOffer.maxDiscountRs;
            bestOffer = cardResult.bestOffer;
          }
        });
        
        setGlobalBestOffer(bestOffer);
        setCombinedOffers(uniqueOffers);
        setIsSearchingAllCards(false);
      })
      .catch(error => {
        console.error("Error searching offers for all cards:", error);
        setIsSearchingAllCards(false);
      });
  }, [searchParams?.serviceType, data]);

  // Combine current card offers with all saved card offers
  const currentOffers = data?.offers || [];
  const finalOffers = [...currentOffers];
  
  // Add offers from other cards that aren't already included
  combinedOffers.forEach(offer => {
    if (!finalOffers.some(currentOffer => currentOffer.id === offer.id)) {
      finalOffers.push(offer);
    }
  });

  // Decide which best offer to show (current card's best offer or global best)
  let finalBestOffer = data?.bestOffer || null;
  
  // If the global best offer is better than current card's best offer, use it
  if (globalBestOffer && (!finalBestOffer || 
      (globalBestOffer.maxDiscountRs > (finalBestOffer.maxDiscountRs || 0)))) {
    finalBestOffer = globalBestOffer;
  }

  // Add a function to force reload saved cards
  const refreshSavedCards = () => {
    setIsInitialLoad(true);
  };

  return {
    offers: finalOffers,
    bestOffer: finalBestOffer,
    cardOffers: allCardOffers,
    isLoading: isCurrentCardLoading || isSearchingAllCards,
    error,
    refreshSavedCards
  };
}
