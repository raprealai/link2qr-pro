import http from "node:http";
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const readJson = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf8").trim();
  if (!body) return null;
  return JSON.parse(body);
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  if (req.method !== "POST" || req.url !== "/api/analyze") {
    return sendJson(res, 404, { error: "Not found" });
  }

  if (!apiKey) {
    return sendJson(res, 500, { error: "Missing GEMINI_API_KEY" });
  }

  try {
    const body = await readJson(req);
    const url = body?.url;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return sendJson(res, 400, { error: "Invalid URL" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this URL and provide a professional title, a short description, and a category for it. URL: ${url}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A catchy, short title for the link." },
            description: { type: Type.STRING, description: "A one-sentence description of what this link is about." },
            category: { type: Type.STRING, description: "A single word category like Social, Finance, Entertainment, etc." },
          },
          required: ["title", "description", "category"],
        },
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return sendJson(res, 200, parsed);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return sendJson(res, 500, {
      title: "Untitled Link",
      description: "A quick QR code generated for this link.",
      category: "General",
    });
  }
});

const port = Number(process.env.PORT || 8787);
server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
