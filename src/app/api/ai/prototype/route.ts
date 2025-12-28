import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashHtml } from "@/lib/hash";

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

interface ScreenInfo {
  index: number;
  id: string;
  name: string;
}

interface NavigationMapping {
  fromScreen: string;
  elementText: string;
  elementType: string;
  toScreen: string;
  cssSelector: string;
}

interface FixedElement {
  id: string;
  position: 'top' | 'bottom';
  height: number;
  cssSelector: string;
  appliesTo: string | string[]; // "*" for all screens or array of screen IDs
  type: 'header' | 'tabbar' | 'navigation' | 'other';
}

interface PrototypeAnalysis {
  screens: ScreenInfo[];
  navigation: NavigationMapping[];
  fixedElements: FixedElement[];
}

/**
 * POST /api/ai/prototype
 * Analyze mobile app HTML and extract navigation mappings
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { html, pageId, forceRefresh } = await req.json();

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Calculate hash for cache validation
    const htmlHash = hashHtml(html);

    // Check cache if pageId is provided and not forcing refresh
    if (pageId && !forceRefresh) {
      try {
        const page = await prisma.page.findUnique({
          where: { id: pageId },
          select: {
            prototypeAnalysis: true,
            prototypeHtmlHash: true,
            prototypeAnalyzedAt: true,
          },
        });

        // If cache is valid (same hash), return cached analysis
        if (page?.prototypeHtmlHash === htmlHash && page?.prototypeAnalysis) {
          console.log("[Prototype API] Cache hit! Returning cached analysis");
          return NextResponse.json({
            success: true,
            analysis: page.prototypeAnalysis,
            fromCache: true,
            analyzedAt: page.prototypeAnalyzedAt,
          });
        }
      } catch (cacheError) {
        console.error("[Prototype API] Cache check error:", cacheError);
        // Continue with Gemini analysis if cache check fails
      }
    }

    console.log("[Prototype API] Cache miss - calling Gemini API");

    // Extract screen info from HTML first (without AI)
    const screenMatches = html.match(/class="app-screen[^"]*"/g) || [];
    const screenCount = screenMatches.length;

    if (screenCount === 0) {
      return NextResponse.json(
        { error: "No app screens found in HTML" },
        { status: 400 }
      );
    }

    // Use Gemini to analyze navigation
    const ai = getClient();

    const promptText = `You are analyzing a mobile app prototype HTML to create navigation mappings.

CRITICAL: There are EXACTLY ${screenCount} screens (divs with class "app-screen"). You MUST create a screen entry for EACH one.

## STEP 1 - IDENTIFY ALL ${screenCount} SCREENS
Analyze each .app-screen div and identify its purpose. Common types:
- splash/welcome/onboarding (intro screens with "Get Started" buttons)
- login/signin (authentication screens)
- signup/register (registration screens)
- home/main/dashboard (main screen with products/content)
- categories/explore/browse (category listing)
- product-list/products/catalog (product grid/list)
- product-detail/detail/item (single product view)
- cart/bag/basket (shopping cart)
- checkout/payment (checkout flow)
- profile/account/me (user profile)
- settings/preferences (settings)
- search (search screen)
- favorites/wishlist (saved items)
- notifications (notifications)
- orders/history (order history)

## STEP 2 - MAP EVERY CLICKABLE ELEMENT
For EACH of the ${screenCount} screens, identify ALL clickable elements:

### TAB BAR (applies to ALL screens - use fromScreen: "*")
Find the bottom navigation bar and create ONE entry per tab item.
Count the tabs and map each to its target screen.

### MAIN BUTTONS ON EACH SCREEN
- Screen 1: Usually "Get Started", "Continue" → goes to screen 2
- Login screen: "Login" button → goes to home screen
- Any "Shop Now", "Browse", "Explore" → categories/products screen
- "Add to Cart" → cart screen
- "Checkout" → checkout screen
- "View All", "See More" → product list screen

### PRODUCT CARDS
- Any element with "card", "product", "item" in class → product-detail screen

### BACK NAVIGATION
- Back arrows, close buttons → toScreen: "back"

## STEP 3 - CSS SELECTORS
Use simple, reliable selectors:
- ".app-screen:nth-child(N) button" for buttons on specific screen
- "nav button:nth-child(N)" for tab bar items
- "[class*='card']" for product cards

## OUTPUT FORMAT (MUST be valid JSON):
{
  "screens": [
    // MUST have EXACTLY ${screenCount} entries, one for each screen
    { "index": 0, "id": "screen-type", "name": "Screen Name" }
    // ... repeat for all ${screenCount} screens
  ],
  "navigation": [
    // Create MANY entries - one for each clickable element
    { "fromScreen": "screen-id or *", "elementText": "Button Text", "elementType": "button|card|tab-item|back-button", "toScreen": "target-screen-id", "cssSelector": "css selector" }
  ],
  "fixedElements": [
    { "id": "tabbar", "position": "bottom", "height": 72, "cssSelector": "nav, [class*='bottom-nav'], [class*='tab-bar']", "appliesTo": "*", "type": "tabbar" }
  ]
}

## CRITICAL RULES
1. screens array MUST have EXACTLY ${screenCount} entries
2. Each screen.index MUST match its position (0 to ${screenCount - 1})
3. Create navigation for EVERY button, link, and card you find
4. Tab bar items use fromScreen: "*" (applies to all screens)
5. BE GENEROUS with navigation mappings - more is better
6. Screen IDs should be lowercase with hyphens (e.g., "product-detail")

## SCREEN ORDER HINTS
- First screens are usually splash/onboarding
- Middle screens are main content (home, categories, products)
- Last screens are usually profile, cart, settings

HTML to analyze (${screenCount} screens):
${html.substring(0, 60000)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
    });

    const responseText = result.text || "";

    // Extract JSON from response
    let analysisData: PrototypeAnalysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Prototype API] Failed to parse AI response:", parseError);

      // Fallback: Create COMPREHENSIVE navigation based on heuristics
      const defaultScreenNames = ["login", "home", "categories", "product-detail", "cart", "profile", "settings", "search", "checkout", "favorites"];

      // Build comprehensive fallback navigation
      const fallbackNavigation: NavigationMapping[] = [];

      // 1. Button navigation for each screen (first button goes to next screen)
      for (let i = 0; i < screenCount; i++) {
        const screenId = defaultScreenNames[i] || `screen-${i + 1}`;
        const nextScreenId = defaultScreenNames[Math.min(i + 1, screenCount - 1)] || `screen-${Math.min(i + 2, screenCount)}`;

        // Main button on each screen goes to next screen
        fallbackNavigation.push({
          fromScreen: screenId,
          elementText: "Button",
          elementType: "button",
          toScreen: nextScreenId,
          cssSelector: `.app-screen:nth-child(${i + 1}) button`,
        });

        // Cards on each screen go to detail or next screen
        fallbackNavigation.push({
          fromScreen: screenId,
          elementText: "Card",
          elementType: "card",
          toScreen: "product-detail",
          cssSelector: `.app-screen:nth-child(${i + 1}) [class*="card"], .app-screen:nth-child(${i + 1}) [class*="product"], .app-screen:nth-child(${i + 1}) [class*="item"]`,
        });
      }

      // 2. Tab bar navigation (create entry for each of the first 4-5 screens)
      const tabBarLabels = ["Home", "Categories", "Cart", "Profile", "Search"];
      const tabBarTargets = ["home", "categories", "cart", "profile", "search"];
      const numTabItems = Math.min(screenCount, 5);

      for (let i = 0; i < numTabItems; i++) {
        const targetScreen = defaultScreenNames[Math.min(i + 1, screenCount - 1)] || tabBarTargets[i];
        fallbackNavigation.push({
          fromScreen: "*",
          elementText: tabBarLabels[i] || `Tab ${i + 1}`,
          elementType: "tab-item",
          toScreen: targetScreen,
          cssSelector: `nav button:nth-child(${i + 1}), nav a:nth-child(${i + 1}), nav > *:nth-child(${i + 1}), [class*="bottom"] button:nth-child(${i + 1}), [class*="bottom"] a:nth-child(${i + 1}), [class*="tab"] button:nth-child(${i + 1})`,
        });
      }

      // 3. Back button navigation
      fallbackNavigation.push({
        fromScreen: "*",
        elementText: "Back",
        elementType: "back-button",
        toScreen: "back",
        cssSelector: "[class*='back'], [aria-label*='back'], [aria-label*='voltar'], button:first-child svg, a:first-child svg",
      });

      // 4. Common action buttons
      fallbackNavigation.push({
        fromScreen: "*",
        elementText: "Login",
        elementType: "button",
        toScreen: "home",
        cssSelector: "[class*='login'] button, button[class*='login'], [class*='signin'] button",
      });

      fallbackNavigation.push({
        fromScreen: "*",
        elementText: "Cart Icon",
        elementType: "icon",
        toScreen: "cart",
        cssSelector: "[class*='cart'], [aria-label*='cart'], [aria-label*='carrinho']",
      });

      analysisData = {
        screens: Array.from({ length: screenCount }, (_, i) => ({
          index: i,
          id: defaultScreenNames[i] || `screen-${i + 1}`,
          name: defaultScreenNames[i]
            ? defaultScreenNames[i].charAt(0).toUpperCase() + defaultScreenNames[i].slice(1).replace('-', ' ')
            : `Screen ${i + 1}`,
        })),
        navigation: fallbackNavigation,
        fixedElements: [
          {
            id: "auto-tabbar",
            position: "bottom" as const,
            height: 72,
            cssSelector: "nav, [class*='bottom'], [class*='tab-bar'], [class*='navigation']",
            appliesTo: "*",
            type: "tabbar" as const,
          },
        ],
      };

      console.log("[Prototype API] Using fallback navigation with", fallbackNavigation.length, "mappings");
    }

    // Validate and normalize the analysis
    if (!analysisData.screens || !Array.isArray(analysisData.screens)) {
      analysisData.screens = Array.from({ length: screenCount }, (_, i) => ({
        index: i,
        id: `screen-${i + 1}`,
        name: `Screen ${i + 1}`,
      }));
    }

    if (!analysisData.navigation || !Array.isArray(analysisData.navigation)) {
      analysisData.navigation = [];
    }

    // Validate fixedElements
    if (!analysisData.fixedElements || !Array.isArray(analysisData.fixedElements)) {
      analysisData.fixedElements = [];
    }

    // Ensure screen count matches
    if (analysisData.screens.length !== screenCount) {
      // Adjust screens array to match actual count
      const screens: ScreenInfo[] = [];
      for (let i = 0; i < screenCount; i++) {
        if (analysisData.screens[i]) {
          screens.push({
            ...analysisData.screens[i],
            index: i,
          });
        } else {
          screens.push({
            index: i,
            id: `screen-${i + 1}`,
            name: `Screen ${i + 1}`,
          });
        }
      }
      analysisData.screens = screens;
    }

    console.log(`[Prototype API] Analyzed ${screenCount} screens, ${analysisData.navigation.length} navigation mappings`);

    // Save to cache if pageId is provided
    if (pageId) {
      try {
        await prisma.page.update({
          where: { id: pageId },
          data: {
            prototypeAnalysis: analysisData as object,
            prototypeHtmlHash: htmlHash,
            prototypeAnalyzedAt: new Date(),
          },
        });
        console.log("[Prototype API] Analysis saved to cache");
      } catch (cacheError) {
        console.error("[Prototype API] Failed to save cache:", cacheError);
        // Continue anyway - cache is optional
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisData,
      fromCache: false,
    });
  } catch (error) {
    console.error("[Prototype API] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze navigation" },
      { status: 500 }
    );
  }
}
