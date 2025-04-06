import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OfferSearchProps = {
  onSearch: (destination: string) => void;
};

export default function OfferSearch({ onSearch }: OfferSearchProps) {
  const [destination, setDestination] = useState("");
  
  const handleSearch = () => {
    onSearch(destination);
  };
  
  return (
    <div className="bg-background p-3 rounded-lg shadow mb-3">
      <div className="flex items-center mb-3">
        <span className="material-icons mr-2 text-primary">search</span>
        <Input 
          type="text" 
          placeholder="Enter destination..." 
          className="border-b border-input focus:border-primary"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button className="ml-2" onClick={handleSearch}>
          Search
        </Button>
      </div>
      <div className="text-sm text-muted-foreground italic">
        Showing best offers for all platforms
      </div>
    </div>
  );
}
