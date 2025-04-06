import { useState } from "react";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-medium flex items-center">
          <span className="material-icons mr-2">savings</span>
          DiscountFinder
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center text-sm hover:underline">
            <span className="material-icons text-sm mr-1">admin_panel_settings</span>
            Admin
          </Link>
          <button className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
            <span className="material-icons">account_circle</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
