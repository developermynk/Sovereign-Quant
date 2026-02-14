
import { GoogleGenAI } from "@google/genai";
import { RiskTolerance, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async getRiskAdvice(
    query: string, 
    riskLevel: RiskTolerance, 
    history: ChatMessage[]
  ): Promise<string> {
    const model = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `System: You are a Sovereign Quantitative Risk Agent powered by OpenGradient. 
              Your user has a ${riskLevel} risk tolerance. 
              All data is processed within a TEE (Trusted Execution Environment) for privacy.
              Provide professional, concise, and data-driven crypto portfolio advice.
              
              History: ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
              User Query: ${query}`
            }
          ]
        }
      ],
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    try {
      const result = await model;
      return result.text || "I'm sorry, I couldn't process that advice request.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "The agent encountered an error during reasoning. Please try again.";
    }
  }
};
