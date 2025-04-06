import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, BarChart, PiggyBank, Star } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Card as CardType, CombinedOffer } from '@shared/schema';

type AIInsightsProps = {
  offers: CombinedOffer[];
  userCards: CardType[];
  destination?: string;
  onRankingChange?: (ranking: number[]) => void;
};

export default function AIInsights({ offers, userCards, destination, onRankingChange }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeOffers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Define response types
      type InsightResponse = { insight: string };
      type AnalysisResponse = {
        personalizedRanking: number[],
        recommendations: string[],
        savingsTips: string[],
        bestOverallDeal: number
      };
      
      // Get travel insights
      const insightResponse = await apiRequest<InsightResponse>('/api/travel-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCards, destination }),
      });
      
      // Get offer analysis
      const analysisResponse = await apiRequest<AnalysisResponse>('/api/analyze-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers, userCards, destination }),
      });
      
      setInsights(insightResponse.insight);
      setAnalysisResult(analysisResponse);
      
      // Call the ranking change handler if provided
      if (onRankingChange && analysisResponse?.personalizedRanking) {
        onRankingChange(analysisResponse.personalizedRanking);
      }
    } catch (err) {
      console.error('Error analyzing offers:', err);
      setError('Unable to generate AI insights at this time. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 overflow-hidden border-none shadow-md bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              AI Travel Assistant
            </CardTitle>
            <CardDescription>
              Get personalized recommendations powered by AI
            </CardDescription>
          </div>
          <Button 
            onClick={analyzeOffers}
            disabled={isLoading || !userCards.length}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Offers'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!analysisResult && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <Lightbulb className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            <p className="text-muted-foreground">
              Click "Analyze Offers" to get AI-powered recommendations for your travel.
            </p>
            {!userCards.length && (
              <Badge variant="outline" className="text-orange-500 border-orange-500">
                Add cards first to enable AI analysis
              </Badge>
            )}
          </div>
        )}
        
        {(analysisResult || isLoading) && (
          <Tabs defaultValue="recommendations">
            <TabsList className="mb-4">
              <TabsTrigger value="recommendations">
                <Star className="h-4 w-4 mr-1" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="savings">
                <PiggyBank className="h-4 w-4 mr-1" />
                Savings Tips
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Lightbulb className="h-4 w-4 mr-1" />
                Travel Insights
              </TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="h-24 flex items-center justify-center">
                <p className="text-muted-foreground animate-pulse">Analyzing offers with AI...</p>
              </div>
            ) : (
              <>
                <TabsContent value="recommendations" className="space-y-3">
                  <ul className="space-y-3">
                    {analysisResult?.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex">
                        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                          {i + 1}
                        </div>
                        <p>{rec}</p>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="savings" className="space-y-3">
                  <ul className="space-y-3">
                    {analysisResult?.savingsTips?.map((tip: string, i: number) => (
                      <li key={i} className="flex">
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                          <PiggyBank className="h-4 w-4" />
                        </div>
                        <p>{tip}</p>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="insights">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg">
                    <p className="italic text-slate-700 dark:text-slate-300">"{insights}"</p>
                  </div>
                  {destination && (
                    <div className="mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                        {destination}
                      </Badge>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900 py-2">
        Powered by AI • Personalized for your cards
      </CardFooter>
    </Card>
  );
}