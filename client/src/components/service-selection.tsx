import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardFormValues } from "./card-form";
import { ServiceIcon } from "@/lib/icons";

export type ServiceType = "bus" | "flight" | "movie" | "bill" | "hotel" | "food" | "shopping" | "cab";

interface ServiceInfo {
  id: ServiceType;
  name: string;
  icon: string;
}

const services: ServiceInfo[] = [
  { id: "bus", name: "Bus Booking", icon: "bus" },
  { id: "flight", name: "Flight Booking", icon: "flight-takeoff" },
  { id: "movie", name: "Movie Booking", icon: "movie" },
  { id: "bill", name: "Bill Payment", icon: "bill" },
  { id: "hotel", name: "Hotel Booking", icon: "hotel" },
  { id: "food", name: "Food Ordering", icon: "restaurant" },
  { id: "shopping", name: "Shopping", icon: "shopping-bag" },
  { id: "cab", name: "Cab Booking", icon: "taxi" },
];

interface ServiceSelectionProps {
  cardDetails: CardFormValues;
  onSearch: (serviceType: ServiceType) => void;
  savedCards?: CardFormValues[];
}

export function ServiceSelection({ cardDetails, onSearch, savedCards = [] }: ServiceSelectionProps) {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);

  const handleServiceSelect = (service: ServiceType) => {
    setSelectedService(service);
  };

  // Track if search is in progress to prevent multiple rapid clicks
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (selectedService && !isSearching) {
      // Prevent repeated searches
      setIsSearching(true);
      
      // Clear any previous search memory
      localStorage.removeItem('lastCardSearch');
      
      // Small delay to prevent double-clicks
      setTimeout(() => {
        onSearch(selectedService);
        
        // Reset search state after a delay
        setTimeout(() => {
          setIsSearching(false);
        }, 2000);
      }, 100);
    }
  };

  // Check if we have a valid card to search with
  const hasValidCard = 
    (cardDetails.cardName.trim() !== "" && 
     cardDetails.cardType !== "" && 
     cardDetails.bankName !== "") || 
    savedCards.length > 0;
    
  // Enable search button if we have a card and a selected service
  const isFormComplete = hasValidCard && selectedService !== null;

  return (
    <section className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4">Select Service</h3>
      <p className="text-sm text-gray-600 mb-4">Choose the service you're planning to use to find relevant discounts.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service) => (
          <div 
            key={service.id}
            className={`service-card bg-white border ${
              selectedService === service.id 
                ? "border-primary bg-primary/5" 
                : "border-gray-200"
            } rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md`}
            onClick={() => handleServiceSelect(service.id)}
          >
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <ServiceIcon name={service.icon} className="text-xl text-primary" />
            </div>
            <span className="text-sm font-medium text-gray-700">{service.name}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          disabled={!isFormComplete || isSearching}
          onClick={handleSearch}
        >
          {isSearching ? (
            <>
              <span className="inline-block h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
              Searching...
            </>
          ) : (
            "Find Best Discounts"
          )}
        </Button>
      </div>
    </section>
  );
}
