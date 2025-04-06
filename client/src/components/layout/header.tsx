import { useState } from "react";
import { Link } from "wouter";
import { ServiceIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: "How it works", href: "/how-it-works" },
    { name: "FAQs", href: "/faqs" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <ServiceIcon name="price-tag-3" className="text-primary text-2xl" />
          <h1 className="text-xl font-semibold text-gray-800">DiscountFinder</h1>
        </Link>
        
        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className="text-gray-600 hover:text-primary"
            >
              {link.name}
            </Link>
          ))}

          {user ? (
            <Link href="/admin" className="text-primary font-medium flex items-center">
              Admin Panel
            </Link>
          ) : (
            <Link href="/auth" className="text-gray-600 hover:text-primary flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden p-2 rounded-full hover:bg-gray-100"
            >
              <ServiceIcon name="menu" className="text-xl" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.name}>
                  <Link 
                    href={link.href} 
                    className="text-gray-600 hover:text-primary py-2 px-4 rounded-md hover:bg-gray-50"
                  >
                    {link.name}
                  </Link>
                </SheetClose>
              ))}
              
              <SheetClose asChild>
                {user ? (
                  <Link 
                    href="/admin" 
                    className="text-primary font-medium py-2 px-4 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    Admin Panel
                  </Link>
                ) : (
                  <Link 
                    href="/auth" 
                    className="text-gray-600 hover:text-primary py-2 px-4 rounded-md hover:bg-gray-50 flex items-center gap-1"
                  >
                    <Lock className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
