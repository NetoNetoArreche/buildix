import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

// Simple HTML to text extraction
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  // Clean whitespace
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// Extract meta tags
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    meta.title = titleMatch[1].trim();
  }

  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) {
    meta.description = descMatch[1].trim();
  }

  // OG tags
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    meta.ogTitle = ogTitleMatch[1].trim();
  }

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) {
    meta.ogDescription = ogDescMatch[1].trim();
  }

  return meta;
}

// Extract colors from CSS
function extractColors(html: string): string[] {
  const colors: Set<string> = new Set();

  // Hex colors
  const hexMatches: string[] = html.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g) ?? [];
  hexMatches.forEach((color: string) => colors.add(color.toLowerCase()));

  // RGB/RGBA colors
  const rgbMatches: string[] = html.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g) ?? [];
  rgbMatches.forEach((color: string) => colors.add(color));

  return Array.from(colors).slice(0, 10); // Limit to 10 colors
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the webpage
    let html: string;
    try {
      const response = await fetch(validUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (error) {
      console.error("Failed to fetch URL:", error);
      return NextResponse.json(
        { error: "Failed to fetch the URL. Please check if the URL is accessible." },
        { status: 400 }
      );
    }

    // Extract basic information
    const metaTags = extractMetaTags(html);
    const colors = extractColors(html);
    const textContent = extractTextFromHtml(html).slice(0, 5000); // Limit content

    // Use AI to analyze the content
    const ai = getClient();

    const promptText = `Analyze this website content and extract the following information for creating an Instagram carousel. Return ONLY valid JSON.

URL: ${url}

META TAGS:
${JSON.stringify(metaTags, null, 2)}

EXTRACTED COLORS: ${colors.join(", ")}

PAGE CONTENT (excerpt):
${textContent}

Return a JSON object with this exact structure:
{
  "title": "Main title or headline of the page",
  "description": "Brief description of the product/service (max 100 words)",
  "benefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4", "benefit 5"],
  "features": ["feature 1", "feature 2", "feature 3"],
  "cta": "Main call-to-action text found",
  "tone": "professional/casual/playful/luxury/tech",
  "targetAudience": "Description of target audience",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "suggestedHook": "A viral hook for the first slide of the carousel"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: promptText }] }],
    });
    const responseText = result.text || "";

    // Extract JSON from response
    let analysisData;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // If parsing fails, return basic extracted data
      analysisData = {
        title: metaTags.title || metaTags.ogTitle || "Website Content",
        description: metaTags.description || metaTags.ogDescription || "",
        benefits: [],
        features: [],
        cta: "",
        tone: "professional",
        targetAudience: "",
        colors: colors.slice(0, 3),
        suggestedHook: "",
      };
    }

    // Merge with extracted data
    if (colors.length > 0 && (!analysisData.colors || analysisData.colors.length === 0)) {
      analysisData.colors = colors.slice(0, 3);
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("URL analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze URL" },
      { status: 500 }
    );
  }
}
