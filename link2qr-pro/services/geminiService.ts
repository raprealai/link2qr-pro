
import { GeminiAnalysis } from "../types";

export const analyzeLink = async (url: string): Promise<GeminiAnalysis> => {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Analyze failed: ${response.status}`);
    }

    return (await response.json()) as GeminiAnalysis;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: "Untitled Link",
      description: "A quick QR code generated for this link.",
      category: "General",
    };
  }
};
