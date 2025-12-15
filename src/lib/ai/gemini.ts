import { GoogleGenAI } from "@google/genai";

// Initialize the client (API key will be provided via environment variable)
const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export interface GenerateOptions {
  prompt: string;
  systemPrompt: string;
  stream?: boolean;
  referenceImage?: {
    data: string; // base64 encoded image data (without data URL prefix)
    mimeType: string; // e.g., "image/png", "image/jpeg", "image/webp"
  };
}

export async function generateWithGemini(options: GenerateOptions): Promise<string> {
  const { prompt, systemPrompt } = options;

  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser Request: ${prompt}` }],
      },
    ],
    config: {
      temperature: 1.0,
      maxOutputTokens: 65536,
    },
  });

  const text = response.text || "";

  // Clean up the response - remove any markdown code blocks if present
  return cleanHtmlResponse(text);
}

export async function* streamWithGemini(
  options: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, systemPrompt, referenceImage } = options;

  console.log("[Gemini] Starting stream generation with Gemini 3 Pro...");
  if (referenceImage) {
    console.log("[Gemini] Reference image provided, using multimodal input");
  }

  const ai = getClient();

  // Build parts array - include image if provided
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add image first if provided (Gemini prefers image before text)
  if (referenceImage) {
    parts.push({
      inlineData: {
        mimeType: referenceImage.mimeType,
        data: referenceImage.data,
      },
    });
  }

  // Add text prompt
  const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;
  parts.push({ text: fullPrompt });

  // Log prompt size for debugging
  console.log(`[Gemini] Full prompt size: ${fullPrompt.length} characters (${Math.round(fullPrompt.length/1024)}KB)`);

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        temperature: 1.0,
        maxOutputTokens: 65536,
      },
    });

    console.log("[Gemini] Got response stream, starting to iterate...");
    let chunkCount = 0;

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        chunkCount++;
        if (chunkCount % 10 === 0) {
          console.log(`[Gemini] Yielding chunk #${chunkCount}, length: ${text.length}`);
        }
        yield text;
      }
    }

    console.log(`[Gemini] Stream complete. Total chunks: ${chunkCount}`);
  } catch (error) {
    console.error("[Gemini] Error during stream:", error);
    // Re-throw the error so it can be caught by the route handler
    throw error;
  }
}

function cleanHtmlResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text;

  // Remove ```html ... ``` wrapper
  const htmlBlockMatch = cleaned.match(/```html\s*([\s\S]*?)\s*```/);
  if (htmlBlockMatch) {
    cleaned = htmlBlockMatch[1];
  }

  // Remove generic ``` wrapper
  const genericBlockMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/);
  if (genericBlockMatch && !htmlBlockMatch) {
    cleaned = genericBlockMatch[1];
  }

  // Trim whitespace
  cleaned = cleaned.trim();

  // Ensure it starts with DOCTYPE or html tag
  if (!cleaned.toLowerCase().startsWith("<!doctype") && !cleaned.toLowerCase().startsWith("<html")) {
    // Try to find the HTML content
    const doctypeIndex = cleaned.toLowerCase().indexOf("<!doctype");
    const htmlIndex = cleaned.toLowerCase().indexOf("<html");

    if (doctypeIndex !== -1) {
      cleaned = cleaned.substring(doctypeIndex);
    } else if (htmlIndex !== -1) {
      cleaned = cleaned.substring(htmlIndex);
    }
  }

  return cleaned;
}
