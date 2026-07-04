import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables in development
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to check token configuration
function hasToken(token: string | undefined): boolean {
  return typeof token === "string" && token.trim().length > 0 && !token.startsWith("YOUR_") && !token.startsWith("MY_");
}

// Lazy initialization of Gemini client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGemini() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API Routes
app.get("/api/status", (req, res) => {
  res.json({
    hasHfToken: hasToken(process.env.HF_TOKEN),
    hasGeminiToken: hasToken(process.env.GEMINI_API_KEY),
    defaultModel: "gemma-4-E2B"
  });
});

app.post("/api/chat", async (req, res) => {
  const { model, messages, useEmulator, temperature = 0.7, maxTokens = 1024 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid Request", message: "Messages array is required." });
    return;
  }

  const hfToken = process.env.HF_TOKEN;

  // Use Gemini Emulator if explicitly requested or if Hugging Face token is missing
  if (useEmulator || !hasToken(hfToken)) {
    try {
      const ai = getGemini();
      // Translate the chat history into a format Gemini expects
      // We also inject a strong system instruction to emulate Gemma-2-2b or gemma-4-E2B
      const systemInstruction = `You are a small open-source language model called "${model || "gemma-4-E2B"}" from Google, hosted on Hugging Face.
Your task is to emulate this model exactly. Be helpful, concise, and direct. Keep your responses aligned with a lightweight, local-sized LLM's capabilities and tone.`;

      const contents = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      // Call Gemini 2.5 Flash as the underlying engine
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: temperature,
          maxOutputTokens: maxTokens,
        }
      });

      const replyText = response.text || "";
      res.json({
        text: replyText,
        provider: "gemini-emulator",
        model: model || "gemma-4-E2B"
      });
      return;
    } catch (err: any) {
      console.error("Gemini emulator error:", err);
      res.status(500).json({
        error: "Emulator Error",
        message: err.message || "An error occurred while emulating Gemma using Gemini."
      });
      return;
    }
  }

  // Real Hugging Face Inference API call
  try {
    const hfModelId = model || "gemma-4-E2B";
    console.log(`Sending chat request to Hugging Face for model: ${hfModelId}`);

    // Call HuggingFace Chat Completion endpoint
    const hfResponse = await fetch(`https://api-inference.huggingface.co/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: hfModelId,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature: temperature,
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      let errorJson: any = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}

      console.error("Hugging Face API returned error:", hfResponse.status, errorText);

      res.status(hfResponse.status).json({
        error: "Hugging Face API Error",
        status: hfResponse.status,
        message: errorJson.error || errorJson.message || `Hugging Face returned status code ${hfResponse.status}`,
        details: errorText
      });
      return;
    }

    const data = await hfResponse.json();
    const replyText = data.choices?.[0]?.message?.content || "";

    res.json({
      text: replyText,
      provider: "huggingface",
      model: hfModelId
    });
  } catch (err: any) {
    console.error("Hugging Face connection error:", err);
    res.status(500).json({
      error: "Connection Error",
      message: err.message || "Failed to communicate with Hugging Face Inference API."
    });
  }
});

// Serve frontend assets
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
