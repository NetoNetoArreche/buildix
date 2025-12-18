import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

export async function POST(req: NextRequest) {
  try {
    const { imageData, mimeType } = await req.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Validate mime type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const actualMimeType = mimeType || "image/jpeg";

    if (!validMimeTypes.includes(actualMimeType)) {
      return NextResponse.json(
        { error: "Invalid image format. Supported: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Use Gemini Vision model
    const ai = getClient();

    const promptText = `Analyze this carousel/social media design image and extract design information. Return ONLY valid JSON.

Analyze the following aspects:
1. Visual Style: Is it minimalist, bold, gradient, luxury, playful, corporate, etc?
2. Color Palette: Extract the main colors used (in hex format)
3. Typography: Describe the font style (serif, sans-serif, display, etc.) and weight
4. Layout: How is content organized? (centered, split, overlapping, etc.)
5. Number of slides visible (if it's a carousel preview)
6. Design elements: Icons, illustrations, photos, patterns?
7. Overall mood/aesthetic

Return a JSON object with this exact structure:
{
  "style": "The main visual style (clean/bold/gradient/luxury/playful/neon/pastel/corporate)",
  "suggestedStyle": "clean",
  "colors": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "typography": {
    "headingStyle": "bold sans-serif/elegant serif/modern display",
    "bodyStyle": "clean sans-serif/readable serif",
    "weight": "bold/medium/light"
  },
  "layout": "Description of layout structure",
  "slideCount": 5,
  "designElements": ["icons", "illustrations", "photos", "gradients", "patterns"],
  "mood": "Description of overall mood",
  "suggestions": [
    "Suggestion 1 for creating similar design",
    "Suggestion 2 for creating similar design"
  ],
  "colorMeaning": "Brief explanation of why these colors work together"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: imageData,
                mimeType: actualMimeType,
              },
            },
          ],
        },
      ],
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
      // If parsing fails, return default data
      analysisData = {
        style: "modern",
        suggestedStyle: "clean",
        colors: ["#ffffff", "#000000", "#8b5cf6"],
        typography: {
          headingStyle: "bold sans-serif",
          bodyStyle: "clean sans-serif",
          weight: "medium",
        },
        layout: "centered content layout",
        slideCount: 5,
        designElements: ["icons"],
        mood: "professional",
        suggestions: [
          "Use consistent spacing between elements",
          "Maintain visual hierarchy with font sizes",
        ],
        colorMeaning: "Default color palette",
      };
    }

    // Map style to our available style presets
    const styleMapping: Record<string, string> = {
      "minimalist": "clean",
      "minimal": "clean",
      "clean": "clean",
      "bold": "bold",
      "impactful": "bold",
      "gradient": "gradient",
      "modern": "gradient",
      "corporate": "corporate",
      "professional": "corporate",
      "business": "corporate",
      "playful": "playful",
      "fun": "playful",
      "colorful": "playful",
      "luxury": "luxury",
      "premium": "luxury",
      "elegant": "luxury",
      "neon": "neon",
      "vibrant": "neon",
      "futuristic": "neon",
      "pastel": "pastel",
      "soft": "pastel",
      "gentle": "pastel",
    };

    // Try to match suggestedStyle to our presets
    if (analysisData.style) {
      const styleLower = analysisData.style.toLowerCase();
      for (const [keyword, preset] of Object.entries(styleMapping)) {
        if (styleLower.includes(keyword)) {
          analysisData.suggestedStyle = preset;
          break;
        }
      }
    }

    return NextResponse.json(analysisData);
  } catch (error) {
    console.error("Design analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze design" },
      { status: 500 }
    );
  }
}
