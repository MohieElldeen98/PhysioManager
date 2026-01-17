import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  // API key must be used directly from process.env.API_KEY
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateTreatmentPlan = async (diagnosis: string, extraNotes: string) => {
  try {
    const ai = getClient();
    
    const prompt = `
      Act as a senior expert physiotherapist. 
      I have a patient with the following diagnosis: "${diagnosis}".
      Additional notes: "${extraNotes}".

      Please provide a structured response in JSON format with two specific fields:
      1. "protocol": A concise, step-by-step treatment guideline/protocol (e.g., Phase 1, Phase 2). Focus on home-based rehab.
      2. "tools": A list of recommended physical therapy tools (e.g., TENS, Ultrasound, Massage Gun, Resistance Bands) that would be useful for this specific case, and explain the specific medical importance of each tool for this diagnosis.

      The response language MUST be ARABIC.
    `;

    // Must define model inline within generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            protocol: {
              type: Type.STRING,
              description: "Treatment protocol steps"
            },
            tools: {
              type: Type.STRING,
              description: "List of tools and their importance"
            }
          },
          required: ["protocol", "tools"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating treatment plan:", error);
    throw error;
  }
};