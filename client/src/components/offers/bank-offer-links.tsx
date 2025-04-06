import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankOfferLink } from "@shared/bank-offers";
import { ExternalLink } from "lucide-react";

type BankOfferLinksProps = {
  bankLinks: BankOfferLink[];
  userBanks: string[];
};

export default function BankOfferLinks({ bankLinks, userBanks }: BankOfferLinksProps) {
  // Filter links to show user's banks first, then others
  const userBankLinks = bankLinks.filter(link => 
    userBanks.some(bank => bank.toLowerCase() === link.bankName.toLowerCase())
  );
  
  const otherBankLinks = bankLinks.filter(link => 
    !userBanks.some(bank => bank.toLowerCase() === link.bankName.toLowerCase())
  );

  // Combine lists with user's banks first
  const sortedBankLinks = [...userBankLinks, ...otherBankLinks];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Bank Offer Links</h2>
      <p className="text-muted-foreground">
        Check the latest offers directly from your bank's website
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBankLinks.map((bankLink) => (
          <Card key={bankLink.bankName} className={userBanks.some(bank => 
            bank.toLowerCase() === bankLink.bankName.toLowerCase()) 
            ? "border-primary border-2" 
            : ""
          }>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {bankLink.bankName}
                {userBanks.some(bank => bank.toLowerCase() === bankLink.bankName.toLowerCase()) && (
                  <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">Your Bank</span>
                )}
              </CardTitle>
              <CardDescription>
                {bankLink.description}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <a 
                href={bankLink.offerPageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" className="w-full group">
                  <span>Visit Offers Page</span>
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}