// Bank offer information with external links to bank websites
export type BankOfferLink = {
  bankName: string;
  offerPageUrl: string;
  description: string;
};

// Database of bank offer links
export const bankOfferLinks: BankOfferLink[] = [
  {
    bankName: "HDFC Bank",
    offerPageUrl: "https://www.hdfcbank.com/personal/pay/cards/credit-cards/credit-card-offers",
    description: "Current HDFC Bank credit card offers on shopping, dining, travel and more"
  },
  {
    bankName: "ICICI Bank",
    offerPageUrl: "https://www.icicibank.com/offers",
    description: "Latest ICICI Bank card offers on flights, hotels, shopping and entertainment"
  },
  {
    bankName: "SBI Card",
    offerPageUrl: "https://www.sbicard.com/en/personal/offers.page",
    description: "Exclusive SBI Card offers across categories like travel, shopping and dining"
  },
  {
    bankName: "Axis Bank",
    offerPageUrl: "https://www.axisbank.com/grab-deals",
    description: "Special Axis Bank card deals on e-commerce, travel bookings and more"
  },
  {
    bankName: "IDFC First Bank",
    offerPageUrl: "https://www.idfcfirstbank.com/personal-banking/cards/credit-card/offers",
    description: "IDFC First Bank credit card offers on travel, food delivery and entertainment"
  },
  {
    bankName: "Citi Bank",
    offerPageUrl: "https://www.online.citibank.co.in/offers/generic.htm",
    description: "Latest Citi Bank card offers on online shopping, flights and hotels"
  },
  {
    bankName: "Kotak Mahindra Bank",
    offerPageUrl: "https://www.kotak.com/en/offers.html",
    description: "Exclusive Kotak card offers across travel, dining and e-commerce platforms"
  },
  {
    bankName: "Bank of Baroda",
    offerPageUrl: "https://www.bankofbaroda.in/offers",
    description: "Special Bank of Baroda card discounts on travel bookings and shopping"
  }
];

// Function to find offers by bank name
export function getBankOfferLink(bankName: string): BankOfferLink | undefined {
  return bankOfferLinks.find(link => 
    link.bankName.toLowerCase() === bankName.toLowerCase()
  );
}

// Function to get all bank offer links
export function getAllBankOfferLinks(): BankOfferLink[] {
  return bankOfferLinks;
}