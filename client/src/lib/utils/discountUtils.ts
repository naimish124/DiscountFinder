import { Offer } from "@shared/schema";

// Calculate the effective discount amount based on percentage and max discount
export const calculateEffectiveDiscount = (offer: Offer, transactionAmount: number = 5000): number => {
  // Calculate percentage-based discount
  const percentageDiscount = (offer.discountPercentage / 100) * transactionAmount;
  
  // Apply min/max constraints
  let effectiveDiscount = percentageDiscount;
  
  if (offer.minDiscountRs && effectiveDiscount < offer.minDiscountRs) {
    effectiveDiscount = offer.minDiscountRs;
  }
  
  if (offer.maxDiscountRs && effectiveDiscount > offer.maxDiscountRs) {
    effectiveDiscount = offer.maxDiscountRs;
  }
  
  // Ensure minimum transaction requirement is met
  if (transactionAmount < offer.minTransaction) {
    return 0;
  }
  
  return effectiveDiscount;
};

// Find the best offer based on maximum discount
export const findBestOffer = (offers: Offer[], transactionAmount: number = 5000): Offer | null => {
  if (!offers || offers.length === 0) {
    return null;
  }
  
  return offers.reduce((best, current) => {
    const bestDiscount = best ? calculateEffectiveDiscount(best, transactionAmount) : 0;
    const currentDiscount = calculateEffectiveDiscount(current, transactionAmount);
    
    return currentDiscount > bestDiscount ? current : best;
  }, offers[0]);
};

// Sort offers by different criteria
export const sortOffers = (
  offers: Offer[], 
  sortBy: 'discount' | 'percentage' | 'minTransaction' = 'discount'
): Offer[] => {
  const sortedOffers = [...offers];
  
  switch (sortBy) {
    case 'discount':
      return sortedOffers.sort((a, b) => (b.maxDiscountRs || 0) - (a.maxDiscountRs || 0));
    case 'percentage':
      return sortedOffers.sort((a, b) => b.discountPercentage - a.discountPercentage);
    case 'minTransaction':
      return sortedOffers.sort((a, b) => a.minTransaction - b.minTransaction);
    default:
      return sortedOffers;
  }
};

// Filter offers by type
export const filterOffersByType = (
  offers: Offer[],
  filterType: 'all' | 'bank_offer' | 'card_offer' | 'new_user'
): Offer[] => {
  if (filterType === 'all') {
    return offers;
  }
  
  return offers.filter(offer => offer.typeOfOffer === filterType);
};
