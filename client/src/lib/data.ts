import { apiRequest } from "./queryClient";
import { getAllBankOfferLinks, getBankOfferLink, type BankOfferLink } from "@shared/bank-offers";

// Service categories
export const serviceCategories = [
  { id: "bus", name: "Bus Booking", icon: "directions_bus" },
  { id: "flight", name: "Flights", icon: "flight" },
  { id: "hotel", name: "Hotels", icon: "hotel" },
  { id: "movie", name: "Movies", icon: "movie" },
];

// Common banks for cards
export const bankOptions = [
  { id: "idfc", name: "IDFC First Bank" },
  { id: "hdfc", name: "HDFC Bank" },
  { id: "icici", name: "ICICI Bank" },
  { id: "axis", name: "Axis Bank" },
  { id: "sbi", name: "State Bank of India" },
  { id: "kotak", name: "Kotak Mahindra Bank" },
  { id: "citi", name: "Citibank" },
  { id: "yes", name: "Yes Bank" },
  { id: "hsbc", name: "HSBC Bank" },
  { id: "amex", name: "American Express" },
];

// Card types
export const cardTypes = [
  { id: "credit", name: "Credit Card" },
  { id: "debit", name: "Debit Card" },
  { id: "prepaid", name: "Prepaid Card" },
  { id: "forex", name: "Forex Card" },
];

// API functions
export async function addCard(card: { name: string; type: string; bank: string }) {
  return apiRequest<any>("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(card)
  });
}

export async function deleteCard(id: number) {
  return apiRequest<any>(`/api/cards/${id}`, {
    method: "DELETE"
  });
}

export async function getOffers(category: string, userCards: any[]) {
  return apiRequest<any>("/api/offers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      category, 
      userCards 
    })
  });
}

// Helper functions
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  
  return Math.floor(seconds) + " seconds ago";
}

// Generate a color based on card type with consistent variations per bank/name
export function getCardColor(name: string, bank: string, type?: string): string {
  // Base colors by card type
  const typeColors: Record<string, string[]> = {
    credit: [
      "bg-gradient-to-br from-blue-600 to-indigo-800 text-white",
      "bg-gradient-to-br from-purple-600 to-indigo-800 text-white",
      "bg-gradient-to-br from-indigo-500 to-blue-700 text-white"
    ],
    debit: [
      "bg-gradient-to-br from-green-500 to-teal-700 text-white",
      "bg-gradient-to-br from-teal-500 to-green-700 text-white",
      "bg-gradient-to-br from-emerald-500 to-green-700 text-white"
    ],
    prepaid: [
      "bg-gradient-to-br from-amber-500 to-orange-700 text-white",
      "bg-gradient-to-br from-orange-500 to-amber-700 text-white",
      "bg-gradient-to-br from-yellow-500 to-orange-700 text-white"
    ],
    forex: [
      "bg-gradient-to-br from-cyan-500 to-blue-700 text-white",
      "bg-gradient-to-br from-blue-400 to-indigo-600 text-white",
      "bg-gradient-to-br from-sky-500 to-blue-700 text-white"
    ]
  };
  
  // Default colors if type is not provided or not found
  const defaultColors = [
    "bg-gradient-to-br from-primary to-primary-foreground/90 text-white",
    "bg-gradient-to-br from-secondary to-secondary-foreground/90 text-white",
    "bg-gradient-to-br from-slate-600 to-slate-800 text-white",
    "bg-gradient-to-br from-zinc-600 to-zinc-800 text-white",
  ];
  
  // Get the appropriate color palette based on card type
  const colorPalette = type && typeColors[type] ? typeColors[type] : defaultColors;
  
  // Simple hash function to get consistent color variation based on bank and name
  const combinedString = name + bank;
  let hash = 0;
  for (let i = 0; i < combinedString.length; i++) {
    hash = combinedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

// Bank offer links functions
export function getAllBankLinks(): BankOfferLink[] {
  return getAllBankOfferLinks();
}

export function getBankLinkByName(bankName: string): BankOfferLink | undefined {
  return getBankOfferLink(bankName);
}

export function getBankLinksForUserCards(userCards: any[]): BankOfferLink[] {
  if (!userCards || userCards.length === 0) return [];
  
  // Get unique banks using an object as map
  const uniqueBanks: Record<string, boolean> = {};
  userCards.forEach(card => {
    if (card.bank) {
      uniqueBanks[card.bank] = true;
    }
  });
  const userBanks = Object.keys(uniqueBanks);
  
  return userBanks.map(bank => getBankOfferLink(bank))
    .filter((link): link is BankOfferLink => link !== undefined);
}
