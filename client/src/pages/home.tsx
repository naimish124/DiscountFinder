import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card as CardType, CombinedOffer } from "@shared/schema";
import { getOffers, getAllBankLinks, getBankLinksForUserCards } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Layout components
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

// Card components
import CardList from "@/components/cards/card-list";
import AddCardDialog from "@/components/cards/add-card-dialog";

// Offer components
import ServiceTabs from "@/components/offers/service-tabs";
import OfferSearch from "@/components/offers/offer-search";
import OfferCard from "@/components/offers/offer-card";
import BankOfferLinks from "@/components/offers/bank-offer-links";
import AIInsights from "@/components/offers/ai-insights";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("bus");
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [destination, setDestination] = useState("");
  const [customRanking, setCustomRanking] = useState<number[] | null>(null);
  const { toast } = useToast();

  // Fetch user cards
  const { 
    data: cards = [], 
    isLoading: isLoadingCards 
  } = useQuery<CardType[]>({ 
    queryKey: ['/api/cards'] 
  });

  // Fetch offers based on active category and user cards
  const { 
    data: offers = [],
    isLoading: isLoadingOffers,
    refetch: refetchOffers
  } = useQuery<CombinedOffer[]>({
    queryKey: ['/api/offers', activeCategory, cards.length],
    enabled: cards.length > 0, // Only fetch if user has cards
    queryFn: async () => {
      if (cards.length === 0) return [];
      return getOffers(activeCategory, cards);
    }
  });

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (cards.length > 0) {
      refetchOffers();
    }
  };

  // Handle search
  const handleSearch = (searchDestination: string) => {
    setDestination(searchDestination);
    toast({
      title: "Search initiated",
      description: `Searching for offers to ${searchDestination || "all destinations"}`,
    });
    // In a real app, we would pass the destination to the API call
    refetchOffers();
  };

  // Sort offers by total discount percentage (highest first) or custom ranking if available
  let sortedOffers = [...offers];
  
  if (customRanking && customRanking.length === offers.length) {
    // Use AI-recommended ranking if available
    const offersCopy = [...offers];
    sortedOffers = customRanking.map(i => offersCopy[i]);
  } else {
    // Default sort by discount percentage
    sortedOffers.sort((a, b) => b.totalDiscountPercentage - a.totalDiscountPercentage);
  }
  
  // Find the best offer index
  const bestOfferIndex = sortedOffers.length > 0 ? 
    // Use first offer in the sorted list as best if using custom ranking
    (customRanking ? 0 : 
    // Otherwise, find the offer with the highest discount percentage
    sortedOffers.findIndex(o => 
      o.totalDiscountPercentage === Math.max(...sortedOffers.map(o => o.totalDiscountPercentage))
    )) : -1;
    
  // Handler for when AI provides a new custom ranking
  const handleRankingChange = (ranking: number[]) => {
    setCustomRanking(ranking);
    toast({
      title: "Offers reordered",
      description: "Offers have been reordered based on AI recommendations",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-6">
        <ServiceTabs 
          activeCategory={activeCategory} 
          onChange={handleCategoryChange} 
        />
        
        <CardList 
          cards={cards} 
          isLoading={isLoadingCards} 
          onAddCard={() => setShowAddCardDialog(true)} 
        />
        
        <AddCardDialog 
          open={showAddCardDialog} 
          onOpenChange={setShowAddCardDialog} 
        />
        
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-foreground/80 mb-2">
              {activeCategory === "bus" ? "Bus Booking" : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Offers
            </h2>
            <OfferSearch onSearch={handleSearch} />
          </div>
          
          {isLoadingOffers ? (
            <div className="space-y-4">
              <div className="bg-background rounded-lg h-48 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background rounded-lg h-36 animate-pulse"></div>
                <div className="bg-background rounded-lg h-36 animate-pulse"></div>
              </div>
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-background border rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-4">Add your cards to see personalized offers</p>
              <Button onClick={() => setShowAddCardDialog(true)}>
                <span className="material-icons text-sm mr-2">add_circle</span>
                Add Your Cards
              </Button>
            </div>
          ) : sortedOffers.length === 0 ? (
            <div className="bg-background border rounded-lg p-6 text-center">
              <p className="text-muted-foreground">No offers available for this service category</p>
            </div>
          ) : (
            <>
              {/* AI Insights Component */}
              <AIInsights 
                offers={offers} 
                userCards={cards} 
                destination={destination} 
                onRankingChange={handleRankingChange} 
              />
              
              {/* Offers Display */}
              <div className="grid grid-cols-1 gap-4 mt-6 mb-8">
                {sortedOffers.map((offer, index) => (
                  <OfferCard 
                    key={`${offer.platform.id}-${index}`} 
                    offer={offer} 
                    isBest={index === bestOfferIndex}
                  />
                ))}
              </div>
            </>
          )}
        </section>
        
        {/* Bank Offer Links Section */}
        <section className="mt-12 border-t pt-8">
          <BankOfferLinks 
            bankLinks={getAllBankLinks()} 
            userBanks={cards.map(card => card.bank)}
          />
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
