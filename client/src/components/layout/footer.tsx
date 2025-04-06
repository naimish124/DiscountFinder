import { ServiceIcon } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() === "") {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: "Thanks for subscribing to our newsletter!",
    });
    setEmail("");
  };

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <ServiceIcon name="price-tag-3" className="text-xl" />
              <h3 className="text-lg font-semibold">DiscountFinder</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Find the best discounts and offers for your card across multiple platforms and services.
            </p>
          </div>
          
          <div>
            <h4 className="text-base font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-base font-medium mb-4">Subscribe</h4>
            <p className="text-sm text-gray-400 mb-3">Get the latest discount alerts directly to your inbox.</p>
            <form className="flex" onSubmit={handleSubscribe}>
              <Input 
                type="email" 
                placeholder="Your email" 
                className="px-3 py-2 text-sm bg-gray-700 text-white rounded-l focus:outline-none focus:ring-1 focus:ring-primary border-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button 
                type="submit" 
                className="bg-primary px-4 py-2 rounded-r text-sm hover:bg-primary/90 transition-colors h-9"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} DiscountFinder. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
