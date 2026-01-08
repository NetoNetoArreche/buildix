import { NextRequest } from "next/server";
import { streamWithGemini, generateWithGemini } from "@/lib/ai/gemini";
import { streamWithClaude } from "@/lib/ai/claude";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { canUseFeature, incrementUsage, getUsageLimitMessage } from "@/lib/usage";

/**
 * Interface for image requirements determined by AI analysis
 */
interface ImageRequirement {
  id: string;           // hero, feature1, slide1, etc.
  prompt: string;       // Detailed description to generate the image
  aspectRatio: string;  // 16:9, 1:1, 9:16, etc.
  style?: string;       // photorealistic, illustration, minimal, etc.
}

/**
 * Analyze user prompt and determine what images are needed for the design
 * Uses Gemini Flash for fast analysis
 */
async function analyzeAndGetImageRequirements(
  userPrompt: string,
  contentType: string
): Promise<ImageRequirement[]> {
  const analysisPrompt = `Analyze this user request and determine what images are needed for the design.

User Request: "${userPrompt}"
Content Type: ${contentType}

Return a JSON array of images needed. Each image should have:
- id: unique identifier (hero, feature1, feature2, slide1, slide2, background, testimonial1, etc.)
- prompt: detailed description to generate the image (be specific about style, mood, colors, subject matter)
- aspectRatio: appropriate ratio (16:9 for hero/banner, 1:1 for cards/features, 9:16 for stories)
- style: photorealistic, illustration, minimal, gradient, 3d-render, etc.

Guidelines for different content types:
- Landing pages: hero (16:9), features (1:1), testimonials, CTA background, about section
- Carousels/Slides: one image per slide with consistent style
- Instagram: square (1:1) or vertical (9:16) images
- Dashboards: icons, avatars, data visualization backgrounds
- Email templates: header banner, product images

IMPORTANT:
- Maximum 8 images to avoid excessive generation time
- Be specific in prompts - include colors, mood, subject details
- Match the style/theme mentioned in the user request
- Return ONLY valid JSON array, no explanation or markdown

Example output:
[
  {"id":"hero","prompt":"Modern fitness gym interior with dramatic lighting, people exercising, professional photography style, blue and orange accent colors","aspectRatio":"16:9","style":"photorealistic"},
  {"id":"feature1","prompt":"Personal trainer helping client with weights, professional and friendly atmosphere","aspectRatio":"1:1","style":"photorealistic"}
]`;

  try {
    const response = await generateWithGemini({
      prompt: analysisPrompt,
      systemPrompt: "You are an expert at analyzing design requirements and determining what images are needed. Always respond with valid JSON only.",
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const images = JSON.parse(jsonMatch[0]) as ImageRequirement[];
      // Limit to 8 images max
      return images.slice(0, 8);
    }
    return [];
  } catch (error) {
    console.error("[Stream API] Error analyzing image requirements:", error);
    return [];
  }
}

/**
 * Generate a single image using the AI image generation API
 */
async function generateSingleImage(
  req: ImageRequirement,
  baseUrl: string,
  cookies: string
): Promise<{ id: string; url: string | null }> {
  try {
    const response = await fetch(`${baseUrl}/api/images/ai-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookies,
      },
      body: JSON.stringify({
        prompt: req.prompt,
        style: req.style || "photorealistic",
        aspectRatio: req.aspectRatio || "16:9",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { id: req.id, url: data.images?.[0]?.url || null };
    }

    const errorData = await response.json().catch(() => ({}));
    console.error(`[Stream API] Image generation failed for ${req.id}:`, errorData);
    return { id: req.id, url: null };
  } catch (error) {
    console.error(`[Stream API] Error generating image ${req.id}:`, error);
    return { id: req.id, url: null };
  }
}

/**
 * Clean HTML by removing duplicate/tripled Tailwind CDN generated styles
 * The Tailwind CDN dynamically injects <style> tags which accumulate over time
 * This can cause HTML to exceed 150k+ characters and fail AI API context limits
 */
function cleanHtmlForAI(html: string): string {
  if (!html) return html;

  // Match all style tags with their content
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const matches = [...html.matchAll(styleTagRegex)];

  let foundFirstTailwind = false;
  let cleanedHtml = html;

  // Process in reverse order to maintain correct positions when removing
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const content = match[1] || '';

    // Check if this is a Tailwind CDN generated style
    const isTailwindStyle = content.includes('tailwindcss') ||
                           content.includes('--tw-border-spacing') ||
                           content.includes('--tw-ring-offset-shadow') ||
                           content.includes('--tw-translate-x');

    if (isTailwindStyle) {
      if (foundFirstTailwind) {
        // Remove duplicate Tailwind style tags
        cleanedHtml = cleanedHtml.slice(0, match.index!) + cleanedHtml.slice(match.index! + match[0].length);
        console.log("[Stream API] Removed duplicate Tailwind style tag");
      } else {
        foundFirstTailwind = true;
      }
    }
  }

  const reduction = html.length - cleanedHtml.length;
  if (reduction > 0) {
    console.log(`[Stream API] Cleaned HTML: removed ${reduction} characters (${Math.round(reduction/1024)}KB)`);
  }

  return cleanedHtml;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { prompt } = body;
    const { model = "gemini", type = "generation", referenceImage, generateImages } = body;

    // Clean currentHtml to remove duplicate Tailwind styles before sending to AI
    if (body.currentHtml) {
      const originalLength = body.currentHtml.length;
      body.currentHtml = cleanHtmlForAI(body.currentHtml);
      console.log(`[Stream API] HTML length: ${originalLength} -> ${body.currentHtml.length}`);
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check authentication and usage limits
    const user = await getAuthenticatedUser();
    const ADMIN_EMAIL = "helioarreche@gmail.com";
    const isAdmin = user?.email === ADMIN_EMAIL;

    // Admin não tem limite de uso
    if (user && !isAdmin) {
      const { allowed, usage, plan } = await canUseFeature(user.id, "prompts");
      if (!allowed) {
        const message = getUsageLimitMessage("prompts", plan);
        return new Response(
          JSON.stringify({
            error: message,
            usageLimit: true,
            usage,
            plan,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Select system prompt based on type
    let systemPrompt: string;
    switch (type) {
      case "generation":
        systemPrompt = SYSTEM_PROMPTS.generation;
        break;
      case "revision":
        systemPrompt = SYSTEM_PROMPTS.revision.replace(
          "{currentHtml}",
          body.currentHtml || ""
        );
        break;
      case "revision-with-image":
        // Revision with image reference - uses existing HTML + image for inspiration
        systemPrompt = SYSTEM_PROMPTS.revisionWithImage.replace(
          "{currentHtml}",
          body.currentHtml || ""
        );
        console.log("[Stream API] Using revision-with-image prompt (preserving existing HTML)");
        break;
      case "editing":
        systemPrompt = SYSTEM_PROMPTS.editing.replace(
          "{elementHtml}",
          body.elementHtml || ""
        );
        break;
      case "editing-with-component":
        systemPrompt = SYSTEM_PROMPTS.editingWithComponent.replace(
          "{elementHtml}",
          body.elementHtml || ""
        );
        break;
      // Instagram content types - use revision prompt if currentHtml exists
      case "instagram-post":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for instagram-post (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.instagramPost;
        }
        break;
      case "instagram-carousel":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for instagram-carousel (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.instagramCarousel;
        }
        break;
      case "instagram-story":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for instagram-story (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.instagramStory;
        }
        break;
      // Mobile App screens - multi-screen like carousel
      case "mobile-app":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for mobile-app (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.mobileApp;
        }
        break;
      // Dashboard - admin panel layout
      case "dashboard":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for dashboard (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.dashboard;
        }
        break;
      // Email Template - email marketing design
      case "email-template":
        if (body.currentHtml) {
          systemPrompt = SYSTEM_PROMPTS.revision.replace("{currentHtml}", body.currentHtml);
          console.log("[Stream API] Using revision prompt for email-template (has existing HTML)");
        } else {
          systemPrompt = SYSTEM_PROMPTS.emailTemplate;
        }
        break;
      // Image reference type - for NEW generation from image (no existing HTML)
      case "image-reference":
        systemPrompt = SYSTEM_PROMPTS.imageReference;
        break;
      // Page generation with design context - maintains consistency across multi-page projects
      case "page-generation":
        systemPrompt = SYSTEM_PROMPTS.pageGeneration.replace(
          "{designContext}",
          body.designContext || "No existing design context available."
        );
        console.log("[Stream API] Using page-generation prompt with design context");
        break;
      default:
        systemPrompt = SYSTEM_PROMPTS.generation;
    }

    // NOTE: We no longer auto-override to imageReference when referenceImage is present
    // The client now explicitly sends the correct type:
    // - "image-reference" for new generation from image
    // - "revision-with-image" for editing existing page with image reference
    // This ensures we preserve the existing HTML when doing revisions

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();

    let chunkCount = 0;
    console.log("[Stream API] Starting stream for model:", model, "generateImages:", generateImages);

    // Get base URL and cookies for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cookies = request.headers.get("cookie") || "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If generateImages is enabled and user is authenticated, generate images first
          let generatedImages: { id: string; url: string }[] = [];

          if (generateImages && user) {
            console.log("[Stream API] AI Image Generation enabled - starting image analysis");

            // Send status update to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: "analyzing",
              message: "Analisando estrutura do design..."
            })}\n\n`));

            // STEP 1: Analyze prompt to determine required images
            const imageRequirements = await analyzeAndGetImageRequirements(prompt, type);
            console.log(`[Stream API] Image analysis complete. Need ${imageRequirements.length} images:`,
              imageRequirements.map(r => r.id).join(", "));

            if (imageRequirements.length > 0) {
              // Send status update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                status: "generating_images",
                message: `Gerando ${imageRequirements.length} imagens...`,
                total: imageRequirements.length
              })}\n\n`));

              // STEP 2: Generate images in parallel (with progress updates)
              const imagePromises = imageRequirements.map(async (req, index) => {
                const result = await generateSingleImage(req, baseUrl, cookies);

                // Send progress update for each completed image
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  status: "generating_images",
                  message: `Gerando imagem ${index + 1}/${imageRequirements.length}...`,
                  current: index + 1,
                  total: imageRequirements.length
                })}\n\n`));

                return result;
              });

              const results = await Promise.all(imagePromises);
              generatedImages = results.filter((r): r is { id: string; url: string } => r.url !== null);

              console.log(`[Stream API] Generated ${generatedImages.length}/${imageRequirements.length} images successfully`);

              // STEP 3: Inject image URLs into prompt
              if (generatedImages.length > 0) {
                const imageUrlsText = generatedImages
                  .map(img => `- ${img.id}: ${img.url}`)
                  .join("\n");

                prompt = `${prompt}

IMPORTANT: Use these AI-generated images in your design instead of placeholder images:
${imageUrlsText}

Instructions for using these images:
1. Use the appropriate image URL for each section based on its ID (hero, feature1, feature2, slide1, etc.)
2. DO NOT use picsum.photos, placeholder.com, unsplash, or any placeholder URLs
3. Use the exact URLs provided above for the img src attributes
4. Match the image to the section it was designed for (hero image for hero section, feature images for feature cards, etc.)`;

                console.log("[Stream API] Prompt enhanced with", generatedImages.length, "image URLs");
              }
            }

            // Send status update before HTML generation
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              status: "generating_html",
              message: generatedImages.length > 0
                ? `Criando HTML com ${generatedImages.length} imagens geradas...`
                : "Criando HTML..."
            })}\n\n`));
          }

          // Generate HTML using the (potentially enhanced) prompt
          const generator =
            model === "claude"
              ? streamWithClaude({ prompt, systemPrompt, referenceImage })
              : streamWithGemini({ prompt, systemPrompt, referenceImage });

          for await (const chunk of generator) {
            chunkCount++;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));

            // Log progress
            if (chunkCount % 10 === 0) {
              console.log(`[Stream API] Sent chunk #${chunkCount}, size: ${chunk.length}`);
            }
          }

          console.log(`[Stream API] Stream complete. Total chunks: ${chunkCount}`);

          // Increment usage on successful completion
          if (user) {
            await incrementUsage(user.id, "prompts");
            console.log(`[Stream API] Usage incremented for user ${user.id}`);
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("[Stream API] Error during streaming:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Streaming error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return new Response(
      JSON.stringify({ error: "Failed to start streaming", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
