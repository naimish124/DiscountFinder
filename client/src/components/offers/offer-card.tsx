import { useState } from "react";
import { CombinedOffer, Card } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { formatTimeAgo, getBankLinkByName, getCardColor } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Star, 
  Tag, 
  Clock, 
  CreditCard, 
  Bus, 
  Train, 
  Plane, 
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Copy,
  CircleDollarSign,
  DollarSign,
  Percent
} from "lucide-react";

type OfferCardProps = {
  offer: CombinedOffer;
  isBest?: boolean;
};

export default function OfferCard({ offer, isBest = false }: OfferCardProps) {
  const [expanded, setExpanded] = useState(isBest);
  const [copied, setCopied] = useState(false);
  
  const {
    platform,
    platformOffer,
    cardOffer,
    totalDiscountPercentage,
    applicableCard,
    estimatedSavings = 0,
  } = offer;

  // Get promo code and other offer details from the platformOffer
  const promoCode = platformOffer.code || null;
  const minAmount = platformOffer.minAmount || platformOffer.minimumOrderAmount || null;
  const maxDiscount = platformOffer.maxDiscount || null;

  // Determine icon based on platform category
  const getCategoryIcon = () => {
    switch (platform.category) {
      case 'bus':
        return <Bus className="h-5 w-5" />;
      case 'train':
        return <Train className="h-5 w-5" />;
      case 'flight':
        return <Plane className="h-5 w-5" />;
      default:
        return <Bus className="h-5 w-5" />;
    }
  };

  const copyPromoCode = () => {
    if (promoCode) {
      navigator.clipboard.writeText(promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Background gradient for best offer
  const bestGradient = "bg-gradient-to-tr from-blue-50 via-background to-indigo-50 dark:from-blue-950/30 dark:via-background dark:to-violet-950/30";

  return (
    <div 
      className={`rounded-lg overflow-hidden shadow-md ${
        isBest ? 'border-2 border-primary ' + bestGradient : 'bg-background border'
      } relative transition-all duration-200 hover:shadow-lg`}
    >
      {isBest && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white text-xs font-semibold py-1 px-3 rounded-bl-lg flex items-center">
            <Star className="h-3 w-3 mr-1 fill-white" />
            Best Offer
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg mr-3 flex items-center justify-center ${
              isBest ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-background border'
            }`}>
              {getCategoryIcon()}
            </div>
            <div>
              <h3 className={`font-medium text-lg ${isBest ? 'text-primary' : ''}`}>{platform.name}</h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Updated {formatTimeAgo(new Date(platformOffer.lastUpdated))}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-xl font-bold ${
              isBest 
                ? "bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent" 
                : "text-secondary"
            }`}>
              {totalDiscountPercentage}% OFF
            </div>
            <div className="text-xs text-muted-foreground">Total Discount</div>
            {estimatedSavings > 0 && (
              <div className="text-xs text-green-600 font-medium mt-1 flex items-center justify-center">
                <PiggyBank className="h-3 w-3 mr-1" />
                Save ₹{estimatedSavings}
              </div>
            )}
          </div>
        </div>
        
        {/* Main discount information */}
        <div className="border-t border-border pt-3 mt-2 text-sm space-y-2">
          {/* Sheet Data Summary - Always visible */}
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded mb-3">
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-medium">Platform:</span>
                <span>{platform.name}</span>
              </div>
              
              {promoCode && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-medium">Code:</span>
                  <code className="font-mono">{promoCode}</code>
                </div>
              )}
              
              {minAmount > 0 && (
                <div className="flex items-center gap-1">
                  <CircleDollarSign className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-medium">Min:</span>
                  <span>₹{minAmount}</span>
                </div>
              )}
              
              {maxDiscount > 0 && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-medium">Max:</span>
                  <span>₹{maxDiscount}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-violet-500" />
                <span className="font-medium">%:</span>
                <span>{platformOffer.discountPercentage}%</span>
              </div>
              
              {cardOffer && (
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5 text-red-500" />
                  <span className="font-medium">Card:</span>
                  <span>
                    {cardOffer.cardBank} {cardOffer.cardName ? ` ${cardOffer.cardName}` : ''} {cardOffer.cardType || ''}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="text-foreground/70 flex items-center">
              <Tag className="h-4 w-4 mr-1 text-foreground/70" />
              Platform Offer
            </div>
            <div className="font-medium text-right max-w-[65%]">
              {platformOffer.description}
            </div>
          </div>
          
          {/* Promo code section with copy button */}
          {promoCode && (
            <div className="flex items-center justify-between mt-1">
              <div className="text-foreground/70">Promo Code</div>
              <div className="flex items-center">
                <Badge 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 cursor-pointer transition-colors"
                  onClick={copyPromoCode}
                >
                  <code className="font-mono text-sm mr-1">{promoCode}</code>
                  <Copy className="h-3 w-3 opacity-70" />
                </Badge>
                {copied && (
                  <span className="text-xs text-green-600 ml-2">Copied!</span>
                )}
              </div>
            </div>
          )}
          
          {/* Card discount section */}
          <div className="flex items-start justify-between">
            <div className="text-foreground/70 flex items-center">
              <CreditCard className="h-4 w-4 mr-1 text-foreground/70" />
              Card Bonus
            </div>
            {cardOffer ? (
              <div className="text-right">
                <div className="flex items-center justify-end">
                  <span className="text-primary font-medium">{cardOffer.description}</span>
                  <span className="text-green-500 ml-1">+{cardOffer.discountPercentage}%</span>
                </div>
                {applicableCard && (
                  <div className="mt-1 flex items-center justify-end">
                    <div 
                      className="h-3 w-3 rounded-full mr-1"
                      style={{ backgroundColor: getCardColor(applicableCard.name, applicableCard.bank) }}
                    ></div>
                    <span className="text-xs text-muted-foreground">
                      With {applicableCard.name} Card
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">No additional card discount</div>
            )}
          </div>
        </div>
        
        {/* Expandable details section */}
        {expanded && (
          <div className="border-t border-border mt-3 pt-3 text-sm space-y-2 animate-in fade-in slide-in-from-top duration-300">
            {/* Detailed Google Sheet Data */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded">
              {/* Min Transaction Amount */}
              {minAmount > 0 && (
                <div className="flex items-center space-x-1">
                  <CircleDollarSign className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium">Min Tx:</span>
                  <span className="text-xs">₹{minAmount}</span>
                </div>
              )}
              
              {/* Max Discount */}
              {maxDiscount > 0 && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium">Max Discount:</span>
                  <span className="text-xs">₹{maxDiscount}</span>
                </div>
              )}
              
              {/* Discount Percentage */}
              <div className="flex items-center space-x-1">
                <Percent className="h-3 w-3 text-violet-600" />
                <span className="text-xs font-medium">Discount:</span>
                <span className="text-xs">{platformOffer.discountPercentage}%</span>
              </div>
              
              {/* Card Type & Bank Details - Show only if applicable */}
              {cardOffer && (
                <div className="flex items-center space-x-1">
                  <CreditCard className="h-3 w-3 text-amber-600" />
                  <span className="text-xs font-medium">Card Type:</span>
                  <span className="text-xs">{cardOffer.cardType || 'Any'}</span>
                </div>
              )}
              
              {cardOffer && (
                <div className="flex items-center space-x-1 col-span-2">
                  <Tag className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-medium">Card Details:</span>
                  <span className="text-xs">
                    {cardOffer.cardBank} {cardOffer.cardName ? ` - ${cardOffer.cardName}` : ''}
                  </span>
                </div>
              )}
            </div>
            
            {platformOffer.expiryDate && (
              <div className="flex justify-between">
                <div className="text-foreground/70">Valid Till</div>
                <div>{new Date(platformOffer.expiryDate).toLocaleDateString()}</div>
              </div>
            )}
            
            {platformOffer.termsAndConditions && (
              <div className="mt-2">
                <div className="text-foreground/70 mb-1">Terms & Conditions</div>
                <div className="text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-2 rounded">
                  {platformOffer.termsAndConditions}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Actions section */}
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground text-xs px-2"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Less details
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                More details
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            {cardOffer && applicableCard && getBankLinkByName(applicableCard.bank) && (
              <a 
                href={getBankLinkByName(applicableCard.bank)?.offerPageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary text-xs flex items-center hover:underline"
              >
                <span>Card Offers</span>
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            )}
            
            <Button 
              variant={isBest ? "default" : "outline"} 
              size="sm" 
              className={isBest ? 
                "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white" : 
                "text-secondary hover:text-secondary-foreground"
              }
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
