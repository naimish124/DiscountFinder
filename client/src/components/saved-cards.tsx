
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardFormValues } from "./card-form";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SavedCardsProps {
  currentCard: CardFormValues;
  onSelectCard: (card: CardFormValues) => void;
  onAddNewCard: () => void;
  onCardsUpdate?: (cards: CardFormValues[]) => void;
}

export function SavedCards({ currentCard, onSelectCard, onAddNewCard, onCardsUpdate }: SavedCardsProps) {
  const [savedCards, setSavedCards] = useState<CardFormValues[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  
  useEffect(() => {
    loadSavedCards();
    
    const handleStorageChange = () => {
      loadSavedCards();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentCard]);

  const loadSavedCards = () => {
    const storedCards = localStorage.getItem('savedCards');
    if (storedCards) {
      const cards = JSON.parse(storedCards);
      setSavedCards(cards);
      
      const currentIndex = cards.findIndex(
        (card: CardFormValues) => 
          card.cardName === currentCard.cardName && 
          card.cardType === currentCard.cardType && 
          card.bankName === currentCard.bankName
      );
      if (currentIndex !== -1) {
        setSelectedCardIndex(currentIndex);
      }
    }
  };

  const deleteCard = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSavedCards = savedCards.filter((_, i) => i !== index);
    setSavedCards(newSavedCards);
    localStorage.setItem('savedCards', JSON.stringify(newSavedCards));
    window.dispatchEvent(new Event('storage'));
    
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
    }
    
    if (onCardsUpdate) {
      onCardsUpdate(newSavedCards);
    }
  };

  const handleCardSelect = (card: CardFormValues, index: number) => {
    onSelectCard(card);
    setSelectedCardIndex(index);
  };

  const getCardTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Credit Card',
      'debit': 'Debit Card',
      'forex': 'Forex Card',
      'prepaid': 'Prepaid Card'
    };
    return types[type] || type;
  };

  const getBankNameDisplay = (bank: string) => {
    const banks: Record<string, string> = {
      'hdfc': 'HDFC Bank',
      'sbi': 'State Bank of India',
      'icici': 'ICICI Bank',
      'axis': 'Axis Bank',
      'kotak': 'Kotak Mahindra Bank',
      'yes': 'Yes Bank',
      'other': 'Other Bank'
    };
    return banks[bank] || bank;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Cards</h3>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={onAddNewCard}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> New Card
        </Button>
      </div>

      {savedCards.length > 0 ? (
        <div className="relative">
          <Carousel
            opts={{
              align: "start"
            }}
            className="w-full"
          >
            <CarouselContent>
              {savedCards.map((card, index) => (
                <CarouselItem key={index} className="basis-[280px]">
                  <Card 
                    className={`cursor-pointer border-2 transition-all ${
                      selectedCardIndex === index ? 'border-primary' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleCardSelect(card, index)}
                  >
                    <CardHeader className="p-3 pb-0">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base line-clamp-1">{card.cardName}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => deleteCard(index, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      <div className="flex gap-1 flex-wrap">
                        {card.cardType && (
                          <Badge variant="outline">{getCardTypeDisplay(card.cardType)}</Badge>
                        )}
                        {card.bankName && (
                          <Badge variant="outline">{getBankNameDisplay(card.bankName)}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-12 md:-left-4" />
            <CarouselNext className="-right-12 md:-right-4" />
          </Carousel>
        </div>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>You have no saved cards. Save a card to quickly select it later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
