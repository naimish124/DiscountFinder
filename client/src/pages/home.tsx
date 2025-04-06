import { useState, useRef, useEffect } from "react";
import { CardForm, CardFormValues } from "@/components/card-form";
import { SavedCards } from "@/components/saved-cards";
import { Heading } from "@/components/ui/heading";
import { ServiceSelection, ServiceType } from "@/components/service-selection";
import { ResultsSection } from "@/components/results-section";
import { useOffers } from "@/hooks/use-offers";
import { Button } from "@/components/ui/button";
import { PlusCircle, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [cardDetails, setCardDetails] = useState<CardFormValues>({
    cardName: "",
    cardType: "",
    bankName: "",
  });

  const [selectedService, setSelectedService] = useState<ServiceType | null>(
    null,
  );
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [savedCards, setSavedCards] = useState<CardFormValues[]>([]);

  // Ref to the card form component
  const cardFormRef = useRef<HTMLDivElement>(null);

  // Load saved cards from localStorage
  useEffect(() => {
    const storedCards = localStorage.getItem("savedCards");
    if (storedCards) {
      try {
        const cards = JSON.parse(storedCards);
        if (Array.isArray(cards)) {
          setSavedCards(cards);

          // If we have saved cards and no card is selected, select the first one
          if (cards.length > 0 && !cardDetails.cardName) {
            setCardDetails(cards[0]);
          }
        }
      } catch (err) {
        console.error("Error parsing saved cards:", err);
        localStorage.removeItem("savedCards");
      }
    }
  }, []);

  // Using custom hook to fetch offers when search is initiated
  const { offers, bestOffer, isLoading, cardOffers, refreshSavedCards } =
    useOffers(
      searchInitiated
        ? {
            cardName: cardDetails.cardName,
            cardType: cardDetails.cardType,
            bankName: cardDetails.bankName,
            serviceType: selectedService!,
          }
        : null,
    );

  const handleFormChange = (values: CardFormValues) => {
    setCardDetails(values);
  };

  const handleSearch = (serviceType: ServiceType) => {
    setSelectedService(serviceType);
    setSearchInitiated(true);

    // Scroll to results section
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById("resultsSection")?.offsetTop || 0,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleCardSelect = (card: CardFormValues) => {
    setCardDetails(card);
    // Hide the card form when a card is selected
    setShowCardForm(false);
  };

  // Handler for saved cards updates
  const handleCardsUpdate = (cards: CardFormValues[]) => {
    setSavedCards(cards);
    if (refreshSavedCards) {
      refreshSavedCards();
    }
  };

  const handleAddNewCard = () => {
    // Reset form with empty values
    setCardDetails({
      cardName: "",
      cardType: "",
      bankName: "",
    });

    // Show the card form
    setShowCardForm(true);

    // Focus on the card form
    setTimeout(() => {
      if (cardFormRef.current) {
        cardFormRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Update savedCards when localStorage changes
  const handleSaveCard = () => {
    const updatedCards = localStorage.getItem("savedCards");
    if (updatedCards) {
      setSavedCards(JSON.parse(updatedCards));
    }

    // Hide the card form after saving
    setShowCardForm(false);
  };

  // Check if there are any saved cards
  const hasSavedCards = savedCards.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Intro Section */}
      <section className="mb-8 text-center">
        <div className="flex justify-end mb-2 text-center"></div>
      </section>
      <section className="flex flex-col items-center justify-center text-center">
        <Heading
          title="Find the Best Discounts for Your Card"
          description="Enter your card name and select your service to discover which platform offers you the maximum discount."
        />
      </section>

      {/* Saved Cards Section */}
      <SavedCards
        currentCard={cardDetails}
        onSelectCard={handleCardSelect}
        onAddNewCard={handleAddNewCard}
        onCardsUpdate={handleCardsUpdate}
      />

      {/* Add New Card Button - Show when no cards or card form is hidden */}
      {!showCardForm && (
        <div className="mb-6 flex justify-center">
          <Button
            onClick={handleAddNewCard}
            variant="outline"
            className="flex items-center"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Card
          </Button>
        </div>
      )}

      {/* Card Form - Only show when adding a new card */}
      {showCardForm && (
        <div
          ref={cardFormRef}
          className="mb-6 border rounded-lg p-4 bg-gray-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Add New Card
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCardForm(false)}
              disabled={!hasSavedCards}
            >
              Cancel
            </Button>
          </div>

          <CardForm
            onFormChange={handleFormChange}
            initialValues={cardDetails}
          />

          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => {
                // Save card to localStorage
                const storedCards = localStorage.getItem("savedCards");
                let cards: CardFormValues[] = [];

                if (storedCards) {
                  cards = JSON.parse(storedCards);
                }

                // Only save if card has a name
                if (cardDetails.cardName.trim()) {
                  // Check if this card is already saved
                  const existingCardIndex = cards.findIndex(
                    (card) =>
                      card.cardName === cardDetails.cardName &&
                      card.cardType === cardDetails.cardType &&
                      card.bankName === cardDetails.bankName,
                  );

                  if (existingCardIndex >= 0) {
                    // Update existing card
                    cards[existingCardIndex] = { ...cardDetails };
                  } else {
                    // Add new card
                    cards.push({ ...cardDetails });
                  }

                  localStorage.setItem("savedCards", JSON.stringify(cards));
                  handleCardsUpdate(cards);
                  setShowCardForm(false);
                  window.location.reload();
                }
              }}
              disabled={!cardDetails.cardName.trim()}
            >
              Save Card
            </Button>
          </div>
        </div>
      )}

      {/* Service Selection */}
      <div className="mb-6">
        {!hasSavedCards && !showCardForm ? (
          <Alert className="mb-4">
            <AlertDescription>
              Please add a card first to find the best discounts.
            </AlertDescription>
          </Alert>
        ) : (
          <ServiceSelection
            cardDetails={cardDetails}
            onSearch={handleSearch}
            savedCards={savedCards}
          />
        )}
      </div>

      {/* Results Section */}
      <div id="resultsSection" className={!searchInitiated ? "hidden" : ""}>
        <ResultsSection
          isLoading={isLoading}
          offers={offers}
          bestOffer={bestOffer}
          cardOffers={cardOffers}
        />
      </div>
    </div>
  );
}
