import { GoogleGenAI } from "@google/genai";
import { BusinessLead } from "../types";

// Helper to sanitize JSON string if the model returns markdown code blocks
const cleanJsonString = (str: string): string => {
  // Remove markdown blocks
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
  // Attempt to find the first '[' and last ']' to isolate the array
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }
  
  return cleaned.trim();
};

const WAIT_TIME_MS = 1000;

// Internal function to handle the actual API call with variable batch size
const fetchFromGemini = async (
  query: string, 
  userLocation: { latitude: number; longitude: number } | undefined, 
  excludeNames: string[],
  batchSize: number
): Promise<BusinessLead[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Limit exclusion list to recent 50 items
  const shortExclusionList = excludeNames.slice(-50);
  
  const exclusionContext = shortExclusionList.length > 0 
    ? `IMPORTANT: Exclude these previously found businesses: ${JSON.stringify(shortExclusionList)}.` 
    : '';

  // Optimized prompt for SPEED and STABILITY
  const prompt = `
    TASK: Find ${batchSize} local businesses for: "${query}".
    ${exclusionContext}

    INSTRUCTIONS:
    1. Use Google Maps to find businesses.
    2. DEEP SEARCH for CONTACT INFO:
       - Email: Look for "info@", "contact@", "hello@" or "sales@" on their website or social snippets.
       - WhatsApp: Look for mobile numbers, "wa.me" links, or numbers labeled "WhatsApp".
       - Instagram: Find their official handle.
    3. Return a JSON Array with exactly ${batchSize} items if possible.

    JSON FORMAT:
    [
      {
        "name": "Business Name",
        "address": "Short Address",
        "rating": 4.5,
        "phone": "Phone",
        "website": "URL",
        "email": "email@domain.com" or null,
        "instagram": "instagram_url" or null,
        "whatsapp": "whatsapp_number" or null,
        "googleMapsUri": "maps_url",
        "websiteQuality": "Good" | "Decent" | "Bad"
      }
    ]
    
    CONSTRAINTS:
    - Output ONLY valid JSON.
    - If email/whatsapp is not found, use null.
    - Speed is important.
  `;

  const model = 'gemini-2.5-flash';
  
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
      tools: [
          { googleMaps: {} }, 
          { googleSearch: {} }
      ],
      toolConfig: toolConfig,
      systemInstruction: "You are a fast JSON lead extractor. You prioritize finding Emails and WhatsApp numbers.",
    },
  });

  const text = response.text || "[]";
  const cleanedText = cleanJsonString(text);
  
  let parsedData: any[] = [];
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (e) {
    console.warn("JSON Parse Failed:", e, cleanedText);
    return [];
  }

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
      whatsapp: item.whatsapp,
      status: 'enriched', 
      googleMapsUri: item.googleMapsUri,
      websiteQuality: item.websiteQuality || (item.website ? 'Good' : 'Bad')
    }));
  }

  return [];
};

export const searchBusinesses = async (
  query: string,
  userLocation?: { latitude: number; longitude: number },
  excludeNames: string[] = []
): Promise<BusinessLead[]> => {
  
  // Strategy: Start with 20.
  // If that fails, try 10.
  
  try {
    console.log("Fetching batch of 20...");
    const results = await fetchFromGemini(query, userLocation, excludeNames, 20);
    if (results.length > 0) return results;
    
    throw new Error("No results found in first attempt");

  } catch (error: any) {
    console.warn("Batch of 20 failed or returned empty. Retrying with 10...", error);
    
    // Wait a brief moment
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));
    
    try {
      return await fetchFromGemini(query, userLocation, excludeNames, 10);
    } catch (error2: any) {
      console.error("All fetch attempts failed", error2);
      throw error2; // Let the UI handle the error message
    }
  }
};