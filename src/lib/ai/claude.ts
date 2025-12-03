import Anthropic from "@anthropic-ai/sdk";

// Initialize the client (API key will be provided via environment variable)
const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
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

export async function generateWithClaude(options: GenerateOptions): Promise<string> {
  const { prompt, systemPrompt } = options;

  const client = getClient();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  // Extract text from response
  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  return cleanHtmlResponse(textContent.text);
}

export async function* streamWithClaude(
  options: GenerateOptions
): AsyncGenerator<string, void, unknown> {
  const { prompt, systemPrompt, referenceImage } = options;

  console.log("[Claude] Starting stream generation...");
  if (referenceImage) {
    console.log("[Claude] Reference image provided, using multimodal input");
  }

  const client = getClient();

  // Build content array - include image if provided
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

  const content: ContentBlock[] = [];

  // Add image first if provided
  if (referenceImage) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: referenceImage.mimeType,
        data: referenceImage.data,
      },
    });
  }

  // Add text prompt
  content.push({ type: "text", text: prompt });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
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
