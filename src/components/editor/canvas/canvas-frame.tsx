"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { SelectedElementData } from "@/stores/editorStore";

// Event to notify parent when user wants to add content after selected element
export type AddContentAfterEvent = {
  elementId: string;
  elementHtml: string;
};

interface CanvasFrameProps {
  html: string;
  isDesignMode: boolean;
  onElementSelect: (id: string | null, data?: SelectedElementData) => void;
  selectedElementId: string | null;
  contentType?: "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template";
  isStreaming?: boolean;
  deviceMode?: "desktop" | "tablet" | "mobile";
  onAddContentAfter?: (event: AddContentAfterEvent) => void;
  onDeleteElement?: () => void;
}

export function CanvasFrame({
  html,
  isDesignMode,
  onElementSelect,
  selectedElementId,
  contentType = "landing",
  isStreaming = false,
  deviceMode = "desktop",
  onAddContentAfter,
  onDeleteElement,
}: CanvasFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject selection styles and event handlers into iframe
  const injectSelectionBehavior = useCallback(() => {
    const iframe = iframeRef.current;
    console.log("[CanvasFrame] injectSelectionBehavior called, iframe:", !!iframe, "doc:", !!iframe?.contentDocument, "body:", !!iframe?.contentDocument?.body);
    if (!iframe?.contentDocument?.body) return;

    const doc = iframe.contentDocument;

    // Add selection styles
    const styleId = "buildix-selection-styles";
    let styleEl = doc.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = styleId;
      doc.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* Hide Next.js dev tools elements */
      nextjs-portal,
      [id^="__next"],
      [data-nextjs] {
        display: none !important;
      }
      body {
        position: relative !important;
      }
      .buildix-hoverable:hover {
        outline: 2px dashed hsl(262, 83%, 58%) !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      .buildix-selected {
        outline: 2px solid hsl(262, 83%, 58%) !important;
        outline-offset: 2px !important;
      }
      .buildix-layer-hover {
        outline: 2px dashed hsl(262, 83%, 68%) !important;
        outline-offset: 2px !important;
        background-color: hsla(262, 83%, 58%, 0.1) !important;
      }
      .buildix-element-label {
        position: absolute;
        background: hsl(262, 83%, 58%);
        color: white;
        font-size: 14px;
        padding: 4px 10px;
        border-radius: 4px;
        font-family: system-ui, sans-serif;
        pointer-events: none;
        z-index: 10000;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
      .buildix-spacing-label {
        position: absolute;
        background: rgba(59, 130, 246, 0.9);
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: system-ui, sans-serif;
        pointer-events: none;
        z-index: 10001;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
      }
      .buildix-margin-overlay {
        position: absolute;
        background: rgba(251, 146, 60, 0.15);
        border: 1px dashed rgba(251, 146, 60, 0.5);
        pointer-events: none;
        z-index: 9998;
      }
      .buildix-padding-overlay {
        position: absolute;
        background: rgba(34, 197, 94, 0.15);
        border: 1px dashed rgba(34, 197, 94, 0.5);
        pointer-events: none;
        z-index: 9999;
      }
      .buildix-action-bar {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        z-index: 10002;
        pointer-events: auto;
      }
      .buildix-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: hsl(262, 83%, 58%);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 22px;
        font-weight: bold;
        line-height: 1;
        transition: all 0.15s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .buildix-action-btn:hover {
        background: hsl(262, 83%, 48%);
        transform: scale(1.1);
      }
      .buildix-action-btn:active {
        transform: scale(0.95);
      }
    `;

    // Get all interactive elements
    const elements = doc.body.querySelectorAll("*");
    let elementId = 0;

    // SVG child elements that should not be individually selectable
    const svgChildTags = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "g", "use", "text", "tspan", "defs", "symbol", "clippath", "mask", "pattern", "image", "switch", "foreignobject"];

    elements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const tagLower = htmlEl.tagName.toLowerCase();

      // Skip script, style, meta elements, and SVG child elements
      if (["SCRIPT", "STYLE", "META", "LINK", "HEAD", "HTML"].includes(htmlEl.tagName)) {
        return;
      }

      // Skip SVG child elements - they shouldn't have IDs, only the parent SVG
      if (svgChildTags.includes(tagLower)) {
        return;
      }

      // Assign unique ID if not present (use setAttribute for SVG elements)
      const existingId = htmlEl.dataset?.buildixId || htmlEl.getAttribute("data-buildix-id");
      if (!existingId) {
        const newId = `el-${elementId++}`;
        if (htmlEl.dataset) {
          htmlEl.dataset.buildixId = newId;
        } else {
          htmlEl.setAttribute("data-buildix-id", newId);
        }
      }

      // Add hoverable class in design mode
      if (isDesignMode) {
        htmlEl.classList.add("buildix-hoverable");
      } else {
        htmlEl.classList.remove("buildix-hoverable");
        htmlEl.classList.remove("buildix-selected");
      }
    });

    // Handle click events
    console.log("[CanvasFrame] Setting up click handler, isDesignMode:", isDesignMode);
    if (isDesignMode) {
      doc.body.onclick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        let target = e.target as HTMLElement;

        console.log("[Buildix] Click on:", target.tagName, "hasId:", target.dataset?.buildixId || target.getAttribute("data-buildix-id"));

        // If clicked on an SVG child element (path, circle, etc.) or on SVG itself, handle SVG selection
        const svgChildTags = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "g", "use", "text", "tspan", "defs", "symbol", "clippath", "mask", "pattern", "image", "switch", "foreignobject"];
        const tagLower = target.tagName.toLowerCase();

        if (svgChildTags.includes(tagLower)) {
          // Find the closest SVG parent
          let parent = target.parentElement;
          while (parent && parent.tagName.toLowerCase() !== "svg" && parent !== doc.body) {
            parent = parent.parentElement;
          }
          if (parent && parent.tagName.toLowerCase() === "svg") {
            target = parent as HTMLElement;
            console.log("[Buildix] Bubbled up to SVG parent:", target.getAttribute("data-buildix-id"));
          }
        }

        // Get element ID (use getAttribute as fallback for SVG elements)
        let elementId = target.dataset?.buildixId || target.getAttribute("data-buildix-id");

        // If no ID on target, try to find or assign one (especially for SVG)
        if (!elementId && target.tagName.toLowerCase() === "svg") {
          // Assign a new ID to this SVG
          const maxId = Math.max(0, ...Array.from(doc.querySelectorAll("[data-buildix-id]")).map(el => {
            const id = el.getAttribute("data-buildix-id") || "";
            const match = id.match(/el-(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }));
          const newId = `el-${maxId + 1}`;
          target.setAttribute("data-buildix-id", newId);
          elementId = newId;
          console.log("[Buildix] Assigned new ID to SVG:", newId);
        }

        console.log("[Buildix] Final target:", target.tagName, "elementId:", elementId);

        // Remove previous selection
        doc.querySelectorAll(".buildix-selected").forEach((el) => {
          el.classList.remove("buildix-selected");
        });

        // Remove previous labels and overlays (use querySelectorAll to catch all)
        doc.querySelectorAll(".buildix-element-label").forEach(el => el.remove());
        doc.querySelectorAll(".buildix-spacing-label").forEach(el => el.remove());
        doc.querySelectorAll(".buildix-action-bar").forEach(el => el.remove());

        if (elementId) {
          target.classList.add("buildix-selected");

          // Add element label
          const label = doc.createElement("div");
          label.className = "buildix-element-label";
          label.textContent = target.tagName.toLowerCase();

          const rect = target.getBoundingClientRect();
          const scrollTop = doc.documentElement.scrollTop;
          const scrollLeft = doc.documentElement.scrollLeft;

          label.style.top = `${rect.top + scrollTop - 20}px`;
          label.style.left = `${rect.left + scrollLeft}px`;

          doc.body.appendChild(label);

          // Get computed styles for spacing labels (use iframe's window context)
          const iframeWindow = doc.defaultView;
          const computed = iframeWindow?.getComputedStyle(target);

          console.log("[Buildix] Click - computed styles available:", !!computed);

          if (!computed) {
            // Fallback: still send element data even without computed styles
            // Parse inline styles from style attribute
            const fallbackInlineStyles: Record<string, string> = {};
            const fallbackStyleAttr = target.getAttribute("style");
            if (fallbackStyleAttr) {
              fallbackStyleAttr.split(";").forEach((declaration) => {
                const [prop, value] = declaration.split(":").map(s => s.trim());
                if (prop && value) {
                  // Convert kebab-case to camelCase
                  const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                  fallbackInlineStyles[camelProp] = value;
                }
              });
            }
            onElementSelect(elementId, {
              id: elementId,
              tagName: target.tagName.toLowerCase(),
              textContent: target.textContent || "",
              innerHTML: target.innerHTML,
              outerHTML: target.outerHTML,
              classes: target.className.replace(/buildix-[\w-]+/g, "").trim(),
              elementId: target.id || "",
              attributes: {},
              computedStyles: {},
              inlineStyles: fallbackInlineStyles,
            });
            return;
          }

          const paddingTop = parseFloat(computed.paddingTop) || 0;
          const paddingRight = parseFloat(computed.paddingRight) || 0;
          const paddingBottom = parseFloat(computed.paddingBottom) || 0;
          const paddingLeft = parseFloat(computed.paddingLeft) || 0;
          const marginTop = parseFloat(computed.marginTop) || 0;
          const marginRight = parseFloat(computed.marginRight) || 0;
          const marginBottom = parseFloat(computed.marginBottom) || 0;
          const marginLeft = parseFloat(computed.marginLeft) || 0;

          // Spacing labels temporarily disabled - values shown in Properties panel instead

          // Get computed styles for element data
          const computedStyles: Record<string, string> = {};

          // Essential style properties to capture
          const styleProperties = [
            // Spacing
            "marginTop", "marginRight", "marginBottom", "marginLeft",
            "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
            // Size
            "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
            // Typography
            "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight",
            "letterSpacing", "textAlign", "color", "textDecoration", "textTransform",
            "textShadow", "textIndent", "wordSpacing", "whiteSpace", "wordWrap",
            // Background
            "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition",
            "backgroundRepeat",
            // Border
            "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
            "borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle",
            "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor",
            "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius",
            // Position
            "position", "top", "right", "bottom", "left", "zIndex",
            // Effects
            "opacity", "boxShadow", "filter", "backdropFilter", "mixBlendMode",
            "cursor", "overflow", "overflowX", "overflowY", "visibility",
            "outline", "outlineWidth", "outlineStyle", "outlineColor",
            "clipPath", "pointerEvents", "userSelect",
            // Transforms
            "transform", "transformOrigin", "perspective",
            // Display & Layout
            "display", "flexDirection", "justifyContent", "alignItems", "gap",
            "flexWrap", "flexBasis", "flexGrow", "flexShrink",
            "alignContent", "alignSelf", "justifySelf", "order",
            "gridTemplateColumns", "gridTemplateRows",
            "verticalAlign",
            // Animations & Transitions
            "animation", "animationName", "animationDuration", "animationDelay",
            "animationTimingFunction", "animationIterationCount",
            "transition", "transitionProperty", "transitionDuration",
            "transitionDelay", "transitionTimingFunction",
          ];

          styleProperties.forEach((prop) => {
            const value = computed.getPropertyValue(
              prop.replace(/([A-Z])/g, "-$1").toLowerCase()
            );
            if (value) {
              computedStyles[prop] = value;
            }
          });

          // Normalize fontFamily - remove extra quotes and clean up
          if (computedStyles.fontFamily) {
            // getComputedStyle returns font-family with quotes, e.g., '"Playfair Display", serif'
            // We need to clean it up for proper matching in the UI
            computedStyles.fontFamily = computedStyles.fontFamily
              .replace(/^["']|["']$/g, "") // Remove outer quotes
              .trim();
          }

          // Extract element data
          // Use getAttribute for className because SVG elements have className as SVGAnimatedString
          const classString = typeof target.className === "string"
            ? target.className
            : (target.getAttribute("class") || "");

          // Parse inline styles from style attribute
          const inlineStyles: Record<string, string> = {};
          const styleAttr = target.getAttribute("style");
          if (styleAttr) {
            styleAttr.split(";").forEach((declaration) => {
              const [prop, value] = declaration.split(":").map(s => s.trim());
              if (prop && value) {
                // Convert kebab-case to camelCase
                const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
                inlineStyles[camelProp] = value;
              }
            });
          }

          const elementData: SelectedElementData = {
            id: elementId,
            tagName: target.tagName.toLowerCase(),
            textContent: target.textContent || "",
            innerHTML: target.innerHTML,
            outerHTML: target.outerHTML,
            classes: classString.replace(/buildix-[\w-]+/g, "").trim(),
            elementId: target.id || "",
            attributes: {},
            computedStyles,
            inlineStyles,
          };

          // Get all attributes
          Array.from(target.attributes).forEach((attr) => {
            if (!attr.name.startsWith("data-buildix") && attr.name !== "class") {
              elementData.attributes[attr.name] = attr.value;
            }
          });

          onElementSelect(elementId, elementData);
        } else {
          onElementSelect(null);
        }
      };
    } else {
      // In Preview mode, prevent ALL navigation from links to avoid "app inside app" issue
      doc.body.onclick = (e: MouseEvent) => {
        let target = e.target as HTMLElement;

        // Walk up to find any anchor element
        while (target && target.tagName !== 'A' && target !== doc.body) {
          target = target.parentElement as HTMLElement;
        }

        // If we found an anchor, ALWAYS prevent navigation
        // This prevents the "app inside app" issue where clicking sidebar links
        // would load the Buildix app inside the preview iframe
        if (target && target.tagName === 'A') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };

      // Also prevent form submissions
      const forms = doc.querySelectorAll('form');
      forms.forEach((form) => {
        form.onsubmit = (e: Event) => {
          e.preventDefault();
          return false;
        };
      });
    }
  }, [isDesignMode, onElementSelect]);

  // Re-execute scripts after doc.write() since they don't run automatically
  const reExecuteScripts = useCallback((doc: Document) => {
    const scripts = doc.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      // Skip if already processed
      if (oldScript.dataset.buildixProcessed) return;

      // Skip Tailwind CDN - it executes automatically
      const src = oldScript.getAttribute("src") || "";
      if (src.includes("tailwindcss") || src.includes("cdn.tailwindcss")) {
        oldScript.dataset.buildixProcessed = "true";
        return;
      }

      // Skip scripts that look like Next.js or framework scripts
      const scriptContent = oldScript.textContent || "";
      if (
        scriptContent.includes("__NEXT") ||
        scriptContent.includes("_next") ||
        scriptContent.includes("nextServerDataCallback") ||
        scriptContent.includes("ReadableStream") ||
        scriptContent.includes("self.__next") ||
        src.includes("_next")
      ) {
        oldScript.dataset.buildixProcessed = "true";
        return;
      }

      // Skip empty scripts
      if (!scriptContent.trim() && !src) {
        oldScript.dataset.buildixProcessed = "true";
        return;
      }

      try {
        const newScript = doc.createElement("script");

        // Copy all attributes
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // For inline scripts, wrap in IIFE to avoid variable redeclaration errors
        if (scriptContent && !src) {
          // Wrap the script content in an IIFE to create a new scope
          newScript.textContent = `(function() {\n${scriptContent}\n})();`;
        } else if (scriptContent) {
          newScript.textContent = scriptContent;
        }

        // Mark as processed to avoid re-processing
        newScript.dataset.buildixProcessed = "true";

        // Replace the old script with the new one to trigger execution
        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      } catch (error) {
        // Silently ignore script execution errors
        console.warn("[Buildix] Script execution skipped:", error);
        oldScript.dataset.buildixProcessed = "true";
      }
    });
  }, []);

  // Re-apply styles after doc.write() to ensure CSS is properly parsed
  const reApplyStyles = useCallback((doc: Document) => {
    // Re-process all style elements in the head
    const styles = doc.querySelectorAll("head style");
    styles.forEach((oldStyle) => {
      const newStyle = doc.createElement("style");

      // Copy all attributes
      Array.from(oldStyle.attributes).forEach((attr) => {
        newStyle.setAttribute(attr.name, attr.value);
      });

      // Copy content
      if (oldStyle.textContent) {
        newStyle.textContent = oldStyle.textContent;
      }

      // Replace to force re-parsing
      if (oldStyle.parentNode) {
        oldStyle.parentNode.replaceChild(newStyle, oldStyle);
      }
    });

    // Also re-process link stylesheets to trigger reload
    const links = doc.querySelectorAll('head link[rel="stylesheet"]');
    links.forEach((oldLink) => {
      const newLink = doc.createElement("link");

      // Copy all attributes
      Array.from(oldLink.attributes).forEach((attr) => {
        newLink.setAttribute(attr.name, attr.value);
      });

      // Replace to force reload
      if (oldLink.parentNode) {
        oldLink.parentNode.replaceChild(newLink, oldLink);
      }
    });
  }, []);

  // Track previous HTML to detect if we need full reload or just body update
  const prevHtmlRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  // Extract head and body from HTML
  const extractHtmlParts = useCallback((htmlContent: string) => {
    const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    // Also extract body attributes
    const bodyAttrMatch = htmlContent.match(/<body([^>]*)>/i);
    const bodyAttrs = bodyAttrMatch ? bodyAttrMatch[1] : "";

    return {
      head: headMatch ? headMatch[1] : "",
      body: bodyMatch ? bodyMatch[1] : htmlContent,
      bodyAttrs,
    };
  }, []);

  // Check if only body content changed (head is same)
  const onlyBodyChanged = useCallback((oldHtml: string, newHtml: string) => {
    const oldParts = extractHtmlParts(oldHtml);
    const newParts = extractHtmlParts(newHtml);
    return oldParts.head === newParts.head;
  }, [extractHtmlParts]);

  // Initialize iframe using srcdoc for cleaner updates
  // During streaming, use incremental body updates to avoid flicker
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;

    // During streaming: try to update just the body to avoid flicker
    if (isStreaming && isInitializedRef.current && doc?.body && prevHtmlRef.current) {
      // Check if we can do an incremental update (only body changed)
      if (onlyBodyChanged(prevHtmlRef.current, html)) {
        const { body: newBody } = extractHtmlParts(html);

        // Just update body innerHTML - no full reload = no flicker!
        doc.body.innerHTML = newBody;

        // For carousel/mobile-app, apply inline styles to ensure horizontal layout during streaming
        if (contentType === "instagram-carousel" || contentType === "mobile-app") {
          doc.body.style.cssText = "display: flex !important; gap: 2rem !important; overflow-x: auto !important; padding: 2rem !important; margin: 0 !important; background-color: #27272a !important; min-height: 100% !important; align-items: flex-start !important;";
        }

        prevHtmlRef.current = html;
        return;
      }
    }

    // Full reload needed (initial load, head changed, or not streaming)
    // For carousel/mobile-app during streaming, inject CSS to force horizontal layout
    let finalHtml = html;
    if (isStreaming && (contentType === "instagram-carousel" || contentType === "mobile-app") && html) {
      // Inject carousel layout CSS into the head to ensure horizontal display during streaming
      const carouselCss = `<style id="buildix-carousel-streaming">
        body {
          display: flex !important;
          gap: 2rem !important;
          overflow-x: auto !important;
          padding: 2rem !important;
          margin: 0 !important;
          background-color: #27272a !important;
          min-height: 100% !important;
          align-items: flex-start !important;
        }
      </style>`;

      // Insert before </head> if exists, otherwise before </html> or at the end
      if (html.includes('</head>')) {
        finalHtml = html.replace('</head>', carouselCss + '</head>');
      } else if (html.includes('<body')) {
        finalHtml = html.replace('<body', carouselCss + '<body');
      }
    }

    iframe.srcdoc = finalHtml;
    prevHtmlRef.current = html;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc || !doc.body) return;

      isInitializedRef.current = true;

      // Remove any Next.js dev tools elements that may have been injected
      try {
        const nextjsElements = doc.querySelectorAll('nextjs-portal, [id^="__next"], [data-nextjs]');
        nextjsElements.forEach(el => el.remove());

        // Also hide any text nodes that contain Next.js code (like the IIFE wrapper)
        if (doc.body) {
          const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
          const nodesToRemove: Node[] = [];
          while (walker.nextNode()) {
            const text = walker.currentNode.textContent || '';
            if (text.includes('nextjs-portal') || text.includes('__nextjs') || text.includes('nextServerDataCallback')) {
              nodesToRemove.push(walker.currentNode);
            }
          }
          nodesToRemove.forEach(node => node.parentNode?.removeChild(node));
        }
      } catch (e) {
        // Ignore cleanup errors
      }

      // Re-apply styles to ensure CSS is properly parsed
      reApplyStyles(doc);

      // NOTE: We no longer re-execute scripts as it causes issues with Next.js dev tools
      // Scripts in srcdoc execute automatically, and Tailwind CDN loads fine
      // The reExecuteScripts was causing "Unexpected token '<'" errors

      // Skip injection during streaming for better performance
      if (!isStreaming) {
        injectSelectionBehavior();
      }
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [html, injectSelectionBehavior, isStreaming, contentType, reApplyStyles, extractHtmlParts, onlyBodyChanged]);

  // Update selection styles when mode changes or streaming ends
  useEffect(() => {
    // Re-inject selection behavior when design mode is enabled or streaming ends
    if (isDesignMode) {
      injectSelectionBehavior();
    }
  }, [isDesignMode, isStreaming, injectSelectionBehavior]);

  // Update selected element highlight
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Clear previous selection and labels
    doc.querySelectorAll(".buildix-selected").forEach((el) => {
      el.classList.remove("buildix-selected");
    });
    // Remove ALL previous labels (use querySelectorAll to catch any duplicates)
    doc.querySelectorAll(".buildix-element-label").forEach(el => el.remove());
    // Also clean up any old spacing labels
    doc.querySelectorAll(".buildix-spacing-label").forEach(el => el.remove());
    // Clean up ALL action bars (use querySelectorAll to catch any duplicates)
    doc.querySelectorAll(".buildix-action-bar").forEach(el => el.remove());

    // Only show labels in Design mode
    if (!isDesignMode) {
      return; // Exit early - don't show anything in Preview mode
    }

    // Highlight selected element
    if (selectedElementId) {
      const element = doc.querySelector(
        `[data-buildix-id="${selectedElementId}"]`
      ) as HTMLElement;

      if (element) {
        element.classList.add("buildix-selected");

        const rect = element.getBoundingClientRect();
        const scrollTop = doc.documentElement.scrollTop;
        const scrollLeft = doc.documentElement.scrollLeft;

        // Add element label (uses absolute positioning)
        const label = doc.createElement("div");
        label.className = "buildix-element-label";
        label.textContent = element.tagName.toLowerCase();
        label.style.top = `${rect.top + scrollTop - 20}px`;
        label.style.left = `${rect.left + scrollLeft}px`;
        doc.body.appendChild(label);

        // Add action bar with + button below the selected element
        if (onAddContentAfter) {
          const actionBar = doc.createElement("div");
          actionBar.className = "buildix-action-bar";
          actionBar.style.top = `${rect.bottom + scrollTop + 8}px`;
          actionBar.style.left = `${rect.left + scrollLeft + (rect.width / 2) - 16}px`;

          const addBtn = doc.createElement("button");
          addBtn.className = "buildix-action-btn";
          addBtn.innerHTML = "+";
          addBtn.title = "Add content after this element";
          addBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Clean outerHTML from buildix classes/attributes before sending
            const cleanHtml = element.outerHTML
              .replace(/\s*data-buildix-id="[^"]*"/g, "")
              .replace(/\s*class="([^"]*)"/g, (match, classes) => {
                const cleaned = classes.replace(/buildix-[\w-]+/g, "").trim();
                return cleaned ? ` class="${cleaned}"` : "";
              });
            onAddContentAfter({
              elementId: selectedElementId,
              elementHtml: cleanHtml,
            });
          };

          actionBar.appendChild(addBtn);
          doc.body.appendChild(actionBar);
        }

        // Spacing values are shown in the Properties panel instead of on-canvas badges
      }
    }
  }, [selectedElementId, isDesignMode, onAddContentAfter, contentType]);

  // Keyboard listener for Delete/Backspace to delete selected element
  useEffect(() => {
    if (!isDesignMode || !selectedElementId || !onDeleteElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace was pressed
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't delete if focus is in an input, textarea, or contenteditable
        const activeElement = document.activeElement;
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute("contenteditable") === "true"
        ) {
          return;
        }

        // Also check inside the iframe
        const iframe = iframeRef.current;
        if (iframe?.contentDocument) {
          const iframeActiveElement = iframe.contentDocument.activeElement;
          if (
            iframeActiveElement instanceof HTMLInputElement ||
            iframeActiveElement instanceof HTMLTextAreaElement ||
            iframeActiveElement?.getAttribute("contenteditable") === "true"
          ) {
            return;
          }
        }

        e.preventDefault();
        onDeleteElement();
      }
    };

    // Listen on both the main document and the iframe
    document.addEventListener("keydown", handleKeyDown);

    const iframe = iframeRef.current;
    if (iframe?.contentDocument) {
      iframe.contentDocument.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (iframe?.contentDocument) {
        iframe.contentDocument.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [isDesignMode, selectedElementId, onDeleteElement]);

  // Get iframe dimensions based on content type and device mode
  const getIframeDimensions = () => {
    switch (contentType) {
      case "instagram-post":
        return { width: "1080px", height: "1080px", minHeight: "1080px" };
      case "instagram-carousel":
        // Width is auto for horizontal scroll, height includes body padding (p-8 = 32px top + bottom)
        // Max 10 slides: 10 × 1080px + 9 × 32px (gap-8) + 64px (p-8 padding) = 11152px
        return { width: "auto", height: "1414px", minHeight: "1414px", minWidth: "11200px" }; // 1350 + 64 padding
      case "instagram-story":
        return { width: "1080px", height: "1920px", minHeight: "1920px" };
      case "mobile-app":
        // Similar to carousel - horizontal scroll with multiple screens
        // Max 10 screens: 10 × 390px + 9 × 32px (gap-8) + 64px (p-8 padding) = 4252px
        return { width: "auto", height: "908px", minHeight: "908px", minWidth: "4300px" }; // 844 + 64 padding
      case "dashboard":
        return { width: "1440px", height: "900px", minHeight: "900px" };
      case "email-template":
        return { width: "600px", height: "auto", minHeight: "800px" };
      default:
        // For landing pages, respect deviceMode
        const deviceWidths = {
          desktop: "100%",
          tablet: "768px",
          mobile: "375px",
        };
        return { width: deviceWidths[deviceMode], height: "100%", minHeight: "600px" };
    }
  };

  const dimensions = getIframeDimensions();
  const isInstagramContent = contentType !== "landing";

  return (
    <iframe
      ref={iframeRef}
      className={cn(
        "border-0",
        isDesignMode && "pointer-events-auto",
        isInstagramContent ? "bg-transparent" : "bg-white h-full w-full"
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        minHeight: dimensions.minHeight,
        minWidth: (dimensions as { minWidth?: string }).minWidth,
      }}
      title="Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
