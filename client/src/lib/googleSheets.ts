import { Offer } from "@shared/schema";

// This file would normally handle direct Google Sheets API integration
// but for this implementation, we'll use the backend API instead

export const fetchOffersFromSheets = async (): Promise<Offer[]> => {
  try {
    const response = await fetch('/api/offers');
    const data = await response.json();
    return data.offers;
  } catch (error) {
    console.error('Error fetching offers from sheets:', error);
    return [];
  }
};

export const fetchOffersByServiceType = async (serviceType: string): Promise<Offer[]> => {
  try {
    const response = await fetch(`/api/offers/service/${serviceType}`);
    const data = await response.json();
    return data.offers;
  } catch (error) {
    console.error(`Error fetching ${serviceType} offers:`, error);
    return [];
  }
};
