import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Settings } from "lucide-react";

export default function SettingsPanel() {
  const queryClient = useQueryClient();
  
  // Query to get the sheet only mode status
  const { data: settingData, isLoading: isSettingLoading } = useQuery({
    queryKey: ['/api/settings/useSheetOnly'],
    queryFn: async () => {
      const response = await apiRequest<{ key: string, value: string | null }>('/api/settings/useSheetOnly');
      return response;
    }
  });

  const isSheetOnlyMode = settingData?.value === 'true';

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={18} />
          Application Settings
        </CardTitle>
        <CardDescription>
          Current configuration settings for the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">Google Sheet Only Mode:</span>
          <Badge variant={isSheetOnlyMode ? "destructive" : "outline"}>
            {isSheetOnlyMode ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isSheetOnlyMode ? (
            <p>When enabled, the application will only use data imported from Google Sheets. Web scraping is disabled.</p>
          ) : (
            <p>When disabled, the application will use both scraped data and data imported from Google Sheets.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}