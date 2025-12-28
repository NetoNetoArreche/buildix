"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  appliesTo: string | string[];
  type: 'header' | 'tabbar' | 'navigation' | 'other';
}

interface PrototypeAnalysis {
  screens: ScreenInfo[];
  navigation: NavigationMapping[];
  fixedElements: FixedElement[];
}

interface PrototypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  pageId?: string;
}

// Default SVG icons for tab bar (Lucide-style)
const DEFAULT_TAB_ICONS: Record<string, string> = {
  home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  categories: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  cart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>',
  profile: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
  settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/></svg>',
  login: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>',
  offers: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  feed: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a9 9 0 019 9"/><path d="M4 4a16 16 0 0116 16"/><circle cx="5" cy="19" r="1"/></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  product: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
};

// Function to get appropriate icon based on screen name
const getIconForScreen = (screenName: string): string => {
  const name = screenName.toLowerCase();

  // Check for common patterns
  if (name.includes('home') || name.includes('início') || name.includes('inicio')) return DEFAULT_TAB_ICONS.home;
  if (name.includes('categor') || name.includes('grid')) return DEFAULT_TAB_ICONS.categories;
  if (name.includes('cart') || name.includes('carrinho') || name.includes('bag') || name.includes('sacola')) return DEFAULT_TAB_ICONS.cart;
  if (name.includes('profile') || name.includes('perfil') || name.includes('user') || name.includes('account') || name.includes('conta')) return DEFAULT_TAB_ICONS.profile;
  if (name.includes('search') || name.includes('busca') || name.includes('pesquis')) return DEFAULT_TAB_ICONS.search;
  if (name.includes('setting') || name.includes('config')) return DEFAULT_TAB_ICONS.settings;
  if (name.includes('login') || name.includes('onboard') || name.includes('welcome') || name.includes('auth')) return DEFAULT_TAB_ICONS.login;
  if (name.includes('offer') || name.includes('promo') || name.includes('deal') || name.includes('desconto') || name.includes('sale')) return DEFAULT_TAB_ICONS.offers;
  if (name.includes('feed') || name.includes('news') || name.includes('notícia')) return DEFAULT_TAB_ICONS.feed;
  if (name.includes('list') || name.includes('product') || name.includes('produto')) return DEFAULT_TAB_ICONS.product;
  if (name.includes('favorite') || name.includes('favorito') || name.includes('wishlist') || name.includes('heart')) return DEFAULT_TAB_ICONS.heart;
  if (name.includes('rate') || name.includes('review') || name.includes('avalia')) return DEFAULT_TAB_ICONS.star;

  // Default fallback
  return DEFAULT_TAB_ICONS.home;
};

export function PrototypeModal({ open, onOpenChange, html, pageId }: PrototypeModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PrototypeAnalysis | null>(null);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [navigationHistory, setNavigationHistory] = useState<number[]>([0]);
  const [error, setError] = useState<string | null>(null);
  const [processedHtml, setProcessedHtml] = useState<string>("");
  const [fromCache, setFromCache] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && html) {
      setError(null);
      setCurrentScreenIndex(0);
      setNavigationHistory([0]);
      setAnalysis(null);
      setProcessedHtml("");
      analyzeNavigation();
    }
  }, [open, html]);

  // Analyze navigation using AI
  const analyzeNavigation = async (forceRefresh = false) => {
    setIsAnalyzing(true);
    setError(null);
    setFromCache(false);

    try {
      const response = await fetch("/api/ai/prototype", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html, pageId, forceRefresh }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao analisar navegacao");
      }

      setAnalysis(data.analysis);
      setFromCache(data.fromCache || false);

      if (data.fromCache) {
        console.log("[Prototype] Using cached analysis");
      }

      // Process HTML with navigation data
      const processed = processHtmlForPrototype(html, data.analysis);
      setProcessedHtml(processed);
    } catch (err) {
      console.error("Failed to analyze navigation:", err);
      setError(err instanceof Error ? err.message : "Falha na analise");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process HTML to inject navigation logic
  const processHtmlForPrototype = (originalHtml: string, analysisData: PrototypeAnalysis): string => {
    console.group('[Prototype] Processing HTML for prototype mode');
    console.log('Screens detected:', analysisData.screens.length);
    console.log('Navigation mappings:', analysisData.navigation.length);
    console.log('Fixed elements from AI:', analysisData.fixedElements?.length || 0);

    // Create a parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, "text/html");

    // Find all app screens
    const screens = doc.querySelectorAll(".app-screen");

    // Auto-detect fixed elements using DOM heuristics (fallback)
    const autoDetectFixedElements = (screens: NodeListOf<Element>): FixedElement[] => {
      const detected: FixedElement[] = [];
      const seenSelectors = new Set<string>();

      screens.forEach((screen, screenIndex) => {
        // Patterns for bottom navigation/tab bars
        const bottomNavSelectors = [
          'nav[class*="bottom"]',
          'nav[class*="tab"]',
          '[class*="bottom-nav"]',
          '[class*="tab-bar"]',
          '[class*="navigation"]',
          'nav[role="navigation"]',
          '[role="tablist"]',
          'footer nav',
          '.fixed.bottom-0',
          '.sticky.bottom-0'
        ];

        // Try to find tab bar
        for (const selector of bottomNavSelectors) {
          try {
            const element = screen.querySelector(selector);
            if (element && !seenSelectors.has(selector)) {
              const children = element.querySelectorAll('a, button, [role="button"], [role="tab"]');

              // Tab bars typically have 2-6 navigation items
              if (children.length >= 2 && children.length <= 6) {
                detected.push({
                  id: `auto-tabbar-${screenIndex}`,
                  position: 'bottom',
                  height: 72,
                  cssSelector: selector,
                  appliesTo: '*',
                  type: 'tabbar'
                });
                seenSelectors.add(selector);
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }

        // Patterns for headers
        const headerSelectors = [
          'header',
          '[class*="header"]',
          '[class*="navbar"]',
          '[class*="top-nav"]',
          'nav[class*="top"]',
          '.fixed.top-0',
          '.sticky.top-0'
        ];

        for (const selector of headerSelectors) {
          try {
            const element = screen.querySelector(selector);
            if (element && !seenSelectors.has(selector)) {
              detected.push({
                id: `auto-header-${screenIndex}`,
                position: 'top',
                height: 56,
                cssSelector: selector,
                appliesTo: '*',
                type: 'header'
              });
              seenSelectors.add(selector);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      });

      return detected;
    };

    // Inject fallback tab bar if needed
    const injectFallbackTabBar = (
      doc: Document,
      screens: NodeListOf<Element>,
      analysisData: PrototypeAnalysis
    ): void => {
      if (analysisData.screens.length <= 1) {
        console.log('[Prototype] Single screen, no tab bar needed');
        return;
      }

      // Check if any screen already has a working tab bar
      let hasTabBar = false;
      screens.forEach(screen => {
        const existingTabBar = screen.querySelector('.prototype-tabbar');
        if (existingTabBar) {
          hasTabBar = true;
        }
      });

      if (hasTabBar) {
        console.log('[Prototype] Tab bar already exists, skipping injection');
        return;
      }

      console.log('[Prototype] No tab bar detected, injecting fallback tab bar...');

      // Generate tab bar with appropriate SVG icons for each screen
      const tabBarHtml = `
        <nav class="injected-tabbar prototype-tabbar prototype-fixed-element"
             data-fixed-position="bottom"
             data-fixed-type="tabbar"
             style="position: sticky; bottom: 0; z-index: 100;
                    display: flex; justify-content: space-around; align-items: center;
                    background: #ffffff; border-top: 1px solid #e5e7eb;
                    padding: 8px 0 20px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.05);">
          ${analysisData.screens.map((screen, idx) => {
            const iconSvg = getIconForScreen(screen.name);
            return `
            <button
              data-navigate-to="${screen.id}"
              data-screen-target="${screen.id}"
              style="flex: 1; display: flex; flex-direction: column; align-items: center;
                     gap: 4px; padding: 8px; background: none; border: none;
                     cursor: pointer; color: ${idx === 0 ? '#f97316' : '#6b7280'}; transition: color 0.2s;"
              ${idx === 0 ? 'aria-current="page" data-active="true"' : 'data-active="false"'}
            >
              <span class="tab-icon" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">${iconSvg}</span>
              <span style="font-size: 11px; font-weight: 500;">${screen.name}</span>
            </button>
          `}).join('')}
        </nav>
      `;

      screens.forEach((screen) => {
        screen.insertAdjacentHTML('beforeend', tabBarHtml);
        console.log('[Prototype] Injected tab bar into', screen.getAttribute('data-screen'));
      });
    };

    // Combine AI detection + local heuristics
    let fixedElementsToUse = analysisData.fixedElements || [];

    // Fallback: if AI didn't detect anything, use local heuristics
    if (fixedElementsToUse.length === 0) {
      console.log('[Prototype] AI did not detect fixed elements, using local heuristics...');
      fixedElementsToUse = autoDetectFixedElements(screens);
      console.log('[Prototype] Auto-detected:', fixedElementsToUse);
    }

    // Add data-screen attribute to each screen
    screens.forEach((screen, index) => {
      const screenInfo = analysisData.screens[index];
      if (screenInfo) {
        screen.setAttribute("data-screen", screenInfo.id);
        screen.setAttribute("data-screen-index", String(index));
        screen.setAttribute("data-screen-id", screenInfo.id);
      }

      // Mark fixed elements with CSS classes (preserve structure)
      const screenId = screenInfo?.id || `screen-${index}`;
      const screenFixedElements = fixedElementsToUse.filter(
        (f) => f.appliesTo === '*' ||
               (Array.isArray(f.appliesTo) && f.appliesTo.includes(screenId))
      );

      screenFixedElements.forEach((fixed) => {
        try {
          const element = screen.querySelector(fixed.cssSelector);
          if (element) {
            // Mark as fixed element
            element.classList.add('prototype-fixed-element');
            element.setAttribute('data-fixed-position', fixed.position);
            element.setAttribute('data-fixed-type', fixed.type);

            // If it's a tab bar, add special class
            if (fixed.type === 'tabbar') {
              element.classList.add('prototype-tabbar');
            }

            console.log(`[Prototype] Marked ${fixed.type} as fixed: ${fixed.cssSelector}`);
          } else {
            console.warn(`[Prototype] Element not found for selector: ${fixed.cssSelector}`);
          }
        } catch (e) {
          console.warn(`Failed to mark fixed element: ${fixed.cssSelector}`, e);
        }
      });
    });

    // Check if we need to inject a fallback tab bar
    const hasAnyTabBar = Array.from(screens).some(screen =>
      screen.querySelector('.prototype-tabbar')
    );

    if (!hasAnyTabBar && analysisData.screens.length > 1) {
      injectFallbackTabBar(doc, screens, analysisData);
    }

    // Inject the navigation script
    const navigationScript = `
<script>
(function() {
  console.log('[Prototype Navigation] Script starting...');
  const navigationMap = ${JSON.stringify(analysisData.navigation)};
  console.log('[Prototype Navigation] Navigation map:', navigationMap);
  const screens = document.querySelectorAll('.app-screen');
  console.log('[Prototype Navigation] Found screens:', screens.length);
  let currentIndex = 0;
  const history = [0];

  // Update active states on tab bars
  function updateTabBarActiveStates(currentScreenId) {
    const allTabBars = document.querySelectorAll('.prototype-tabbar');

    allTabBars.forEach(tabBar => {
      const items = tabBar.querySelectorAll('a, button, [role="button"], [role="tab"]');

      items.forEach(item => {
        // Find which screen this item navigates to
        const mapping = navigationMap.find(nav => {
          const text = item.textContent?.trim().toLowerCase() || '';
          const searchText = nav.elementText?.toLowerCase() || '';

          // Try selector match
          try {
            if (nav.cssSelector && item.matches(nav.cssSelector)) return true;
          } catch(e) {}

          // Try text match
          if (searchText && (text.includes(searchText) || searchText.includes(text))) return true;

          return false;
        });

        if (mapping) {
          // Mark as active if it navigates to current screen
          if (mapping.toScreen === currentScreenId) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
            item.setAttribute('data-active', 'true');
          } else {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
            item.setAttribute('data-active', 'false');
          }
        }
      });
    });
  }

  // Hide all screens except the active one
  function showScreen(index) {
    screens.forEach((screen, i) => {
      screen.classList.remove('active');
    });

    if (screens[index]) {
      screens[index].classList.add('active');
      // Reset scroll position
      screens[index].scrollTop = 0;

      // Update tab bar active states
      const screenId = screens[index].getAttribute('data-screen-id') || screens[index].getAttribute('data-screen');
      if (screenId) {
        updateTabBarActiveStates(screenId);
      }
    }

    currentIndex = index;

    // Notify parent
    window.parent.postMessage({ type: 'screen-change', index: index }, '*');
  }

  function navigateTo(targetScreenId) {
    if (targetScreenId === 'back') {
      if (history.length > 1) {
        history.pop();
        const prevIndex = history[history.length - 1];
        showScreen(prevIndex);
      }
      return;
    }

    const targetIndex = Array.from(screens).findIndex(
      screen => screen.getAttribute('data-screen') === targetScreenId
    );

    if (targetIndex >= 0 && targetIndex !== currentIndex) {
      history.push(targetIndex);
      showScreen(targetIndex);
    }
  }

  // Set up click handlers for navigation
  console.log('[Prototype Navigation] Setting up navigation handlers...');
  let totalHandlersAdded = 0;

  navigationMap.forEach(nav => {
    try {
      const fromScreens = nav.fromScreen === '*'
        ? Array.from(screens)
        : [document.querySelector('[data-screen="' + nav.fromScreen + '"]')].filter(Boolean);

      console.log('[Prototype Navigation] Processing nav:', nav, 'fromScreens:', fromScreens.length);

      fromScreens.forEach(screen => {
        // Try multiple selector strategies
        const selectors = [
          nav.cssSelector,
          // Fallback: find by text content
          null
        ];

        selectors.forEach(selector => {
          if (selector) {
            const elements = screen.querySelectorAll(selector);
            console.log('[Prototype Navigation] Selector:', selector, 'found:', elements.length, 'elements');
            elements.forEach(el => {
              el.style.cursor = 'pointer';
              el.setAttribute('data-navigate-to', nav.toScreen);
              el.addEventListener('click', (e) => {
                console.log('[Prototype Navigation] Click detected! Navigating to:', nav.toScreen);
                e.preventDefault();
                e.stopPropagation();
                navigateTo(nav.toScreen);
              });
              totalHandlersAdded++;
            });
          }
        });

        // Also try to find elements by text content
        if (nav.elementText) {
          const allClickable = screen.querySelectorAll('button, a, [role="button"], nav > *, .nav *, .bottom-nav *, .tab-bar *');
          console.log('[Prototype Navigation] Text search for:', nav.elementText, 'found:', allClickable.length, 'clickable elements');
          allClickable.forEach(el => {
            const text = el.textContent?.trim().toLowerCase() || '';
            const searchText = nav.elementText.toLowerCase();
            if (text.includes(searchText) || searchText.includes(text)) {
              if (!el.hasAttribute('data-navigate-to')) {
                console.log('[Prototype Navigation] Text match found:', text, 'for target:', nav.toScreen);
                el.style.cursor = 'pointer';
                el.setAttribute('data-navigate-to', nav.toScreen);
                el.addEventListener('click', (e) => {
                  console.log('[Prototype Navigation] Text-matched click! Navigating to:', nav.toScreen);
                  e.preventDefault();
                  e.stopPropagation();
                  navigateTo(nav.toScreen);
                });
                totalHandlersAdded++;
              }
            }
          });
        }
      });
    } catch (e) {
      console.warn('[Prototype Navigation] Navigation setup failed for:', nav, e);
    }
  });

  console.log('[Prototype Navigation] Total handlers added from navigationMap:', totalHandlersAdded);

  // Handle back buttons
  document.querySelectorAll('[class*="back"], [aria-label*="back"], [aria-label*="voltar"]').forEach(el => {
    if (!el.hasAttribute('data-navigate-to')) {
      el.style.cursor = 'pointer';
      el.setAttribute('data-navigate-to', 'back');
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigateTo('back');
      });
    }
  });

  // Setup navigation for injected/detected tab bars
  const elementsWithNavigate = document.querySelectorAll('[data-navigate-to]');
  console.log('[Prototype Navigation] Found elements with data-navigate-to:', elementsWithNavigate.length);

  let fallbackHandlersAdded = 0;
  elementsWithNavigate.forEach(button => {
    if (!button.hasAttribute('data-navigation-setup')) {
      const targetScreenId = button.getAttribute('data-navigate-to');
      console.log('[Prototype Navigation] Setting up fallback handler for:', targetScreenId);
      if (targetScreenId && targetScreenId !== 'back') {
        button.addEventListener('click', (e) => {
          console.log('[Prototype Navigation] Fallback handler click! Navigating to:', targetScreenId);
          e.preventDefault();
          e.stopPropagation();
          navigateTo(targetScreenId);
        });
        button.setAttribute('data-navigation-setup', 'true');
        fallbackHandlersAdded++;
      }
    }
  });

  console.log('[Prototype Navigation] Total fallback handlers added:', fallbackHandlersAdded);

  // SAFETY NET: Find all tab bars and try to set up navigation for their items
  // This catches cases where Gemini detected the tab bar but didn't create proper navigation mappings
  const allTabBars = document.querySelectorAll('.prototype-tabbar, nav[class*="bottom"], [class*="bottom-nav"], [class*="tab-bar"]');
  console.log('[Prototype Navigation] Safety net: Found', allTabBars.length, 'potential tab bars');

  let safetyNetHandlers = 0;
  allTabBars.forEach(tabBar => {
    const items = tabBar.querySelectorAll('button, a, [role="button"], [role="tab"]');
    console.log('[Prototype Navigation] Tab bar has', items.length, 'items');

    items.forEach((item, index) => {
      // Skip if already has handler
      if (item.hasAttribute('data-navigation-setup')) {
        return;
      }

      // Try to determine target screen from:
      // 1. data-navigate-to attribute (injected tab bars)
      // 2. Text content matching screen names
      // 3. Position in tab bar (as last resort)

      let targetScreenId = item.getAttribute('data-navigate-to');

      if (!targetScreenId) {
        // Try to match text to screen names
        const itemText = item.textContent?.trim().toLowerCase() || '';
        const matchedScreen = Array.from(screens).find(screen => {
          const screenId = screen.getAttribute('data-screen') || '';
          const screenName = screenId.toLowerCase();
          return itemText.includes(screenName) || screenName.includes(itemText);
        });

        if (matchedScreen) {
          targetScreenId = matchedScreen.getAttribute('data-screen');
        } else {
          // Last resort: use position
          if (index < screens.length) {
            targetScreenId = screens[index].getAttribute('data-screen');
          }
        }
      }

      if (targetScreenId && targetScreenId !== 'back') {
        item.style.cursor = 'pointer';
        item.setAttribute('data-navigate-to', targetScreenId);
        item.addEventListener('click', (e) => {
          console.log('[Prototype Navigation] Safety net click! Navigating to:', targetScreenId);
          e.preventDefault();
          e.stopPropagation();
          navigateTo(targetScreenId);
        });
        item.setAttribute('data-navigation-setup', 'true');
        safetyNetHandlers++;
        console.log('[Prototype Navigation] Safety net handler added for:', item.textContent?.trim(), '->', targetScreenId);
      }
    });
  });

  console.log('[Prototype Navigation] Safety net handlers added:', safetyNetHandlers);

  // UNIVERSAL SAFETY NET - Hook ALL clickable elements in the app
  // This catches buttons, cards, links that weren't matched by Gemini or previous safety nets
  const allClickables = document.querySelectorAll(
    'button:not([data-navigation-setup]), ' +
    'a:not([data-navigation-setup]), ' +
    '[role="button"]:not([data-navigation-setup]), ' +
    '[class*="card"]:not([data-navigation-setup]), ' +
    '[class*="product"]:not([data-navigation-setup]), ' +
    '[class*="item"]:not([data-navigation-setup]):not(li):not(style):not(script), ' +
    '[class*="btn"]:not([data-navigation-setup]), ' +
    '[class*="cta"]:not([data-navigation-setup]), ' +
    '[class*="action"]:not([data-navigation-setup]), ' +
    '[class*="link"]:not([data-navigation-setup]), ' +
    '[onclick]:not([data-navigation-setup]), ' +
    'img:not([data-navigation-setup]), ' +
    'svg:not([data-navigation-setup])'
  );

  console.log('[Prototype Navigation] Universal safety net: Found', allClickables.length, 'potential clickable elements');

  // Helper function to find screen by keyword
  function findScreenByKeyword(keyword) {
    const kw = keyword.toLowerCase();
    for (let i = 0; i < screens.length; i++) {
      const screenId = screens[i].getAttribute('data-screen') || '';
      if (screenId.toLowerCase().includes(kw)) {
        return screenId;
      }
    }
    return null;
  }

  // Helper to find next screen from current
  function findNextScreen(fromElement) {
    const screenElement = fromElement.closest('.app-screen');
    if (screenElement) {
      const currentIdx = Array.from(screens).indexOf(screenElement);
      if (currentIdx >= 0 && currentIdx < screens.length - 1) {
        return screens[currentIdx + 1].getAttribute('data-screen');
      }
    }
    return null;
  }

  // Helper to find screen by index (for position-based navigation)
  function getScreenByIndex(index) {
    if (index >= 0 && index < screens.length) {
      return screens[index].getAttribute('data-screen');
    }
    return null;
  }

  let universalHandlers = 0;
  allClickables.forEach((element) => {
    // Skip if inside an already-handled parent
    if (element.closest('[data-navigation-setup]')) return;
    // Skip if it's a child of nav/tabbar (handled by safety net)
    if (element.closest('.prototype-tabbar') || element.closest('nav')) return;

    // Get text and class info
    const text = (element.textContent || '').trim().toLowerCase();
    const className = (element.className || '').toString().toLowerCase();
    const parentClass = (element.parentElement?.className || '').toString().toLowerCase();
    const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();

    // Try to determine target screen
    let targetScreen = null;

    // 1. Check for common navigation patterns by text
    if (text.includes('home') || text.includes('início') || text.includes('inicio') || ariaLabel.includes('home')) {
      targetScreen = findScreenByKeyword('home') || getScreenByIndex(1);
    } else if (text.includes('cart') || text.includes('carrinho') || text.includes('bag') || text.includes('sacola') || ariaLabel.includes('cart')) {
      targetScreen = findScreenByKeyword('cart') || findScreenByKeyword('carrinho');
    } else if (text.includes('profile') || text.includes('perfil') || text.includes('conta') || text.includes('account') || ariaLabel.includes('profile')) {
      targetScreen = findScreenByKeyword('profile') || findScreenByKeyword('perfil');
    } else if (text.includes('categor') || text.includes('grid') || text.includes('explore') || ariaLabel.includes('categor')) {
      targetScreen = findScreenByKeyword('categor') || findScreenByKeyword('explore');
    } else if (text.includes('search') || text.includes('busca') || text.includes('pesquis') || ariaLabel.includes('search')) {
      targetScreen = findScreenByKeyword('search') || findScreenByKeyword('busca');
    } else if (text.includes('login') || text.includes('entrar') || text.includes('sign in') || text.includes('signin')) {
      targetScreen = findScreenByKeyword('home') || findNextScreen(element);
    } else if (text.includes('signup') || text.includes('sign up') || text.includes('register') || text.includes('cadastr')) {
      targetScreen = findScreenByKeyword('home') || findNextScreen(element);
    } else if (text.includes('get started') || text.includes('começar') || text.includes('start') || text.includes('iniciar')) {
      targetScreen = findNextScreen(element);
    } else if (text.includes('continue') || text.includes('continuar') || text.includes('next') || text.includes('próximo')) {
      targetScreen = findNextScreen(element);
    } else if (text.includes('back') || text.includes('voltar') || text === '←' || text === '<' || text === '‹' || ariaLabel.includes('back') || ariaLabel.includes('voltar')) {
      targetScreen = 'back';
    } else if (text.includes('shop now') || text.includes('comprar') || text.includes('buy') || text.includes('add to cart') || text.includes('adicionar')) {
      targetScreen = findScreenByKeyword('cart') || findScreenByKeyword('detail') || findNextScreen(element);
    } else if (text.includes('ver mais') || text.includes('see more') || text.includes('view all') || text.includes('ver todos') || text.includes('show all')) {
      targetScreen = findScreenByKeyword('list') || findScreenByKeyword('product') || findScreenByKeyword('categor') || findNextScreen(element);
    } else if (text.includes('detail') || text.includes('detalhe') || text.includes('more info') || text.includes('saiba mais')) {
      targetScreen = findScreenByKeyword('detail') || findNextScreen(element);
    } else if (text.includes('checkout') || text.includes('finalizar') || text.includes('pay') || text.includes('pagar')) {
      targetScreen = findScreenByKeyword('checkout') || findScreenByKeyword('payment') || findScreenByKeyword('cart');
    } else if (text.includes('order') || text.includes('pedido')) {
      targetScreen = findScreenByKeyword('order') || findScreenByKeyword('checkout');
    } else if (text.includes('settings') || text.includes('config') || text.includes('preferên')) {
      targetScreen = findScreenByKeyword('setting') || findScreenByKeyword('config');
    } else if (text.includes('notification') || text.includes('notifica')) {
      targetScreen = findScreenByKeyword('notification') || findScreenByKeyword('notifica');
    } else if (text.includes('favorite') || text.includes('favorit') || text.includes('wishlist') || text.includes('saved')) {
      targetScreen = findScreenByKeyword('favorite') || findScreenByKeyword('wishlist');
    }

    // 2. Check class patterns if no text match
    if (!targetScreen) {
      if (className.includes('home') || parentClass.includes('home')) targetScreen = findScreenByKeyword('home') || getScreenByIndex(1);
      else if (className.includes('cart') || className.includes('bag') || parentClass.includes('cart')) targetScreen = findScreenByKeyword('cart');
      else if (className.includes('profile') || className.includes('user') || parentClass.includes('profile')) targetScreen = findScreenByKeyword('profile');
      else if (className.includes('categor') || parentClass.includes('categor')) targetScreen = findScreenByKeyword('categor');
      else if (className.includes('search') || parentClass.includes('search')) targetScreen = findScreenByKeyword('search');
      else if (className.includes('back') || parentClass.includes('back')) targetScreen = 'back';
      else if (className.includes('close') || className.includes('dismiss')) targetScreen = 'back';
      else if (className.includes('next') || className.includes('forward')) targetScreen = findNextScreen(element);
      else if (className.includes('detail')) targetScreen = findScreenByKeyword('detail') || findNextScreen(element);
    }

    // 3. For cards/products, go to detail or next screen
    if (!targetScreen && (className.includes('card') || className.includes('product') || className.includes('item') ||
        parentClass.includes('card') || parentClass.includes('product') || parentClass.includes('grid'))) {
      targetScreen = findScreenByKeyword('detail') || findScreenByKeyword('product') || findNextScreen(element);
    }

    // 4. For images inside cards, also navigate
    if (!targetScreen && element.tagName === 'IMG') {
      const parentCard = element.closest('[class*="card"], [class*="product"], [class*="item"]');
      if (parentCard && !parentCard.hasAttribute('data-navigation-setup')) {
        targetScreen = findScreenByKeyword('detail') || findNextScreen(element);
      }
    }

    // 5. For SVGs that look like icons in navigation areas
    if (!targetScreen && element.tagName === 'svg') {
      const parent = element.closest('button, a, [role="button"]');
      if (parent && !parent.hasAttribute('data-navigation-setup')) {
        // This SVG is inside a button/link that hasn't been set up
        // Let the parent handle it
        return;
      }
    }

    // 6. For primary/CTA buttons without specific target, go to next screen
    if (!targetScreen && element.tagName === 'BUTTON') {
      // Check if it's a primary/main button (usually the main action)
      if (className.includes('primary') || className.includes('cta') || className.includes('main') ||
          className.includes('submit') || className.includes('action') ||
          !className.includes('secondary') && !className.includes('ghost') && !className.includes('outline')) {
        targetScreen = findNextScreen(element);
      }
    }

    // 7. For links without specific target, go to next screen
    if (!targetScreen && element.tagName === 'A') {
      const href = element.getAttribute('href') || '';
      if (href === '#' || href === '' || href.startsWith('javascript:')) {
        targetScreen = findNextScreen(element);
      }
    }

    // Add handler if we found a target
    if (targetScreen) {
      element.style.cursor = 'pointer';
      element.addEventListener('click', (e) => {
        console.log('[Prototype Navigation] Universal click! Text:', text.substring(0, 30), '-> Target:', targetScreen);
        e.preventDefault();
        e.stopPropagation();
        navigateTo(targetScreen);
      });
      element.setAttribute('data-navigation-setup', 'true');
      universalHandlers++;
    }
  });

  console.log('[Prototype Navigation] Universal handlers added:', universalHandlers);

  // FINAL FALLBACK: Make sure ALL buttons on each screen navigate somewhere
  // This ensures even buttons we couldn't match will at least go to the next screen
  screens.forEach((screen, screenIdx) => {
    const unhandledButtons = screen.querySelectorAll('button:not([data-navigation-setup]), a:not([data-navigation-setup])');
    console.log('[Prototype Navigation] Screen', screenIdx, 'has', unhandledButtons.length, 'unhandled buttons/links');

    unhandledButtons.forEach(btn => {
      // Skip nav items
      if (btn.closest('nav, .prototype-tabbar')) return;

      const nextScreenId = screenIdx < screens.length - 1
        ? screens[screenIdx + 1].getAttribute('data-screen')
        : 'back';

      if (nextScreenId) {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', (e) => {
          console.log('[Prototype Navigation] Final fallback click -> Target:', nextScreenId);
          e.preventDefault();
          e.stopPropagation();
          navigateTo(nextScreenId);
        });
        btn.setAttribute('data-navigation-setup', 'true');
        universalHandlers++;
      }
    });
  });

  console.log('[Prototype Navigation] After final fallback, total universal handlers:', universalHandlers);

  // Initialize - show first screen
  showScreen(0);

  // Initialize tab bar active states
  if (screens[0]) {
    const screenId = screens[0].getAttribute('data-screen-id') || screens[0].getAttribute('data-screen');
    if (screenId) {
      updateTabBarActiveStates(screenId);
    }
  }

  console.log('[Prototype Navigation] Initialization complete!');
  console.log('[Prototype Navigation] Total navigation handlers:', totalHandlersAdded + fallbackHandlersAdded + universalHandlers);
  console.log('[Prototype Navigation] Breakdown: Gemini=' + totalHandlersAdded + ', Fallback=' + fallbackHandlersAdded + ', Universal=' + universalHandlers);

  // Listen for external navigation commands
  window.addEventListener('message', (event) => {
    if (event.data.type === 'navigate-to-index') {
      const index = event.data.index;
      if (index >= 0 && index < screens.length) {
        history.push(index);
        showScreen(index);
      }
    } else if (event.data.type === 'navigate-back') {
      navigateTo('back');
    } else if (event.data.type === 'reset') {
      history.length = 0;
      history.push(0);
      showScreen(0);
    }
  });
})();
</script>
`;

    // Preserve original style tags and links from the HTML (for icon fonts, custom styles, etc.)
    const originalStyleTags: string[] = [];
    const originalLinkTags: string[] = [];

    doc.querySelectorAll('style').forEach(style => {
      // Don't duplicate our prototype-styles
      if (style.id !== 'prototype-styles') {
        originalStyleTags.push(style.outerHTML);
      }
    });

    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      originalLinkTags.push(link.outerHTML);
    });

    console.log('[Prototype] Preserved', originalStyleTags.length, 'style tags and', originalLinkTags.length, 'stylesheet links');

    // Icon library CDN links to ensure icons work
    const iconLibraryLinks = `
<!-- Icon libraries for prototype mode -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@0.321.0/font/lucide.min.css">
`;

    // Inject prototype styles - CSS-based approach with sticky positioning
    const prototypeStyles = `
<style id="prototype-styles">
  /* Reset everything for prototype mode */
  *, *::before, *::after {
    box-sizing: border-box !important;
  }

  html {
    margin: 0 !important;
    padding: 0 !important;
    width: 390px !important;
    height: 844px !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 390px !important;
    height: 844px !important;
    overflow: hidden !important;
    background: #fff !important;
    display: block !important;
    position: relative !important;
    flex-direction: column !important;
    gap: 0 !important;
  }

  /* Hide everything that's not an app-screen */
  body > *:not(.app-screen) {
    display: none !important;
  }

  /* Style all app screens with sticky positioning for fixed elements */
  .app-screen {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 390px !important;
    height: 844px !important;
    min-width: 390px !important;
    min-height: 844px !important;
    max-width: 390px !important;
    max-height: 844px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    transition: opacity 0.15s ease-in-out;
    flex-shrink: 0 !important;
  }

  /* Fixed elements stay visible using sticky positioning */
  .prototype-fixed-element[data-fixed-position="top"] {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: inherit !important;
  }

  .prototype-fixed-element[data-fixed-position="bottom"] {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 100 !important;
    background: inherit !important;
  }

  /* Tab bars maintain active state styling */
  .prototype-tabbar [aria-current="page"],
  .prototype-tabbar .active,
  .prototype-tabbar [data-active="true"] {
    color: var(--primary-color, #2b8cee) !important;
    opacity: 1 !important;
  }

  .prototype-tabbar [data-active="false"] {
    opacity: 0.6 !important;
  }

  /* Only show active screen */
  .app-screen.active {
    display: block !important;
    z-index: 10 !important;
    opacity: 1 !important;
  }

  .app-screen:not(.active) {
    display: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Clickable navigation elements */
  [data-navigate-to] {
    cursor: pointer !important;
  }

  [data-navigate-to]:hover {
    opacity: 0.85;
  }

  /* Ensure inner content doesn't break layout */
  .app-screen > * {
    max-width: 100% !important;
  }

  /* Auto-fix CSS for common tab bar/header patterns */
  nav[class*="bottom"]:not(.prototype-fixed-element),
  [class*="bottom-nav"]:not(.prototype-fixed-element),
  [class*="tab-bar"]:not(.prototype-fixed-element),
  [class*="navigation"][class*="bottom"]:not(.prototype-fixed-element) {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 100 !important;
    background: inherit !important;
  }

  header:not(.prototype-fixed-element),
  [class*="header"]:not(.prototype-fixed-element),
  [class*="navbar"]:not(.prototype-fixed-element) {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: inherit !important;
  }

  .fixed.bottom-0,
  .sticky.bottom-0 {
    position: sticky !important;
    bottom: 0 !important;
    z-index: 100 !important;
  }

  .fixed.top-0,
  .sticky.top-0 {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
  }
</style>
`;

    // Insert styles and icon libraries in head
    const headEnd = doc.head || doc.querySelector("head");
    if (headEnd) {
      // First inject icon library CDN links
      headEnd.insertAdjacentHTML("beforeend", iconLibraryLinks);
      console.log('[Prototype] Injected icon library CDN links');

      // Then inject prototype styles
      headEnd.insertAdjacentHTML("beforeend", prototypeStyles);
      console.log('[Prototype] Injected prototype styles');
    }

    // Insert script before closing body
    const body = doc.body;
    if (body) {
      body.insertAdjacentHTML("beforeend", navigationScript);
    }

    console.log('[Prototype] Processing complete');
    console.groupEnd();

    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "screen-change") {
        setCurrentScreenIndex(event.data.index);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Navigation controls
  const goToScreen = useCallback((index: number) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "navigate-to-index", index },
        "*"
      );
    }
  }, []);

  const goBack = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "navigate-back" }, "*");
    }
  }, []);

  const resetPrototype = useCallback(() => {
    setCurrentScreenIndex(0);
    setNavigationHistory([0]);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "reset" }, "*");
    }
  }, []);

  const goPrevious = useCallback(() => {
    if (currentScreenIndex > 0) {
      goToScreen(currentScreenIndex - 1);
    }
  }, [currentScreenIndex, goToScreen]);

  const goNext = useCallback(() => {
    if (analysis && currentScreenIndex < analysis.screens.length - 1) {
      goToScreen(currentScreenIndex + 1);
    }
  }, [analysis, currentScreenIndex, goToScreen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <Smartphone className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Modo Prototipo</h2>
            <p className="text-sm text-gray-400">
              {isAnalyzing
                ? "Analisando navegacao..."
                : analysis
                ? `${analysis.screens.length} telas detectadas${fromCache ? " (cache)" : ""}`
                : "Preparando..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetPrototype}
            disabled={isAnalyzing}
            className="text-gray-400 hover:text-white hover:bg-[#252525]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-[#252525]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
            <p className="text-gray-400">Analisando elementos de navegacao...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
            <Button
              onClick={() => analyzeNavigation()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        ) : processedHtml ? (
          <div className="relative">
            {/* Phone frame - outer shell */}
            <div className="relative rounded-[50px] bg-[#1a1a1a] p-3 shadow-2xl">
              {/* Inner bezel */}
              <div className="relative rounded-[40px] bg-[#000] overflow-hidden">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-[#000] rounded-[20px] z-20" />

                {/* Screen container - exact iPhone 14 Pro dimensions */}
                <div className="relative w-[390px] h-[844px] overflow-hidden bg-white">
                  <iframe
                    ref={iframeRef}
                    srcDoc={processedHtml}
                    className="absolute inset-0 w-[390px] h-[844px] border-0"
                    style={{ width: '390px', height: '844px' }}
                    title="Prototype Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-white/30 rounded-full z-20" />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer with navigation controls */}
      {analysis && !isAnalyzing && !error && (
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-[#333] bg-[#1a1a1a]">
          {/* Previous button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrevious}
            disabled={currentScreenIndex === 0}
            className="text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Screen indicators */}
          <div className="flex items-center gap-2">
            {analysis.screens.map((screen, index) => (
              <button
                key={screen.id}
                onClick={() => goToScreen(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  index === currentScreenIndex
                    ? "bg-violet-500 w-6"
                    : "bg-gray-600 hover:bg-gray-500"
                )}
                title={screen.name}
              />
            ))}
          </div>

          {/* Next button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            disabled={currentScreenIndex === analysis.screens.length - 1}
            className="text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Current screen info */}
          <div className="ml-4 text-sm text-gray-400">
            <span className="text-white font-medium">
              {analysis.screens[currentScreenIndex]?.name || `Tela ${currentScreenIndex + 1}`}
            </span>
            <span className="ml-2">
              ({currentScreenIndex + 1}/{analysis.screens.length})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
