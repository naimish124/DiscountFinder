import { Offer } from "@shared/schema";

// Calculate effective discount for an offer
export function calculateEffectiveDiscount(offer: Offer, transactionAmount: number = 5000): number {
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
}

// Find the best offer based on maximum discount
export function findBestOffer(offers: Offer[], transactionAmount: number = 5000): Offer | null {
  if (!offers || offers.length === 0) {
    return null;
  }
  
  console.log(`Finding best offer among ${offers.length} offers for transaction amount ${transactionAmount}`);
  
  // Calculate the default transaction amount if not specified (5000 or the highest min transaction amount)
  const defaultAmount = Math.max(
    transactionAmount,
    ...offers.map(o => o.minTransaction || 0)
  );
  
  // Ensure we have a reasonable transaction amount
  const effectiveTransactionAmount = defaultAmount > 0 ? defaultAmount : 5000;
  console.log(`Using transaction amount: ${effectiveTransactionAmount}`);
  
  // First score the offers based on discount amount
  const scoredOffers = offers
    .map(offer => {
      // Calculate effective discount using our transaction amount
      const effectiveDiscount = calculateEffectiveDiscount(offer, effectiveTransactionAmount);
      
      console.log(`Offer ${offer.id} (${offer.platform}): ` +
        `Discount: ${effectiveDiscount}, ` + 
        `Min Tx: ${offer.minTransaction}, ` +
        `Percentage: ${offer.discountPercentage}%, ` +
        `Max: ${offer.maxDiscountRs || 'unlimited'}, ` +
        `Type: ${offer.cardType || 'any'}, ` +
        `Bank: ${offer.bankName || 'any'}, ` +
        `Card: ${offer.cardName || 'any'}`);
      
      return {
        ...offer,
        effectiveDiscount
      };
    })
    .filter(offer => offer.effectiveDiscount > 0) // Remove offers with no effective discount
    .sort((a, b) => b.effectiveDiscount - a.effectiveDiscount); // Sort by highest discount first
  
  if (scoredOffers.length === 0) {
    console.log('No offers with effective discount found');
    return null;
  }
  
  console.log(`Best offer: ${scoredOffers[0].platform} (${scoredOffers[0].promoCode}) with discount ${scoredOffers[0].effectiveDiscount}`);
  return scoredOffers[0];
}

// Score offers based on multiple criteria (for more advanced AI-based selection)
export function scoreOffers(offers: Offer[], userPreferences: {
  cardName?: string;
  cardType?: string;
  bankName?: string;
  preferLowerMinSpend?: boolean;
}): Offer[] {
  return offers.map(offer => {
    let score = 0;
    
    // Higher discount amount gets higher score
    score += offer.maxDiscountRs || 0;
    
    // Higher percentage gets additional points
    score += offer.discountPercentage * 10;
    
    // Matching card type gets bonus
    if (userPreferences.cardType && offer.cardType === userPreferences.cardType) {
      score += 100;
    }
    
    // Matching bank name gets bonus
    if (userPreferences.bankName && offer.bankName === userPreferences.bankName) {
      score += 100;
    }
    
    // Card name partial match gets bonus
    if (userPreferences.cardName && offer.cardName && 
        offer.cardName.toLowerCase().includes(userPreferences.cardName.toLowerCase())) {
      score += 200;
    }
    
    // Lower minimum spend requirements get bonus if user prefers
    if (userPreferences.preferLowerMinSpend) {
      score += (10000 - offer.minTransaction) / 100;
    }
    
    return {
      ...offer,
      score
    };
  }).sort((a: any, b: any) => b.score - a.score);
}
