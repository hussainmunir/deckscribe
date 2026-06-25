import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google GenAI configuration client
function getGenAIClient(req: express.Request): GoogleGenAI {
  const apiKey = req.headers["x-gemini-key"] as string;
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please provide your own Gemini API Key in the application settings to use this service.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper function to retry Gemini API requests featuring exponential backoff
async function generateContentWithRetry(ai: any, params: any, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isTransient =
        error?.status === "UNAVAILABLE" ||
        errorMsg.includes("503") ||
        errorMsg.includes("UNAVAILABLE") ||
        errorMsg.includes("high demand") ||
        errorMsg.includes("429") ||
        errorMsg.includes("RESOURCE_EXHAUSTED");

      if (isTransient && attempt < maxRetries) {
        console.warn(`[Gemini API] Call failed with transient error. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms... Details:`, errorMsg);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
}

// 1. Generate Slides Endpoint
app.post("/api/generate-slides", async (req, res) => {
  try {
    const { text, title, slideCount = 8 } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No document body has been supplied for slide generation." });
    }

    const ai = getGenAIClient(req);

    // Dynamic clean slide json output schema
    const slidesSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Main overall title of the generated presentation deck." },
        subtitle: { type: Type.STRING, description: "A brief professional subtitle for the presentation." },
        slides: {
          type: Type.ARRAY,
          description: "An array of slide objects sequentially structured to tell a compelling story.",
          items: {
            type: Type.OBJECT,
            properties: {
              slideNumber: { type: Type.INTEGER },
              title: { type: Type.STRING, description: "Succinct, high-impact heading for this specific slide." },
              bullets: {
                type: Type.ARRAY,
                description: "3 to 5 core bullets summarizing the slide thesis. Make them concise and professional.",
                items: { type: Type.STRING }
              },
              presenterNotes: { type: Type.STRING, description: "Detailed, conversational coaching notes for the speaker to rehearse or present." }
            },
            required: ["slideNumber", "title", "bullets", "presenterNotes"]
          }
        }
      },
      required: ["title", "subtitle", "slides"]
    };

    const targetCount = Math.max(4, Math.min(15, Number(slideCount) || 8));

    const prompt = `You are an elite, hyper-focused Presentation Designer and Content Strategist. Your goal is to ingest the following document text, synthesize its core concepts, and output a compelling, sequentially logical presentation outline containing exactly ${targetCount} slides.

Document Title: ${title || "Untitled Presentation Draft"}
-------------------------
${text}
-------------------------

Please output a perfectly structured JSON deck following this format instruction:
- Generate exactly ${targetCount} slides outlining the strategic highlights, context, evidence or mechanisms, limitations, and future outlook matching the document.
- Ensure bullets are informative but concise, around 10-15 words each max.
- Write deep, professional speaking voice Presenter Notes.`;

    let response;
    try {
      console.log("Attempting slide generation with gemini-3.5-flash...");
      response = await generateContentWithRetry(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an elite Presentation Designer and Content Strategist. Analyze the source document and construct a sequentially progressive presentation slide deck outline. Return perfectly structured JSON matching the provided schema.",
          responseMimeType: "application/json",
          responseSchema: slidesSchema,
          temperature: 0.3
        }
      });
    } catch (primaryError: any) {
      const errorMsg = primaryError?.message || "";
      const isTransient =
        primaryError?.status === "UNAVAILABLE" ||
        errorMsg.includes("503") ||
        errorMsg.includes("UNAVAILABLE") ||
        errorMsg.includes("high demand") ||
        errorMsg.includes("429") ||
        errorMsg.includes("RESOURCE_EXHAUSTED");

      if (isTransient) {
        console.warn("[Gemini API] Primary model (gemini-3.5-flash) is experiencing heavy load/high demand. Initiating seamless fallback to gemini-3.1-flash-lite...");
        try {
          response = await generateContentWithRetry(ai, {
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              systemInstruction: "You are an elite Presentation Designer and Content Strategist. Analyze the source document and construct a sequentially progressive presentation slide deck outline. Return perfectly structured JSON matching the provided schema.",
              responseMimeType: "application/json",
              responseSchema: slidesSchema,
              temperature: 0.3
            }
          });
        } catch (fallbackError: any) {
          console.error("[Gemini API] Both primary and fallback models failed:", fallbackError);
          return res.status(503).json({
            error: "The presentation generation service is currently experiencing extremely high surge in demand. Please wait a moment and try clicking generate again!"
          });
        }
      } else {
        throw primaryError;
      }
    }

    const outputData = JSON.parse(response.text || "{}");
    return res.json(outputData);

  } catch (error: any) {
    console.error("Generate slides error:", error);
    return res.status(500).json({ error: error.message || "An error occurred while generating presentation slides." });
  }
});

// Serve assets of Vite or compiled client
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
