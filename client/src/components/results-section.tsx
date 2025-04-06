import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ServiceIcon } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { Offer } from "@shared/schema";
import { CardFormValues } from "./card-form";

interface CardOffersMapping {
  card: CardFormValues;
  offers: Offer[];
  bestOffer: Offer | null;
}

interface ResultsSectionProps {
  isLoading: boolean;
  offers: Offer[] | null;
  bestOffer: Offer | null;
  cardOffers?: CardOffersMapping[];
}

export function ResultsSection({ isLoading, offers, bestOffer, cardOffers = [] }: ResultsSectionProps) {
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<"discount" | "percentage" | "minSpend">("discount");
  const [filterBy, setFilterBy] = useState<"all" | "bank_offer" | "card_offer" | "new_user">("all");
  const [showCardOfferDetails, setShowCardOfferDetails] = useState(false);

  // Handle copying promo code to clipboard
  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({
        title: "Success",
        description: "Promo code copied to clipboard!",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy promo code",
        variant: "destructive",
      });
    });
  };

  // Sort offers based on selected criteria
  const getSortedOffers = (offersList: Offer[]) => {
    if (!offersList) return [];
    
    const filteredOffers = filterBy === "all" 
      ? offersList 
      : offersList.filter(offer => offer.typeOfOffer === filterBy);
    
    switch (sortBy) {
      case "discount":
        return [...filteredOffers].sort((a, b) => (b.maxDiscountRs || 0) - (a.maxDiscountRs || 0));
      case "percentage":
        return [...filteredOffers].sort((a, b) => b.discountPercentage - a.discountPercentage);
      case "minSpend":
        return [...filteredOffers].sort((a, b) => a.minTransaction - b.minTransaction);
      default:
        return filteredOffers;
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col items-center">
        <Skeleton className="w-1/2 h-6 rounded mb-8" />
        <div className="grid grid-cols-1 gap-4 w-full">
          <Skeleton className="h-24 rounded w-full" />
          <Skeleton className="h-24 rounded w-full" />
          <Skeleton className="h-24 rounded w-full" />
          <Skeleton className="h-24 rounded w-full" />
        </div>
      </section>
    );
  }

  // If no offers or best offer, return empty
  if ((!offers || offers.length === 0) && (!cardOffers || cardOffers.length === 0)) {
    return (
      <section className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col items-center">
        <h3 className="text-xl font-semibold mb-4">No Offers Found</h3>
        <p className="text-gray-600">We couldn't find any offers matching your criteria. Try selecting a different service or card.</p>
      </section>
    );
  }

  const sortedOffers = getSortedOffers(offers || []);
  const hasOffersForOtherCards = cardOffers && cardOffers.length > 0;

  return (
    <section>
      {/* Best Offer Section */}
      {bestOffer && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
          <div className="flex items-center mb-3">
            <ServiceIcon name="trophy" className="text-yellow-300 text-2xl mr-2" />
            <h3 className="text-xl font-semibold">Best Discount Found</h3>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div className="mb-3 md:mb-0">
                <div className="text-sm opacity-80 mb-1">Platform</div>
                <div className="font-medium text-lg">{bestOffer.platform}</div>
              </div>
              <div className="mb-3 md:mb-0">
                <div className="text-sm opacity-80 mb-1">Promo Code</div>
                <div className="font-medium bg-white/20 rounded px-2 py-1 inline-block">{bestOffer.promoCode}</div>
              </div>
              <div className="mb-3 md:mb-0">
                <div className="text-sm opacity-80 mb-1">You Save</div>
                <div className="font-bold text-xl">₹{bestOffer.maxDiscountRs}</div>
              </div>
              <div>
                <a 
                  href={bestOffer.platformUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-white text-primary font-medium rounded hover:bg-gray-100 transition-colors"
                >
                  Book Now
                </a>
              </div>
            </div>
          </div>
          
          <div className="text-sm mb-2">
            <span className="font-medium">Offer Details:</span> 
            <span> {bestOffer.description}</span>
          </div>

          {bestOffer.cardName && (
            <div className="mt-2">
              <span className="text-xs bg-white/20 rounded px-2 py-1 inline-block">
                Card: {bestOffer.cardName}
              </span>
            </div>
          )}
          
          <div className="text-xs opacity-80 mt-2">
            <ServiceIcon name="information" className="inline mr-1" /> 
            <span>This offer gives you the maximum savings based on your card and service selection.</span>
          </div>
        </div>
      )}
      
      {/* Card-Specific Offers Section */}
      {hasOffersForOtherCards && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Offers For Your Other Cards</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCardOfferDetails(!showCardOfferDetails)}
            >
              {showCardOfferDetails ? "Hide Details" : "Show Details"}
            </Button>
          </div>
          
          <div className="space-y-4">
            {cardOffers.map((cardOffer, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-3 md:mb-0 md:mr-4">
                    <div className="flex items-center">
                      <ServiceIcon name="credit-card" className="text-primary mr-2" />
                      <h4 className="font-medium">{cardOffer.card.cardName}</h4>
                    </div>
                    <div className="flex gap-1 mt-1">
                      {cardOffer.card.cardType && (
                        <Badge variant="outline">{cardOffer.card.cardType}</Badge>
                      )}
                      {cardOffer.card.bankName && (
                        <Badge variant="outline">{cardOffer.card.bankName}</Badge>
                      )}
                    </div>
                  </div>
                  
                  {cardOffer.bestOffer && (
                    <div className="mb-3 md:mb-0 md:mr-4">
                      <div className="text-xs text-gray-500 mb-1">Best Offer</div>
                      <div className="font-medium">
                        <span>{cardOffer.bestOffer.platform}</span> - 
                        <span className="text-green-600 ml-1">₹{cardOffer.bestOffer.maxDiscountRs}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Promo: <span className="font-medium">{cardOffer.bestOffer.promoCode}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-3 md:mb-0 md:mr-4">
                    <div className="text-xs text-gray-500 mb-1">Total Offers</div>
                    <div className="font-medium">{cardOffer.offers.length} offers available</div>
                  </div>
                  
                  {cardOffer.bestOffer && (
                    <div>
                      <a 
                        href={cardOffer.bestOffer.platformUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors"
                      >
                        Book Now
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Detailed Offers per Card */}
                {showCardOfferDetails && cardOffer.offers.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-200">
                    <h5 className="font-medium mb-2">Available Offers</h5>
                    <div className="space-y-2">
                      {cardOffer.offers.slice(0, 3).map((offer, idx) => (
                        <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span className="font-medium">{offer.platform}</span>
                            <span className="text-green-600">₹{offer.maxDiscountRs} ({offer.discountPercentage}%)</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Code: <span className="font-medium">{offer.promoCode}</span>
                          </div>
                        </div>
                      ))}
                      {cardOffer.offers.length > 3 && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          + {cardOffer.offers.length - 3} more offers
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Offers Section */}
      {sortedOffers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">All Available Offers</h3>
            
            <div className="flex space-x-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "discount" | "percentage" | "minSpend")}
              >
                <SelectTrigger className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Highest Discount</SelectItem>
                  <SelectItem value="percentage">Highest Percentage</SelectItem>
                  <SelectItem value="minSpend">Lowest Min. Spend</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filterBy}
                onValueChange={(value) => setFilterBy(value as "all" | "bank_offer" | "card_offer" | "new_user")}
              >
                <SelectTrigger className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary h-9 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Offers</SelectItem>
                  <SelectItem value="bank_offer">Bank Offers</SelectItem>
                  <SelectItem value="card_offer">Card Offers</SelectItem>
                  <SelectItem value="new_user">New User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            {sortedOffers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No offers match the selected filter.</p>
            ) : (
              sortedOffers.map((offer) => (
                <div 
                  key={offer.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-3 md:mb-0 md:mr-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-2 rounded bg-primary/10 flex items-center justify-center">
                          <ServiceIcon 
                            name={offer.type === "bus" ? "bus" : 
                                  offer.type === "flight" ? "flight-takeoff" :
                                  offer.type === "movie" ? "movie" :
                                  offer.type === "bill" ? "bill" :
                                  offer.type === "hotel" ? "hotel" :
                                  offer.type === "food" ? "restaurant" :
                                  offer.type === "shopping" ? "shopping-bag" : "taxi"}
                            className="text-primary" 
                          />
                        </div>
                        <h4 className="font-medium">{offer.platform}</h4>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {offer.typeOfOffer === "bank_offer" ? "Bank Offer" : 
                         offer.typeOfOffer === "card_offer" ? "Card Offer" :
                         offer.typeOfOffer === "new_user" ? "New User Offer" : "Offer"}
                      </div>
                      {offer.cardName && (
                        <div className="text-xs text-gray-500 mt-1">
                          Card: <span className="font-medium">{offer.cardName}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-3 md:mb-0 md:mr-4">
                      <div className="text-xs text-gray-500 mb-1">Discount</div>
                      <div className="font-medium">
                        <span className="text-green-600">₹{offer.maxDiscountRs}</span>
                        <span className="text-xs text-gray-500">
                          ({offer.discountPercentage}%)
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min spend: <span>₹{offer.minTransaction}</span>
                      </div>
                    </div>
                    
                    <div className="mb-3 md:mb-0 md:mr-4 md:w-1/4">
                      <div className="text-xs text-gray-500 mb-1">Promo Code</div>
                      <div className="flex">
                        <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2 py-1 rounded">
                          {offer.promoCode}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2 text-gray-400 hover:text-gray-600 h-7 w-7 p-0" 
                          onClick={() => copyPromoCode(offer.promoCode)}
                        >
                          <ServiceIcon name="file-copy" className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <a 
                        href={offer.platformUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    {offer.description}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
