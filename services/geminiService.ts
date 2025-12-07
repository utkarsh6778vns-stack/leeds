import { GoogleGenAI } from "@google/genai";
import { BusinessLead } from "../types";

// Helper to sanitize JSON string if the model returns markdown code blocks
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const searchBusinesses = async (
  query: string,
  userLocation?: { latitude: number; longitude: number },
  excludeNames: string[] = []
): Promise<BusinessLead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Context for exclusion to find NEW records. Increased limit to support multiple pages.
  const exclusionContext = excludeNames.length > 0 
    ? `IMPORTANT: You must find DIFFERENT businesses than these ones (already found): ${JSON.stringify(excludeNames.slice(0, 500))}. Do not return any of these names.` 
    : '';

  // Prompt engineering to get structured data even with the tool
  const prompt = `
    Find local businesses matching the query: "${query}".
    ${exclusionContext}
    
    1. Use the Google Maps tool to find the business name, address, rating, phone number, and website URL.
    2. Use the Google Search tool to:
       - Find the business's official website if Maps is missing it.
       - Look for a public email address (like info@, contact@) on their website.
       - **Find their Instagram profile URL** (e.g. instagram.com/brandname).
    
    Return a STRICT JSON array of objects. 
    Each object must strictly follow this schema:
    {
      "name": string,
      "address": string,
      "rating": number (or null),
      "website": string (or null),
      "phone": string (or null),
      "email": string (or null),
      "instagram": string (or null),
      "googleMapsUri": string (or null),
      "websiteQuality": "Good" | "Bad" | "Decent"
    }

    Rules:
    - If you find a website in the Maps result, put it in the "website" field.
    - If you find an email via Search, put it in the "email" field.
    - If you find an Instagram link, put it in the "instagram" field.
    - "websiteQuality" logic: 
        * "Good" if they have a professional custom domain (e.g., .com, .io).
        * "Decent" if they use a generic platform (e.g., facebook page as website, wixsite, business.site).
        * "Bad" if no website is found.
    - If a field is not found, use null.
    - AIM FOR EXACTLY 40 RESULTS PER BATCH. This is a "page 2" request style, so volume is important.
    - Do not include markdown formatting, just the raw JSON array.
  `;

  try {
    const model = 'gemini-2.5-flash';
    
    // Configure tool with optional location biasing
    const toolConfig = userLocation ? {
      retrievalConfig: {
        latLng: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }
      }
    } : undefined;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        // Enable BOTH Maps and Search to maximize data richness
        tools: [
            { googleMaps: {} }, 
            { googleSearch: {} }
        ],
        toolConfig: toolConfig,
        // High quality, exhaustive search
        systemInstruction: "You are a lead generation expert. Your goal is to find business contact details including emails and Instagram profiles. You must strictly follow the schema and quality grading rules. Always return as close to 40 results as possible.",
      },
    });

    const text = response.text || "[]";
    const cleanedText = cleanJsonString(text);
    
    let parsedData: any[] = [];
    try {
      parsedData = JSON.parse(cleanedText);
    } catch (e) {
      console.warn("Failed to parse JSON directly", e);
      return [];
    }

    // Map to our internal type
    if (Array.isArray(parsedData)) {
      return parsedData.map((item, index) => ({
        id: `lead-${Date.now()}-${index}`,
        name: item.name || "Unknown Business",
        address: item.address || "No address found",
        rating: item.rating,
        website: item.website,
        phone: item.phone,
        email: item.email,
        instagram: item.instagram,
        status: 'enriched', 
        googleMapsUri: item.googleMapsUri,
        websiteQuality: item.websiteQuality || (item.website ? 'Good' : 'Bad')
      }));
    }

    return [];

  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw error;
  }
};