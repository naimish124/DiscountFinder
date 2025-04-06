import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Bus, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";

export default function ScraperControl() {
  const [isScraping, setIsScraping] = useState(false);
  const [lastScraped, setLastScraped] = useState<Date | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Query to get the sheet only mode status
  const { data: settingData, isLoading: isSettingLoading } = useQuery({
    queryKey: ['/api/settings/useSheetOnly'],
    queryFn: async () => {
      const response = await apiRequest<{ key: string, value: string | null }>('/api/settings/useSheetOnly');
      return response;
    }
  });

  const isSheetOnlyMode = settingData?.value === 'true';

  const triggerScraper = async (platform?: string) => {
    if (isScraping) return;
    
    setIsScraping(true);
    setActivePlatform(platform || null);
    
    try {
      await apiRequest('POST', '/api/scrape', { platform });
      
      setLastScraped(new Date());
      toast({
        title: "Scraper completed",
        description: platform 
          ? `${platform} offers have been updated successfully.`
          : "All platform offers have been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error triggering scraper:", error);
      toast({
        title: "Scraper error",
        description: "Failed to update offers. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
      setActivePlatform(null);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw size={18} />
          Offer Scraper
        </CardTitle>
        <CardDescription>
          Manually update offers by scraping platform websites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isScraping ? "secondary" : "outline"}>
            {isScraping ? `Running ${activePlatform ? `(${activePlatform})` : ""}` : "Idle"}
          </Badge>
        </div>
        {lastScraped && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Last updated:</span>
            <span className="text-sm">{lastScraped.toLocaleString()}</span>
          </div>
        )}
        
        {isSheetOnlyMode && (
          <div className="text-sm rounded-md border-l-4 border-amber-500 pl-4 py-2 bg-amber-50 text-amber-800 mb-4">
            <p className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span className="font-semibold">Scrapers are disabled</span>
            </p>
            <p className="mt-1">Sheet Only Mode is currently enabled. Scrapers will not run until this mode is disabled in Google Sheet Import settings.</p>
          </div>
        )}
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">All Platforms</TabsTrigger>
            <TabsTrigger value="individual" className="flex-1">Individual Platforms</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <Button 
              onClick={() => triggerScraper()} 
              disabled={isScraping || isSheetOnlyMode} 
              className="w-full"
            >
              {isScraping && !activePlatform ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating All Offers...
                </>
              ) : isSheetOnlyMode ? (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Scrapers Disabled
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update All Offers Now
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="individual" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => triggerScraper('AbhiBus')} 
                disabled={isScraping || isSheetOnlyMode} 
                variant="outline"
                className="justify-start"
              >
                {isScraping && activePlatform === 'AbhiBus' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating AbhiBus...
                  </>
                ) : (
                  <>
                    <Bus className="mr-2 h-4 w-4" />
                    Update AbhiBus
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => triggerScraper('ZingBus')} 
                disabled={isScraping || isSheetOnlyMode} 
                variant="outline"
                className="justify-start"
              >
                {isScraping && activePlatform === 'ZingBus' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating ZingBus...
                  </>
                ) : (
                  <>
                    <Bus className="mr-2 h-4 w-4" />
                    Update ZingBus
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}