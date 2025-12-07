import { GoogleGenAI } from "@google/genai";
import { BusinessLead } from "../types";

// Helper to sanitize JSON string if the model returns markdown code blocks
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

const WAIT_TIME_MS = 2000;

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

  // Limit exclusion list to recent 30 items to prevent context overload causing 500s
  const shortExclusionList = excludeNames.slice(-30);
  
  const exclusionContext = shortExclusionList.length > 0 
    ? `EXCLUDE these existing business names: ${JSON.stringify(shortExclusionList)}. You MUST find NEW businesses.` 
    : '';

  // Optimized prompt for email extraction
  const prompt = `
    ROLE: Expert Lead Researcher & Data Miner.
    TASK: Compile a list of ${batchSize} local businesses for the query: "${query}".
    
    ${exclusionContext}

    EXECUTION STEPS:
    1. **Discovery**: Use Google Maps to find ${batchSize} distinct businesses matching the query.
    2. **Enrichment (CRITICAL)**: For EACH business found:
       - **EMAIL**: You MUST perform a targeted Google Search for "Business Name email address" or "site:business_website.com email". Look for 'info@', 'contact@', 'hello@', 'support@'.
       - **INSTAGRAM**: Search for "Business Name Instagram" to find their official handle.
    3. **Formatting**: Return a strict JSON Array.

    REQUIRED JSON STRUCTURE:
    [
      {
        "name": "Business Name",
        "address": "Full Address",
        "rating": 4.5,
        "phone": "Phone Number",
        "website": "https://...",
        "email": "extracted_email@domain.com",  <-- PRIORITY. Return null ONLY if absolutely no email is found after searching.
        "instagram": "https://instagram.com/...",
        "googleMapsUri": "https://maps.google.com/...",
        "websiteQuality": "Good" | "Decent" | "Bad"
      }
    ]

    QUALITY RULES:
    - **EMAIL IS KING**: Make a genuine effort to find the email. Do not be lazy.
    - **Website Quality**: "Good" = Custom domain (e.g. .com), "Decent" = Social/Wix/Linktree, "Bad" = No website.
    - **Output**: JSON ONLY. No Markdown. No text before or after.
  `;

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
      tools: [
          { googleMaps: {} }, 
          { googleSearch: {} }
      ],
      toolConfig: toolConfig,
      systemInstruction: "You are a JSON-only lead extraction engine. Your goal is to maximize email fill rate.",
    },
  });

  const text = response.text || "[]";
  const cleanedText = cleanJsonString(text);
  
  let parsedData: any[] = [];
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (e) {
    const match = cleanedText.match(/\[.*\]/s);
    if (match) {
      try {
        parsedData = JSON.parse(match[0]);
      } catch (e2) {
          return [];
      }
    } else {
      return [];
    }
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
  
  // Strategy: Try getting 40. If 500 error, try 20. If 500 error, try 10.
  // This handles the "Internal Error" which often happens due to complexity/timeouts.
  
  try {
    console.log("Attempting to fetch 40 leads...");
    return await fetchFromGemini(query, userLocation, excludeNames, 40);
  } catch (error: any) {
    // Check if it's a 500 or generic internal error
    if (error.status === 500 || error.code === 500 || error.message?.includes("Internal error")) {
      console.warn("Batch of 40 failed (Internal Error). Retrying with 20...");
      
      // Wait a bit before retry
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));
      
      try {
        return await fetchFromGemini(query, userLocation, excludeNames, 20);
      } catch (error2: any) {
        if (error2.status === 500 || error2.code === 500 || error2.message?.includes("Internal error")) {
          console.warn("Batch of 20 failed. Retrying with 10...");
          await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));
          return await fetchFromGemini(query, userLocation, excludeNames, 10);
        }
        throw error2;
      }
    }
    throw error;
  }
};