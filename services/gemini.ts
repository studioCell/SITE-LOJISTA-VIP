
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI client using the mandatory environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a persuasive product description based on Google Search grounding.
 */
export const generateProductDescription = async (productName: string, currentPrice: number): Promise<string> => {
  try {
    const prompt = `
      Pesquise no Google Search as características técnicas e benefícios do produto: "${productName}".
      Com base nessas informações reais encontradas, crie uma legenda de venda curta e persuasiva para este produto que custa R$ ${currentPrice}.
      Use emojis. Máximo de 2 frases. Destaque as principais funções encontradas na pesquisa.
    `;

    // Use gemini-3-flash-preview as recommended for text tasks with search grounding
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Access the text property directly (it is a getter, not a method)
    return response.text?.trim() || "Descrição automática indisponível.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Descrição indisponível no momento. Tente novamente mais tarde.";
  }
};
