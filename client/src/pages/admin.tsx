import { Separator } from "@/components/ui/separator";
import ScraperControl from "@/components/admin/scraper-control";
import GoogleSheetImport from "@/components/admin/google-sheet-import";
import SettingsPanel from "@/components/admin/settings-panel";

export default function AdminPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage platform offers and update data sources
      </p>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <SettingsPanel />
      </div>
      
      <Separator className="my-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScraperControl />
        <GoogleSheetImport />
      </div>
    </div>
  );
}