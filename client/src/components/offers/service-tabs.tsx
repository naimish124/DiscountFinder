import { useState } from "react";
import { serviceCategories } from "@/lib/data";

type ServiceTabsProps = {
  activeCategory: string;
  onChange: (category: string) => void;
};

export default function ServiceTabs({ activeCategory, onChange }: ServiceTabsProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex space-x-2 md:justify-center border-b border-border pb-2">
        {serviceCategories.map((category) => (
          <button 
            key={category.id}
            className={`px-4 py-2 ${
              activeCategory === category.id 
                ? "text-primary border-b-2 border-primary font-medium" 
                : "text-muted-foreground hover:text-foreground transition-colors"
            }`}
            onClick={() => onChange(category.id)}
          >
            <span className="material-icons mr-1 text-sm inline-block align-text-bottom">
              {category.icon}
            </span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
