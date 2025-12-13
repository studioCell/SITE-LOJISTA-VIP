import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI client safely
// Checks if process is defined to avoid crashes in browser environments (Vite/Vercel)
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProductDescription = async (productName: string, currentPrice: number): Promise<string> => {
  if (!ai) {
    console.warn("Gemini AI API Key missing. Skipping description generation.");
    return "Descrição automática indisponível (Chave de API não configurada).";
  }

  try {
    const prompt = `
      Pesquise no Google Search as características técnicas e benefícios do produto: "${productName}".
      Com base nessas informações reais encontradas, crie uma legenda de venda curta e persuasiva para este produto que custa R$ ${currentPrice}.
      Use emojis. Máximo de 2 frases. Destaque as principais funções encontradas na pesquisa.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // The model might return grounding metadata, but we just want the text synthesis
    return response.text.trim();
  } catch (error) {
    console.error("Error generating description:", error);
    return "Descrição indisponível no momento. Tente novamente mais tarde.";
  }
};