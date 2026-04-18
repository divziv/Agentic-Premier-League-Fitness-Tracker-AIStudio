import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface OracleContext {
  velocity: number;
  hrv: number;
  lastWorkoutType: string;
  weather: string;
  timeAvailable: number;
  squadProgress: number;
  location: 'Home' | 'Gym';
  suggestedWorkoutTitle: string;
}

export const getGeminiOracleAdvice = async (context: OracleContext) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are the "Oracle," an empathetic and pilot-themed AI fitness coach. 
        Your goal is to maintain the user's "Consistency Velocity" using data-driven empathy.
        
        CURRENT STATE:
        - Pilot Name: ${context.lastWorkoutType} // Using this field temporarily for name context if needed
        - Current Velocity: ${(context.velocity * 100).toFixed(0)}%
        - HRV (Readiness): ${context.hrv}
        - Environmental Context: ${context.location} (${context.weather})
        - Available Uptime: ${context.timeAvailable} mins
        - Squad Progress: ${(context.squadProgress * 100).toFixed(0)}% to Goa.
        - System Recommends: ${context.suggestedWorkoutTitle}
        
        TASK:
        Provide a 2-sentence empathetic pilot-thematic recommendation. 
        Acknowledge their current physical state (HRV) and limited uptime if relevant.
        Focus on psychological momentum. 
        Use pilot terms like "Vector," "Protocol," "Uptime," "Pilot," "Synchronant."
        
        EXAMPLE STYLE: 
        "HRV levels indicate a suppressed system, Pilot. Engaging the Recovery Protocol will stabilize your long-term velocity while keeping the Squad in sync."
      `,
    });

    return response.text?.trim() || "Steady movement is the secret. Just start for 5 minutes.";
  } catch (error) {
    console.error("Gemini Oracle Error:", error);
    return "The path to consistency is built one rep at a time. Ready?";
  }
};

export const getHypeMessage = async (name: string, target: string, difficulty: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short (15 words max) high-energy hype message for ${name} who is about to do a ${difficulty} ${target} workout. Use bold, motivating language. Mention consistency or the squad if possible.`,
    });
    return response.text?.trim() || "Let's go! Time to crush it.";
  } catch (error) {
    return "Time to move. Let's make it count!";
  }
};

export const generateExerciseVisual = async (exerciseName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clear, professional fitness illustration of a person performing: ${exerciseName}. Minimalist, surgical style, focused on correct form. High contrast, dark mode aesthetic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image gen error:", error);
  }
  return `https://picsum.photos/seed/${exerciseName}/800/450`;
};
