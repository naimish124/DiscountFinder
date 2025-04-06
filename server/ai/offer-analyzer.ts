import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

import { Card, CombinedOffer } from '@shared/schema';

interface OfferAnalysisResult {
  personalizedRanking: number[];
  recommendations: string[];
  savingsTips: string[];
  bestOverallDeal: number;
}

/**
 * Analyzes offers to provide personalized recommendations based on user cards and preferences
 * @param offers - List of offers to analyze
 * @param userCards - User's credit/debit cards
 * @param destination - Optional destination for contextual recommendations
 * @returns Analysis results with personalized recommendations
 */
export async function analyzeOffers(
  offers: CombinedOffer[],
  userCards: Card[],
  destination?: string
): Promise<OfferAnalysisResult> {
  try {
    // Prepare the data for the AI
    const offersData = offers.map((offer, index) => ({
      id: index,
      platform: offer.platform.name,
      platformDiscount: `${offer.platformOffer.discountPercentage}%`,
      cardDiscount: offer.cardOffer ? `${offer.cardOffer.discountPercentage}%` : "None",
      totalDiscount: `${offer.totalDiscountPercentage}%`,
      minimumOrderAmount: offer.platformOffer.minimumOrderAmount || 0,
      description: offer.platformOffer.description,
      terms: offer.platformOffer.termsAndConditions || "Standard terms apply",
      applicableCard: offer.applicableCard ? `${offer.applicableCard.name} (${offer.applicableCard.bank})` : "None"
    }));

    const userCardsData = userCards.map(card => ({
      name: card.name,
      bank: card.bank,
      type: card.type
    }));

    const prompt = `
      As an AI travel discount expert, analyze these travel offers for ${destination || 'a user'} 
      considering the user's credit/debit cards.
      
      USER CARDS:
      ${JSON.stringify(userCardsData, null, 2)}
      
      AVAILABLE OFFERS:
      ${JSON.stringify(offersData, null, 2)}
      
      Please analyze the offers and provide:
      1. A list of offer IDs ranked from best to worst for this specific user
      2. 2-3 specific recommendations explaining the best offers and why they're good for this user
      3. 1-2 money-saving tips based on the available offers and cards
      4. The ID of the single best overall deal considering all factors
      
      Respond in JSON format with keys: "personalizedRanking" (array of offer IDs), 
      "recommendations" (array of strings), "savingsTips" (array of strings), and 
      "bestOverallDeal" (number - the offer ID).
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI travel discount expert that helps users find the best deals based on their credit cards and preferences." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      personalizedRanking: result.personalizedRanking || [],
      recommendations: result.recommendations || [],
      savingsTips: result.savingsTips || [],
      bestOverallDeal: result.bestOverallDeal
    };
  } catch (error) {
    console.error("Error analyzing offers:", error);
    // Return default ranking if AI analysis fails
    return {
      personalizedRanking: offers.map((_, i) => i),
      recommendations: ["Unable to generate personalized recommendations at this time."],
      savingsTips: ["Consider using your highest cashback card for maximum savings."],
      bestOverallDeal: offers.findIndex(o => 
        o.totalDiscountPercentage === Math.max(...offers.map(o => o.totalDiscountPercentage))
      )
    };
  }
}

/**
 * Generates a personal travel insight based on a user's booking history and cards
 * @param userCards - User's credit/debit cards
 * @param recentBookings - List of user's recent bookings (if available)
 * @param destination - Optional destination for contextual insights
 * @returns Personalized travel insight
 */
export async function generateTravelInsight(
  userCards: Card[],
  recentBookings: any[] = [],
  destination?: string
): Promise<string> {
  try {
    const userCardsData = userCards.map(card => ({
      name: card.name,
      bank: card.bank,
      type: card.type
    }));

    const prompt = `
      As an AI travel advisor, provide a brief personalized travel insight 
      based on the user's credit/debit cards and destination.
      
      USER CARDS:
      ${JSON.stringify(userCardsData, null, 2)}
      
      ${destination ? `DESTINATION: ${destination}` : ''}
      
      ${recentBookings.length > 0 ? `RECENT BOOKINGS: ${JSON.stringify(recentBookings, null, 2)}` : ''}
      
      Provide ONE SHORT paragraph (3-4 sentences maximum) with a personalized travel tip 
      related to maximizing card benefits for this specific user, considering their cards
      ${destination ? 'and destination' : ''}.
      
      Focus specifically on actionable advice for using their exact cards for travel benefits.
      Be specific and mention card names. Keep it concise and practical.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an AI travel advisor that provides personalized insights based on users' cards and booking patterns." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150
    });

    const content = response.choices[0].message.content;
    return content ? content.trim() : "Consider checking for special promotions with your credit cards for additional travel benefits.";
  } catch (error) {
    console.error("Error generating travel insight:", error);
    return "Consider checking for special promotions with your credit cards for additional travel benefits.";
  }
}