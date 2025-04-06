export default function Footer() {
  return (
    <footer className="bg-background border-t border-border py-4">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} DiscountFinder. All offers are subject to change.</p>
      </div>
    </footer>
  );
}
