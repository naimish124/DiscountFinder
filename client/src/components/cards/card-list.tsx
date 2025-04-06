import { Card as CardType } from "@shared/schema";
import { getCardColor } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { deleteCard as deleteCardApi } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CreditCardIcon, Wallet, CircleDollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type CardListProps = {
  cards: CardType[];
  isLoading: boolean;
  onAddCard: () => void;
};

export default function CardList({ cards, isLoading, onAddCard }: CardListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get card type icon based on type
  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <CreditCardIcon className="h-4 w-4" />;
      case 'debit':
        return <Wallet className="h-4 w-4" />;
      case 'prepaid':
        return <CircleDollarSign className="h-4 w-4" />;
      case 'forex':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCardIcon className="h-4 w-4" />;
    }
  };

  // Format card type for display
  const formatCardType = (type: string): string => {
    switch (type) {
      case 'credit':
        return 'Credit';
      case 'debit':
        return 'Debit';
      case 'prepaid':
        return 'Prepaid';
      case 'forex':
        return 'Forex';
      default:
        return type;
    }
  };

  const handleDeleteCard = async (id: number) => {
    try {
      await deleteCardApi(id);
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      toast({
        title: "Card removed",
        description: "The card has been removed from your account",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove card",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Cards</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your cards to find the best discounts
          </p>
        </div>
        <Button 
          variant="outline"
          className="flex items-center gap-1 border-dashed hover:bg-secondary/10"
          onClick={onAddCard}
        >
          <span className="material-icons text-sm">add_circle</span>
          Add Card
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background rounded-lg p-5 shadow-sm border border-muted/20 animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="h-10 w-16 bg-muted/20 rounded-md"></div>
                <div className="h-5 w-20 bg-muted/20 rounded-full"></div>
              </div>
              <div className="h-5 w-3/4 bg-muted/20 rounded-md mb-2"></div>
              <div className="h-4 w-1/2 bg-muted/20 rounded-md mb-3"></div>
              <div className="flex justify-end">
                <div className="h-8 w-8 bg-muted/20 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-background border border-dashed rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
            <CreditCardIcon className="h-8 w-8 text-muted-foreground/70" />
          </div>
          <h3 className="text-lg font-medium mb-2">No cards added yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add your cards to discover the best discount offers tailored to your cards across booking platforms
          </p>
          <Button onClick={onAddCard} className="gap-2">
            <span className="material-icons text-sm">add_circle</span>
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className={`bg-background rounded-lg p-5 shadow-sm border border-muted/20 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`h-10 w-16 ${getCardColor(card.name, card.bank, card.type)} rounded-md flex items-center justify-center`}>
                  {getCardTypeIcon(card.type)}
                </div>
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 bg-muted/10 text-xs font-normal"
                >
                  {getCardTypeIcon(card.type)}
                  {formatCardType(card.type)}
                </Badge>
              </div>
              
              <div className="mb-3">
                <h3 className="font-medium text-md">{card.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{card.bank}</p>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-0 h-8 w-8"
                  onClick={() => handleDeleteCard(card.id)}
                >
                  <span className="material-icons text-sm">delete_outline</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
