import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Table, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Form schema with validation
const formSchema = z.object({
  sheetUrl: z.string().url("Please enter a valid URL").min(1, "Google Sheet URL is required"),
  useSheetOnly: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function GoogleSheetImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [lastImported, setLastImported] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to get the current sheet only mode status
  const { data: settingData, isLoading: isSettingLoading } = useQuery({
    queryKey: ['/api/settings/useSheetOnly'],
    queryFn: async () => {
      const response = await apiRequest<{ key: string, value: string | null }>('/api/settings/useSheetOnly');
      return response;
    }
  });
  
  const isSheetOnlyMode = settingData?.value === 'true';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sheetUrl: "",
      useSheetOnly: isSheetOnlyMode || false,
    },
  });
  
  // Update the form when setting data is loaded
  useEffect(() => {
    if (settingData) {
      form.setValue('useSheetOnly', settingData.value === 'true');
    }
  }, [settingData, form]);

  // Store confirmation dialog state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<FormValues | null>(null);
  
  const prepareImport = (data: FormValues) => {
    // If Sheet Only Mode is enabled, show confirmation dialog
    if (data.useSheetOnly) {
      setPendingImportData(data);
      setShowConfirmation(true);
    } else {
      // Otherwise proceed directly
      executeImport(data);
    }
  };
  
  const executeImport = async (data: FormValues) => {
    if (isImporting) return;
    
    setIsImporting(true);
    
    try {
      await apiRequest("/api/import-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sheetUrl: data.sheetUrl,
          useSheetOnly: data.useSheetOnly
        })
      });
      
      setLastImported(new Date());
      
      const message = data.useSheetOnly 
        ? "All existing offers have been cleared. Only data from the Google Sheet is now being used."
        : "Offer data has been successfully imported from Google Sheet.";
      
      // Invalidate queries to refresh data across the app
      queryClient.invalidateQueries({
        queryKey: ['/api/settings/useSheetOnly'],
      });
      
      toast({
        title: "Import completed",
        description: message,
        variant: "default",
      });
    } catch (error) {
      console.error("Error importing from Google Sheet:", error);
      toast({
        title: "Import error",
        description: "Failed to import offers. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setPendingImportData(null);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet size={18} />
          Google Sheet Import
        </CardTitle>
        <CardDescription>
          Import offer data directly from a Google Sheet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge variant={isImporting ? "secondary" : "outline"}>
            {isImporting ? "Importing..." : "Ready"}
          </Badge>
        </div>
        
        {lastImported && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Last imported:</span>
            <span className="text-sm">{lastImported.toLocaleString()}</span>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(prepareImport)} className="space-y-4">
            <FormField
              control={form.control}
              name="sheetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Sheet URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://docs.google.com/spreadsheets/d/..." 
                      {...field} 
                      disabled={isImporting}
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the full URL of the Google Sheet containing offer data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="useSheetOnly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isImporting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Sheet Only Mode
                    </FormLabel>
                    <FormDescription>
                      When enabled, this will clear all existing offers and use only data from this sheet
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isImporting} 
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing Data...
                </>
              ) : (
                <>
                  <Table className="mr-2 h-4 w-4" />
                  Import Offer Data
                </>
              )}
            </Button>
          </form>
        </Form>
        
        {/* Confirmation Dialog for Sheet Only Mode */}
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirm Sheet Only Mode
              </AlertDialogTitle>
              <AlertDialogDescription>
                <p className="mb-2">You're about to enable Sheet Only Mode, which will:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Delete all existing platform offers</li>
                  <li>Delete all existing card offers</li>
                  <li>Import only data from the provided Google Sheet</li>
                  <li>Disable automatic scraping of other offer sources</li>
                </ul>
                <p className="mt-2 font-medium">This action cannot be undone. Are you sure?</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingImportData(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (pendingImportData) {
                    executeImport(pendingImportData);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Yes, Clear All Existing Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}