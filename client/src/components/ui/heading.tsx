import { cn } from "@/lib/utils";

interface HeadingProps {
  title: string;
  description?: string;
  className?: string;
  descriptionClassName?: string;
}

export function Heading({ 
  title, 
  description, 
  className,
  descriptionClassName 
}: HeadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h2 className="text-2xl md:text-3xl font-semibold">{title}</h2>
      {description && (
        <p className={cn("text-gray-600 max-w-2xl", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  );
}
