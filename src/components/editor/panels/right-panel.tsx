"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  PanelRightClose,
  PanelRight,
  Pencil,
  Wand2,
  Code,
  Link,
  Square,
  ChevronDown,
  Sparkles,
  Copy,
  Check,
  Type,
  FileText,
  AtSign,
  Paperclip,
  X,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/uiStore";
import { useEditorStore, type SelectedElementData } from "@/stores/editorStore";
import { Plus } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { useAITerms } from "@/hooks/useAITerms";
import { useProject } from "@/hooks/useProject";
import { cn, getPreviewIframe } from "@/lib/utils";
import { CodeSnippetsModal } from "@/components/editor/modals/CodeSnippetsModal";
import { AITermsModal } from "@/components/editor/ai-terms-modal";
import { SnippetTag } from "@/components/editor/chat/SnippetTag";
import { ComponentTag } from "@/components/editor/chat/ComponentTag";
import { TemplateTag } from "@/components/editor/chat/TemplateTag";
import { PromptBuilder } from "@/components/prompt/prompt-builder";
import type { CodeSnippet, SelectedSnippet } from "@/lib/code-snippets";
import type { UIComponent, SelectedComponent } from "@/lib/ui-components";
import type { TemplateWithAuthor } from "@/types/community";

interface SelectedTemplate {
  id: string;
  slug: string;
  title: string;
}
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  SpacingSection,
  SizeSection,
  TypographySection,
  BackgroundSection,
  BackgroundAssetSection,
  BorderSection,
  PositionSection,
  EffectsSection,
  TransformsSection,
  IconSection,
  CanvasModeSection,
} from "./property-sections";
import { useCanvasModeStore } from "@/stores/canvasModeStore";
import { extractDesignContext, designContextToPrompt, getDesignSummary } from "@/lib/design-context";
import { getActiveProperties, hasSectionActiveProperties, SECTION_PROPERTIES } from "@/lib/style-defaults";

type TabType = "edit" | "prompt" | "code";

const elementTypes = [
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "p", label: "Paragraph" },
  { value: "div", label: "Div" },
  { value: "span", label: "Span" },
  { value: "button", label: "Button" },
  { value: "a", label: "Link" },
  { value: "section", label: "Section" },
  { value: "article", label: "Article" },
  { value: "nav", label: "Navigation" },
  { value: "header", label: "Header" },
  { value: "footer", label: "Footer" },
  { value: "img", label: "Image" },
];

// Helper function to clean buildix attributes from HTML for AI editing
// This is necessary because the iframe adds buildix-* attributes to elements
// but the htmlContent in the store doesn't have them
function cleanBuildixAttributesForAI(html: string): string {
  // Remove data-buildix-id attribute
  let cleaned = html.replace(/\s*data-buildix-id="[^"]*"/gi, "");

  // Remove buildix-* classes but keep other classes
  cleaned = cleaned.replace(/class="([^"]*)"/gi, (match, classes) => {
    const cleanedClasses = (classes as string)
      .split(/\s+/)
      .filter((c: string) => !c.startsWith("buildix-"))
      .join(" ")
      .trim();
    return cleanedClasses ? `class="${cleanedClasses}"` : "";
  });

  // Clean up empty class attributes
  cleaned = cleaned.replace(/\s*class=""\s*/g, " ");

  // Normalize whitespace (but preserve newlines for multi-line HTML)
  cleaned = cleaned.replace(/[ \t]+/g, " ");

  // Trim the result
  cleaned = cleaned.trim();

  return cleaned;
}

interface RightPanelProps {
  projectId?: string;
}

export function RightPanel({ projectId }: RightPanelProps) {
  const { rightPanelOpen, rightPanelWidth, togglePanel } = useUIStore();
  const { selectedElementId, selectedElementData, viewMode, isGenerating, htmlContent, setHtmlContent, currentPage, insertAfterMode, insertAfterElementId, insertAfterElementHtml, setInsertAfterMode, deleteSelectedElement } = useEditorStore();
  const { isOpen: canvasModeOpen } = useCanvasModeStore();
  const { generate } = useAI();
  const { checkTerms, showTermsModal, handleTermsAccept } = useAITerms();
  const { savePage } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>("edit");
  const [prompt, setPrompt] = useState("");

  // Auto-switch to AI Edit tab when insert mode is activated
  useEffect(() => {
    if (insertAfterMode) {
      setActiveTab("prompt");
    }
  }, [insertAfterMode]);

  const handleApplyAIChanges = useCallback(async (options: {
    model: "gemini" | "claude";
    snippets: SelectedSnippet[];
    components: SelectedComponent[];
    referenceImage: { data: string; mimeType: string } | null;
  }) => {
    // Check for insert after mode
    const isInsertMode = insertAfterMode && insertAfterElementId && insertAfterElementHtml;

    // For insert mode, we don't need selectedElementData
    if (!prompt.trim() || isGenerating) return;
    if (!isInsertMode && !selectedElementData) return;

    // Check if user has accepted AI terms (required for paid plans)
    const canProceed = await checkTerms();
    if (!canProceed) {
      // Modal will be shown by the hook
      return;
    }

    // Build context from snippets and components
    let contextCode = "";
    // Check if we have components OR snippets with styles that need to be injected
    const hasComponentsOrSnippetsWithStyles = options.components.length > 0 || options.snippets.length > 0;

    // Fetch snippets code if selected (all snippets come from database now)
    if (options.snippets.length > 0) {
      try {
        const snippetCodes: string[] = [];

        for (const s of options.snippets) {
          console.log("[AI Edit] Fetching snippet from API:", s.id);
          try {
            const response = await fetch(`/api/snippets/${s.id}`);
            if (response.ok) {
              const data = await response.json();
              if (data.snippet) {
                snippetCodes.push(`/* ${data.snippet.name} */\n${data.snippet.code}`);
                console.log("[AI Edit] Snippet code added to context:", data.snippet.name);
              }
            } else {
              console.warn("[AI Edit] Snippet not found in database:", s.id);
            }
          } catch (apiError) {
            console.error("[AI Edit] Failed to fetch snippet from API:", s.id, apiError);
          }
        }

        if (snippetCodes.length > 0) {
          contextCode += `\n\n--- CODE SNIPPETS TO USE (INCLUDE ALL CSS AND JS) ---\n${snippetCodes.join("\n\n")}\n--- END CODE SNIPPETS ---`;
        }
      } catch (e) {
        console.error("Failed to load snippets:", e);
      }
    }

    // Fetch components code if selected (all components come from database now)
    if (options.components.length > 0) {
      try {
        const componentCodes: string[] = [];

        for (const c of options.components) {
          console.log("[AI Edit] Fetching component from API:", c.id);
          try {
            const response = await fetch(`/api/components/${c.id}`);
            if (response.ok) {
              const data = await response.json();
              if (data.component) {
                componentCodes.push(`--- COMPONENT: ${data.component.name} ---\n${data.component.code}\n--- END COMPONENT ---`);
                console.log("[AI Edit] Component code added to context:", data.component.name);
              }
            } else {
              console.warn("[AI Edit] Component not found in database:", c.id);
            }
          } catch (apiError) {
            console.error("[AI Edit] Failed to fetch component from API:", c.id, apiError);
          }
        }

        if (componentCodes.length > 0) {
          contextCode += `\n\n${componentCodes.join("\n\n")}`;
        }
      } catch (e) {
        console.error("Failed to load components:", e);
      }
    }

    // Extract design context from current page HTML
    const designContext = extractDesignContext(htmlContent);
    const designContextPrompt = designContextToPrompt(designContext);
    console.log("[AI Edit] Design context:", getDesignSummary(designContext));

    // Build enhanced prompt with context and design system
    // Let the AI decide based on user's prompt whether to apply styles, replace, or add
    const enhancedPrompt = hasComponentsOrSnippetsWithStyles
      ? `${prompt}\n\nHere is the component/snippet to use:\n${contextCode}\n\nIMPORTANT: Include ALL the CSS (@keyframes, custom classes, ::before/::after, hover effects) in your response.\n\n${designContextPrompt}`
      : `${prompt}\n\n${designContextPrompt}`;

    // Clean the outerHTML from buildix attributes before sending to AI
    const elementHtmlForAI = isInsertMode
      ? cleanBuildixAttributesForAI(insertAfterElementHtml!)
      : cleanBuildixAttributesForAI(selectedElementData!.outerHTML);

    // Determine the type based on mode and whether we have components/snippets
    const generationType = isInsertMode
      ? "insertAfter"
      : options.referenceImage
        ? "image-reference"
        : hasComponentsOrSnippetsWithStyles
          ? "editing-with-component"
          : "editing";

    console.log("[AI Edit] Starting edit with type:", generationType);
    console.log("[AI Edit] Is insert mode:", isInsertMode);
    console.log("[AI Edit] Has components/snippets with styles:", hasComponentsOrSnippetsWithStyles);
    console.log("[AI Edit] Element HTML for AI:", elementHtmlForAI);

    const result = await generate({
      prompt: enhancedPrompt,
      model: options.model,
      type: generationType,
      elementHtml: elementHtmlForAI,
      referenceImage: options.referenceImage || undefined,
    });

    console.log("[AI Edit] Result from AI:", result);
    console.log("[AI Edit] Result length:", result?.length || 0);

    if (result) {
      let processedResult = result;

      // Validate that AI didn't return a full page
      if (processedResult.includes('<!DOCTYPE') || processedResult.includes('<html') || processedResult.includes('<head>') || processedResult.includes('<body')) {
        console.warn("[AI Edit] AI returned a full page instead of just an element. Attempting to extract element...");

        // Try to extract just the body content
        const bodyMatch = processedResult.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch && bodyMatch[1]) {
          processedResult = bodyMatch[1].trim();
          console.log("[AI Edit] Extracted body content, new length:", processedResult.length);
        } else {
          console.error("[AI Edit] Could not extract body content from full page response");
          return;
        }
      }

      // Extract styles and scripts from the result (for components/snippets)
      const stylesMatch = processedResult.match(/<!-- INJECT_STYLES_START -->([\s\S]*?)<!-- INJECT_STYLES_END -->/);
      const scriptsMatch = processedResult.match(/<!-- INJECT_SCRIPTS_START -->([\s\S]*?)<!-- INJECT_SCRIPTS_END -->/);

      // Remove the markers from the element replacement
      let elementReplacement = processedResult
        .replace(/<!-- INJECT_STYLES_START -->[\s\S]*?<!-- INJECT_STYLES_END -->/g, '')
        .replace(/<!-- INJECT_SCRIPTS_START -->[\s\S]*?<!-- INJECT_SCRIPTS_END -->/g, '')
        .trim();

      // NEW APPROACH: Manipulate the iframe DOM directly
      // This is more reliable than string manipulation
      const iframe = getPreviewIframe();
      if (!iframe?.contentDocument) {
        console.error("[AI Edit] Could not access iframe");
        return;
      }

      const doc = iframe.contentDocument;

      // For insert mode, use the insertAfterElementId; otherwise use selectedElementData
      const targetElementId = isInsertMode ? insertAfterElementId : selectedElementData!.id;
      const targetElement = doc.querySelector(`[data-buildix-id="${targetElementId}"]`);

      if (!targetElement) {
        console.error("[AI Edit] Element not found in iframe by data-buildix-id:", targetElementId);
        return;
      }

      console.log("[AI Edit] Found target element in iframe:", targetElement.tagName);
      console.log("[AI Edit] Mode:", isInsertMode ? "INSERT AFTER" : "REPLACE");

      // Inject styles into the <head> of the iframe
      if (stylesMatch && stylesMatch[1]) {
        let stylesToInject = stylesMatch[1].trim();

        // Extract only the CSS content (remove <style> tags if present)
        const cssMatch = stylesToInject.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (cssMatch && cssMatch[1]) {
          stylesToInject = cssMatch[1].trim();
        }

        // Only inject if there's actual content
        if (stylesToInject && stylesToInject.length > 0) {
          console.log("[AI Edit] Injecting styles into iframe head:", stylesToInject.substring(0, 200) + "...");

          // Create a style element with a unique ID to avoid duplicates
          const styleId = `buildix-injected-style-${Date.now()}`;
          const styleEl = doc.createElement('style');
          styleEl.id = styleId;
          styleEl.textContent = stylesToInject;
          doc.head.appendChild(styleEl);
          console.log("[AI Edit] Styles injected successfully");
        }
      }

      // Inject scripts into the iframe body
      if (scriptsMatch && scriptsMatch[1]) {
        let scriptsToInject = scriptsMatch[1].trim();

        // Extract only the JS content (remove <script> tags if present)
        const jsMatch = scriptsToInject.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (jsMatch && jsMatch[1]) {
          scriptsToInject = jsMatch[1].trim();
        }

        // Only inject if there's actual content (not empty)
        if (scriptsToInject && scriptsToInject.length > 0) {
          console.log("[AI Edit] Injecting scripts into iframe:", scriptsToInject.substring(0, 200) + "...");

          const scriptEl = doc.createElement('script');
          scriptEl.textContent = scriptsToInject;
          doc.body.appendChild(scriptEl);
          console.log("[AI Edit] Scripts injected successfully");
        }
      }

      // Create a temporary element to parse the replacement HTML
      const temp = doc.createElement('div');
      temp.innerHTML = elementReplacement;
      const newElement = temp.firstElementChild;

      if (newElement) {
        if (isInsertMode) {
          // INSERT MODE: Insert the new element AFTER the target element
          // Generate a new unique ID for the inserted element
          const newId = `inserted-${Date.now()}`;
          newElement.setAttribute('data-buildix-id', newId);

          // Insert after the target element
          targetElement.insertAdjacentElement('afterend', newElement);
          console.log("[AI Edit] Element inserted after target successfully");

          // Clear the insert mode
          setInsertAfterMode(false);
        } else {
          // REPLACE MODE: Replace the target element with the new element
          // Copy the data-buildix-id to the new element so it can be selected again
          newElement.setAttribute('data-buildix-id', selectedElementData!.id);

          // Replace the target element with the new element
          targetElement.replaceWith(newElement);
          console.log("[AI Edit] Element replaced in iframe successfully");
        }

        // Now extract the clean HTML from the iframe and save it
        // Clone the document and remove buildix attributes
        const bodyClone = doc.body.cloneNode(true) as HTMLElement;

        // Remove all buildix attributes and classes
        bodyClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
          el.removeAttribute("data-buildix-id");
          const currentClass = el.getAttribute("class") || "";
          const cleanedClasses = currentClass
            .split(/\s+/)
            .filter((c) => !c.startsWith("buildix-"))
            .join(" ")
            .trim();
          if (cleanedClasses) {
            el.setAttribute("class", cleanedClasses);
          } else {
            el.removeAttribute("class");
          }
        });

        // Remove buildix style tags and labels
        bodyClone.querySelectorAll("#buildix-selection-styles, .buildix-element-label, .buildix-spacing-label").forEach((el) => el.remove());

        // Get the full HTML document
        const htmlEl = doc.documentElement.cloneNode(true) as HTMLElement;
        const bodyInHtml = htmlEl.querySelector("body");
        if (bodyInHtml) {
          bodyInHtml.innerHTML = bodyClone.innerHTML;
        }

        // Remove buildix style from head too
        htmlEl.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());

        const newHtml = htmlEl.outerHTML;
        console.log("[AI Edit] Extracted clean HTML, length:", newHtml.length);

        // Update the store
        setHtmlContent(newHtml);
        setPrompt("");

        // Save to database
        if (projectId && currentPage?.id) {
          await savePage(projectId, currentPage.id, newHtml);
          console.log("[AI Edit] Saved to database successfully");
        }
      } else {
        console.error("[AI Edit] Could not parse replacement HTML:", elementReplacement.substring(0, 200));
      }
    } else {
      console.error("[AI Edit] No result returned from AI");
    }
  }, [prompt, selectedElementData, isGenerating, generate, setHtmlContent, projectId, currentPage?.id, savePage, insertAfterMode, insertAfterElementId, insertAfterElementHtml, setInsertAfterMode, htmlContent, checkTerms]);

  if (!rightPanelOpen) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-l bg-card py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => togglePanel("right")}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Show Properties Panel</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      className="flex h-full flex-col border-l bg-card"
      style={{ width: rightPanelWidth }}
    >
      {/* Panel Header */}
      <div className="flex h-10 items-center justify-between border-b px-3">
        <span className="text-sm font-medium">
          {canvasModeOpen ? (
            "Canvas Mode"
          ) : selectedElementData ? (
            <span className="flex items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">
                {selectedElementData.tagName}
              </code>
              Properties
            </span>
          ) : (
            "Properties"
          )}
        </span>
        <div className="flex items-center gap-1">
          {/* Delete Button - only show when element is selected */}
          {selectedElementData && !canvasModeOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    const deleted = deleteSelectedElement();
                    if (deleted) {
                      console.log("[RightPanel] Element deleted successfully");
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Element (Del)</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => togglePanel("right")}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hide Panel</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Canvas Mode Section - shown when canvas mode is open */}
      {canvasModeOpen && (
        <ScrollArea className="flex-1">
          <CanvasModeSection />
        </ScrollArea>
      )}

      {/* No Selection State - only show when canvas mode is NOT open */}
      {!canvasModeOpen && !selectedElementData ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Square className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-medium">No Element Selected</h3>
          <p className="text-sm text-muted-foreground">
            Switch to Design mode and click on an element to view and edit its properties.
          </p>
          {viewMode !== "design" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => useEditorStore.getState().setViewMode("design")}
            >
              Switch to Design Mode
            </Button>
          )}
        </div>
      ) : !canvasModeOpen && selectedElementData ? (
        <>
          {/* Tabs */}
          <div className="flex border-b">
            <TabButton
              active={activeTab === "edit"}
              onClick={() => setActiveTab("edit")}
              icon={Pencil}
              label="Edit"
            />
            <TabButton
              active={activeTab === "prompt"}
              onClick={() => setActiveTab("prompt")}
              icon={Wand2}
              label="AI Edit"
            />
            <TabButton
              active={activeTab === "code"}
              onClick={() => setActiveTab("code")}
              icon={Code}
              label="Code"
            />
          </div>

          {/* Tab Content */}
          <ScrollArea className="flex-1">
            {activeTab === "edit" && (
              <EditTab
                element={selectedElementData}
                projectId={projectId}
                currentPageId={currentPage?.id}
                savePage={savePage}
              />
            )}
            {activeTab === "prompt" && (
              <PromptTab
                element={selectedElementData}
                prompt={prompt}
                setPrompt={setPrompt}
                isGenerating={isGenerating}
                onApply={handleApplyAIChanges}
                insertAfterMode={insertAfterMode}
                insertAfterElementHtml={insertAfterElementHtml}
                onCancelInsertMode={() => setInsertAfterMode(false)}
              />
            )}
            {activeTab === "code" && (
              <CodeTab element={selectedElementData} />
            )}
          </ScrollArea>
        </>
      ) : null}

      {/* AI Terms Modal - appears for paid plans on first AI use */}
      <AITermsModal
        open={showTermsModal}
        onAccept={handleTermsAccept}
      />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-sm font-medium transition-colors",
        active
          ? "border-[hsl(var(--buildix-primary))] text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// Helper function to extract and normalize font-family
// Handles cases like "'Playfair Display', serif" → "Playfair Display"
function extractPrimaryFont(fontFamily: string): string {
  if (!fontFamily || fontFamily === "inherit" || fontFamily === "initial") {
    return fontFamily || "";
  }

  // Split by comma and clean each font name
  const fonts = fontFamily.split(",").map(f =>
    f.trim().replace(/^['"]|['"]$/g, "") // Remove quotes
  );

  // Generic fonts that should be kept as-is if they're the only option
  const genericFonts = ["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace"];

  // Find the first non-generic font
  const primaryFont = fonts.find(f => !genericFonts.includes(f.toLowerCase()));

  // Return primary font, or the first font in the list, or empty string
  return primaryFont || fonts[0] || "";
}

// Parse computed styles from element data
function parseStyles(element: SelectedElementData) {
  const styles = element.computedStyles || {};

  const parseBoxSpacing = (prefix: string) => ({
    top: styles[`${prefix}Top`] || "0px",
    right: styles[`${prefix}Right`] || "0px",
    bottom: styles[`${prefix}Bottom`] || "0px",
    left: styles[`${prefix}Left`] || "0px",
  });

  // Extract and normalize font family
  const normalizedFontFamily = extractPrimaryFont(styles.fontFamily || "");

  return {
    // Spacing
    margin: parseBoxSpacing("margin"),
    padding: parseBoxSpacing("padding"),

    // Size
    width: styles.width || "auto",
    height: styles.height || "auto",
    minWidth: styles.minWidth || "auto",
    maxWidth: styles.maxWidth || "none",
    minHeight: styles.minHeight || "auto",
    maxHeight: styles.maxHeight || "none",

    // Typography
    fontFamily: normalizedFontFamily,
    fontSize: styles.fontSize || "16px",
    fontWeight: styles.fontWeight || "400",
    lineHeight: styles.lineHeight || "normal",
    letterSpacing: styles.letterSpacing || "normal",
    textAlign: styles.textAlign || "left",
    color: styles.color || "#000000",

    // Background
    backgroundColor: styles.backgroundColor || "transparent",
    backgroundImage: styles.backgroundImage || "",
    backgroundSize: styles.backgroundSize || "auto",
    backgroundPosition: styles.backgroundPosition || "0% 0%",

    // Border - check individual sides first, then general border
    borderWidth: styles.borderWidth || styles.borderTopWidth || styles.borderBottomWidth || styles.borderLeftWidth || styles.borderRightWidth || "0px",
    borderStyle: styles.borderStyle || styles.borderTopStyle || styles.borderBottomStyle || styles.borderLeftStyle || styles.borderRightStyle || "none",
    borderColor: styles.borderColor || styles.borderTopColor || styles.borderBottomColor || styles.borderLeftColor || styles.borderRightColor || "transparent",
    borderRadius: styles.borderRadius || styles.borderTopLeftRadius || "0px",
    // Individual border sides
    borderTopWidth: styles.borderTopWidth || "",
    borderBottomWidth: styles.borderBottomWidth || "",
    borderLeftWidth: styles.borderLeftWidth || "",
    borderRightWidth: styles.borderRightWidth || "",
    borderTopStyle: styles.borderTopStyle || "",
    borderBottomStyle: styles.borderBottomStyle || "",
    borderLeftStyle: styles.borderLeftStyle || "",
    borderRightStyle: styles.borderRightStyle || "",
    borderTopColor: styles.borderTopColor || "",
    borderBottomColor: styles.borderBottomColor || "",
    borderLeftColor: styles.borderLeftColor || "",
    borderRightColor: styles.borderRightColor || "",

    // Position
    position: styles.position || "static",
    top: styles.top || "auto",
    right: styles.right || "auto",
    bottom: styles.bottom || "auto",
    left: styles.left || "auto",
    zIndex: styles.zIndex || "auto",

    // Effects
    opacity: styles.opacity || "1",
    boxShadow: styles.boxShadow || "none",
    filter: styles.filter || "none",
    backdropFilter: styles.backdropFilter || "none",
    mixBlendMode: styles.mixBlendMode || "normal",
    cursor: styles.cursor || "auto",
    overflow: styles.overflow || "visible",
    visibility: styles.visibility || "visible",

    // Transforms
    transform: styles.transform || "none",
    transformOrigin: styles.transformOrigin || "50% 50% 0px",
    perspective: styles.perspective || "none",

    // Object (for IMG elements)
    objectFit: styles.objectFit || "cover",
    objectPosition: styles.objectPosition || "center",
  };
}

// Helper function to apply styles in real-time to the canvas iframe
// Works with both normal mode (title="Preview") and Canvas Mode (title="Preview - Desktop 1" etc)
function applyLiveStyleToCanvas(elementId: string, cssProperty: string, value: string) {
  const iframe = getPreviewIframe();
  if (!iframe?.contentDocument) return;

  const targetElement = iframe.contentDocument.querySelector(
    `[data-buildix-id="${elementId}"]`
  ) as HTMLElement;

  if (targetElement) {
    // Special handling for text color with gradients
    if (cssProperty === "color") {
      const isGradient = value.includes("gradient");

      if (isGradient) {
        // Apply text gradient technique: background-clip text
        targetElement.style.setProperty("background", value);
        targetElement.style.setProperty("-webkit-background-clip", "text");
        targetElement.style.setProperty("background-clip", "text");
        targetElement.style.setProperty("-webkit-text-fill-color", "transparent");
        targetElement.style.setProperty("color", "transparent");
      } else {
        // Solid color - reset gradient properties and apply color normally
        targetElement.style.removeProperty("background");
        targetElement.style.removeProperty("-webkit-background-clip");
        targetElement.style.removeProperty("background-clip");
        targetElement.style.removeProperty("-webkit-text-fill-color");
        targetElement.style.setProperty("color", value);
      }
    } else {
      // If value is empty, remove the property; otherwise set it
      if (value === "" || value === undefined || value === null) {
        targetElement.style.removeProperty(cssProperty);
      } else {
        targetElement.style.setProperty(cssProperty, value);
      }
    }
  }
}

interface EditTabProps {
  element: SelectedElementData;
  projectId?: string;
  currentPageId?: string;
  savePage: (projectId: string, pageId: string, htmlContent: string, cssContent?: string) => Promise<unknown>;
}

// Helper function to find and replace element in HTML using a more robust approach
function findElementInHtml(html: string, tagName: string, textContent: string, classes: string): { start: number; end: number; match: string } | null {
  // Try to find the element by matching tag name and content
  const tagRegex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gi');
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const innerContent = match[1];

    // Check if text content roughly matches (ignoring extra whitespace)
    const normalizedContent = innerContent.replace(/\s+/g, ' ').trim();
    const normalizedTarget = textContent.replace(/\s+/g, ' ').trim();

    // Check if classes match (if classes are provided)
    if (classes) {
      const classMatch = fullMatch.match(/class="([^"]*)"/);
      if (classMatch) {
        const htmlClasses = classMatch[1].split(/\s+/).sort().join(' ');
        const targetClasses = classes.split(/\s+/).filter(c => !c.startsWith('buildix-')).sort().join(' ');
        if (htmlClasses === targetClasses || normalizedContent.includes(normalizedTarget.substring(0, 50))) {
          return { start: match.index, end: match.index + fullMatch.length, match: fullMatch };
        }
      }
    }

    // Fallback: if content matches well enough
    if (normalizedContent === normalizedTarget ||
        (normalizedTarget.length > 10 && normalizedContent.includes(normalizedTarget.substring(0, Math.min(50, normalizedTarget.length))))) {
      return { start: match.index, end: match.index + fullMatch.length, match: fullMatch };
    }
  }

  return null;
}

// Helper function to clean buildix attributes from HTML string
function cleanBuildixAttributes(html: string): string {
  // Remove data-buildix-id attribute
  let cleaned = html.replace(/\s*data-buildix-id="[^"]*"/g, "");
  // Remove buildix-* classes but keep other classes
  cleaned = cleaned.replace(/class="([^"]*)"/g, (match, classes) => {
    const cleanedClasses = classes
      .split(/\s+/)
      .filter((c: string) => !c.startsWith("buildix-"))
      .join(" ")
      .trim();
    return cleanedClasses ? `class="${cleanedClasses}"` : "";
  });
  // Clean up empty class attributes
  cleaned = cleaned.replace(/\s*class=""\s*/g, " ");
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned.trim();
}

function EditTab({ element, projectId, currentPageId, savePage }: EditTabProps) {
  const { htmlContent, setHtmlContent, addToHistory } = useEditorStore();
  const [textContent, setTextContent] = useState(element.textContent);
  const [classes, setClasses] = useState(element.classes);
  const [elementId, setElementId] = useState(element.elementId);

  // Store the original outerHTML (cleaned of buildix attributes) for replacement
  const [originalOuterHTML, setOriginalOuterHTML] = useState(() => cleanBuildixAttributes(element.outerHTML));

  // Parse styles from element
  const styles = useMemo(() => parseStyles(element), [element]);

  // Compute active properties (which properties are explicitly set vs defaults)
  const activeProperties = useMemo(() => {
    const inlineStyles = element.inlineStyles || {};
    const computedStyles = element.computedStyles || {};

    // List all CSS properties we care about
    const allProperties = [
      // Spacing
      "marginTop", "marginRight", "marginBottom", "marginLeft",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
      // Size
      "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
      // Typography
      "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "color",
      // Background
      "backgroundColor", "backgroundImage", "backgroundSize", "backgroundPosition",
      // Border
      "borderWidth", "borderStyle", "borderColor", "borderRadius",
      "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      // Position
      "position", "top", "right", "bottom", "left", "zIndex",
      // Effects
      "opacity", "boxShadow", "filter", "backdropFilter", "mixBlendMode", "cursor", "overflow", "visibility",
      // Transforms
      "transform", "transformOrigin", "perspective",
    ];

    return getActiveProperties(allProperties, computedStyles, inlineStyles);
  }, [element]);

  // Calculate which sections have active properties (for auto-expand)
  const sectionHasActive = useMemo(() => {
    return {
      spacing: hasSectionActiveProperties(SECTION_PROPERTIES.spacing, activeProperties),
      size: hasSectionActiveProperties(SECTION_PROPERTIES.size, activeProperties),
      typography: hasSectionActiveProperties(SECTION_PROPERTIES.typography, activeProperties),
      background: hasSectionActiveProperties(SECTION_PROPERTIES.background, activeProperties),
      border: hasSectionActiveProperties(SECTION_PROPERTIES.border, activeProperties),
      position: hasSectionActiveProperties(SECTION_PROPERTIES.position, activeProperties),
      effects: hasSectionActiveProperties(SECTION_PROPERTIES.effects, activeProperties),
      transforms: hasSectionActiveProperties(SECTION_PROPERTIES.transforms, activeProperties),
    };
  }, [activeProperties]);

  // State for all style properties
  const [styleState, setStyleState] = useState(styles);

  // Check element type
  const tagLower = element.tagName.toLowerCase();
  const isImageElement = tagLower === "img";

  // IMG element state
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (!isImageElement) return "";
    return element.attributes.src || "";
  });
  const [imageAlt, setImageAlt] = useState<string>(() => {
    if (!isImageElement) return "";
    return element.attributes.alt || "";
  });

  // Icon state (for SVG elements and iconify-icon)
  // Check if element is SVG, an SVG child element (path, circle, rect, etc.), or iconify-icon
  const svgChildElements = ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "g", "use", "text", "tspan", "defs", "symbol", "clippath", "mask", "pattern", "image", "switch", "foreignobject"];
  const isIconifyIcon = tagLower === "iconify-icon";
  const isSvgElement = tagLower === "svg" || svgChildElements.includes(tagLower) || element.outerHTML.trim().startsWith("<svg") || isIconifyIcon;

  // For iconify-icon, we need to extract the icon name to display a preview
  const [iconifyIconName, setIconifyIconName] = useState(() => {
    if (!isIconifyIcon) return "";
    const iconMatch = element.outerHTML.match(/icon="([^"]+)"/);
    return iconMatch ? iconMatch[1] : "";
  });

  // For iconify-icon, we'll store the outerHTML but it will be replaced with SVG when user selects a new icon
  const [iconSvg, setIconSvg] = useState(isSvgElement ? element.outerHTML : "");
  const [iconColor, setIconColor] = useState(() => {
    if (!isSvgElement) return "currentColor";
    const html = element.outerHTML;

    console.log('[RightPanel] Extracting icon color from SVG/Icon:', html.substring(0, 300));
    console.log('[RightPanel] computedStyles:', element.computedStyles);

    // For iconify-icon, check the style or computed color
    if (isIconifyIcon) {
      // Check inline style color
      const styleColorMatch = html.match(/style="[^"]*color:\s*([^;"]+)/);
      if (styleColorMatch) return styleColorMatch[1].trim();

      // Check computed color
      if (element.computedStyles?.color && element.computedStyles.color !== "rgb(0, 0, 0)") {
        return element.computedStyles.color;
      }
      return "currentColor";
    }

    // For Lucide icons, stroke is the primary color attribute
    // Check stroke first (most common for line icons)
    const strokeMatch = html.match(/stroke="([^"]+)"/);
    console.log('[RightPanel] strokeMatch:', strokeMatch?.[1]);

    // If stroke is "currentColor", we need to get the actual computed color
    if (strokeMatch && strokeMatch[1] === "currentColor") {
      // Get computed color from styles
      const computedColor = element.computedStyles?.color;
      console.log('[RightPanel] stroke is currentColor, using computed color:', computedColor);
      if (computedColor && computedColor !== "rgb(0, 0, 0)") {
        return computedColor;
      }
      // Keep currentColor if we can't determine the actual color
      return "currentColor";
    }

    if (strokeMatch && strokeMatch[1] !== "none" && strokeMatch[1] !== "transparent") {
      return strokeMatch[1];
    }

    // Then check fill (for solid icons)
    const fillMatch = html.match(/fill="([^"]+)"/);
    console.log('[RightPanel] fillMatch:', fillMatch?.[1]);

    // If fill is "currentColor", we need to get the actual computed color
    if (fillMatch && fillMatch[1] === "currentColor") {
      const computedColor = element.computedStyles?.color;
      console.log('[RightPanel] fill is currentColor, using computed color:', computedColor);
      if (computedColor && computedColor !== "rgb(0, 0, 0)") {
        return computedColor;
      }
      return "currentColor";
    }

    if (fillMatch && fillMatch[1] !== "none" && fillMatch[1] !== "transparent") {
      return fillMatch[1];
    }

    // Check color attribute
    const colorMatch = html.match(/\scolor="([^"]+)"/);
    console.log('[RightPanel] colorMatch:', colorMatch?.[1]);
    if (colorMatch && colorMatch[1] !== "none" && colorMatch[1] !== "transparent") {
      return colorMatch[1];
    }

    // Check computed style color if available
    console.log('[RightPanel] computedStyles.color:', element.computedStyles?.color);
    if (element.computedStyles?.color && element.computedStyles.color !== "rgb(0, 0, 0)") {
      return element.computedStyles.color;
    }

    return "currentColor";
  });
  const [iconSize, setIconSize] = useState(() => {
    if (!isSvgElement) return "24";
    const html = element.outerHTML;

    // For iconify-icon, check width/height attributes or style
    if (isIconifyIcon) {
      // Check width attribute
      const widthMatch = html.match(/width="(\d+(?:\.\d+)?)(?:px)?"/);
      if (widthMatch) {
        const size = Math.round(parseFloat(widthMatch[1]));
        if (size >= 8) return String(size);
      }
      // Check style width
      const styleWidthMatch = html.match(/style="[^"]*width:\s*(\d+)(?:px)?/);
      if (styleWidthMatch) {
        const size = parseInt(styleWidthMatch[1]);
        if (size >= 8) return String(size);
      }
      return "24";
    }

    // Extract width first
    const widthMatch = html.match(/width="(\d+(?:\.\d+)?)(?:px)?"/);
    if (widthMatch) {
      const size = Math.round(parseFloat(widthMatch[1]));
      if (size >= 8) return String(size);
    }

    // Then height
    const heightMatch = html.match(/height="(\d+(?:\.\d+)?)(?:px)?"/);
    if (heightMatch) {
      const size = Math.round(parseFloat(heightMatch[1]));
      if (size >= 8) return String(size);
    }

    // Check viewBox for size hint (format: "0 0 24 24")
    const viewBoxMatch = html.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (viewBoxMatch) {
      const size = Math.max(parseInt(viewBoxMatch[1]), parseInt(viewBoxMatch[2]));
      if (size >= 8) return String(size);
    }

    return "24";
  });

  // Sync state when element changes
  useEffect(() => {
    const newStyles = parseStyles(element);
    setStyleState(newStyles);
    setTextContent(element.textContent);
    setClasses(element.classes);
    setElementId(element.elementId);
    // Store cleaned original HTML for replacement
    setOriginalOuterHTML(cleanBuildixAttributes(element.outerHTML));

    // Sync IMG element state
    const newTagLower = element.tagName.toLowerCase();
    if (newTagLower === "img") {
      setImageSrc(element.attributes.src || "");
      setImageAlt(element.attributes.alt || "");
    }

    // Sync icon state for SVG elements and iconify-icon
    const newIsIconifyIcon = newTagLower === "iconify-icon";
    const newIsSvg = newTagLower === "svg" || svgChildElements.includes(newTagLower) || element.outerHTML.trim().startsWith("<svg") || newIsIconifyIcon;

    if (newIsSvg) {
      setIconSvg(element.outerHTML);
      const html = element.outerHTML;

      // For iconify-icon elements
      if (newIsIconifyIcon) {
        // Extract icon name
        const iconMatch = html.match(/icon="([^"]+)"/);
        setIconifyIconName(iconMatch ? iconMatch[1] : "");

        // Extract color for iconify-icon
        let extractedColor = "currentColor";
        const styleColorMatch = html.match(/style="[^"]*color:\s*([^;"]+)/);
        if (styleColorMatch) {
          extractedColor = styleColorMatch[1].trim();
        } else if (element.computedStyles?.color && element.computedStyles.color !== "rgb(0, 0, 0)") {
          extractedColor = element.computedStyles.color;
        }
        setIconColor(extractedColor);

        // Extract size for iconify-icon
        let extractedSize = "24";
        const widthMatch = html.match(/width="(\d+(?:\.\d+)?)(?:px)?"/);
        if (widthMatch) {
          const size = Math.round(parseFloat(widthMatch[1]));
          if (size >= 8) extractedSize = String(size);
        } else {
          const styleWidthMatch = html.match(/style="[^"]*width:\s*(\d+)(?:px)?/);
          if (styleWidthMatch) {
            const size = parseInt(styleWidthMatch[1]);
            if (size >= 8) extractedSize = String(size);
          }
        }
        setIconSize(extractedSize);
        return;
      }

      // Extract color - same logic as initial state (for regular SVG)
      let extractedColor = "currentColor";
      const strokeMatch = html.match(/stroke="([^"]+)"/);

      // If stroke is "currentColor", get computed color
      if (strokeMatch && strokeMatch[1] === "currentColor") {
        const computedColor = element.computedStyles?.color;
        if (computedColor && computedColor !== "rgb(0, 0, 0)") {
          extractedColor = computedColor;
        }
      } else if (strokeMatch && strokeMatch[1] !== "none" && strokeMatch[1] !== "transparent") {
        extractedColor = strokeMatch[1];
      } else {
        const fillMatch = html.match(/fill="([^"]+)"/);
        // If fill is "currentColor", get computed color
        if (fillMatch && fillMatch[1] === "currentColor") {
          const computedColor = element.computedStyles?.color;
          if (computedColor && computedColor !== "rgb(0, 0, 0)") {
            extractedColor = computedColor;
          }
        } else if (fillMatch && fillMatch[1] !== "none" && fillMatch[1] !== "transparent") {
          extractedColor = fillMatch[1];
        } else {
          const colorMatch = html.match(/\scolor="([^"]+)"/);
          if (colorMatch && colorMatch[1] !== "none" && colorMatch[1] !== "transparent") {
            extractedColor = colorMatch[1];
          } else if (element.computedStyles?.color && element.computedStyles.color !== "rgb(0, 0, 0)") {
            extractedColor = element.computedStyles.color;
          }
        }
      }
      setIconColor(extractedColor);

      // Extract size - same logic as initial state
      let extractedSize = "24";
      const widthMatch = html.match(/width="(\d+(?:\.\d+)?)(?:px)?"/);
      if (widthMatch) {
        const size = Math.round(parseFloat(widthMatch[1]));
        if (size >= 8) extractedSize = String(size);
      } else {
        const heightMatch = html.match(/height="(\d+(?:\.\d+)?)(?:px)?"/);
        if (heightMatch) {
          const size = Math.round(parseFloat(heightMatch[1]));
          if (size >= 8) extractedSize = String(size);
        } else {
          const viewBoxMatch = html.match(/viewBox="0 0 (\d+) (\d+)"/);
          if (viewBoxMatch) {
            const size = Math.max(parseInt(viewBoxMatch[1]), parseInt(viewBoxMatch[2]));
            if (size >= 8) extractedSize = String(size);
          }
        }
      }
      setIconSize(extractedSize);
    }
  }, [element]);

  // Helper function to extract clean HTML from iframe
  // Works with both normal mode (title="Preview") and Canvas Mode (title="Preview - Desktop 1" etc)
  const extractCleanHtmlFromIframe = useCallback(() => {
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return null;

    const doc = iframe.contentDocument;

    // Clone the body and clean buildix attributes
    const bodyClone = doc.body.cloneNode(true) as HTMLElement;

    // Remove all buildix attributes and classes
    bodyClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
      el.removeAttribute("data-buildix-id");
      const currentClass = el.getAttribute("class") || "";
      const cleanedClasses = currentClass
        .split(/\s+/)
        .filter((c) => !c.startsWith("buildix-"))
        .join(" ")
        .trim();
      if (cleanedClasses) {
        el.setAttribute("class", cleanedClasses);
      } else {
        el.removeAttribute("class");
      }
    });

    // Remove buildix style tag and labels
    bodyClone.querySelectorAll("#buildix-selection-styles, .buildix-element-label, .buildix-spacing-label, .buildix-action-bar").forEach((el) => el.remove());

    // Get the full HTML document
    const htmlEl = doc.documentElement.cloneNode(true) as HTMLElement;
    const bodyInHtml = htmlEl.querySelector("body");
    if (bodyInHtml) {
      bodyInHtml.innerHTML = bodyClone.innerHTML;
    }

    // Remove buildix style from head too
    htmlEl.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());

    return "<!DOCTYPE html>\n" + htmlEl.outerHTML;
  }, []);

  // Helper function to auto-save changes to the database
  // NOTE: We do NOT update htmlContent in the store to prevent iframe reload
  // But we DO add to history so undo/redo works
  const autoSaveToDatabase = useCallback(async () => {
    const newHtml = extractCleanHtmlFromIframe();
    if (!newHtml) return;

    // Add to history for undo/redo support (without updating htmlContent to prevent iframe reload)
    addToHistory(newHtml);

    // Save to database
    if (projectId && currentPageId) {
      console.log("[Buildix] Auto-saving changes to database...");
      const savedPage = await savePage(projectId, currentPageId, newHtml);
      if (savedPage) {
        console.log("[Buildix] Auto-save successful");
      } else {
        console.error("[Buildix] Auto-save failed");
      }
    }
  }, [extractCleanHtmlFromIframe, addToHistory, projectId, currentPageId, savePage]);

  // Debounce timer ref for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save (waits 500ms after last change before saving)
  const debouncedAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveToDatabase();
    }, 500);
  }, [autoSaveToDatabase]);

  // Update style property with live preview and auto-save
  const updateStyle = useCallback((property: string, value: string) => {
    setStyleState((prev) => ({ ...prev, [property]: value }));

    // Apply in real-time to canvas
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    applyLiveStyleToCanvas(element.id, cssProperty, value);

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update margin with live preview and auto-save
  const updateMargin = useCallback((side: string, value: string) => {
    setStyleState((prev) => ({
      ...prev,
      margin: { ...prev.margin, [side]: value },
    }));

    // Apply in real-time to canvas
    applyLiveStyleToCanvas(element.id, `margin-${side}`, value);

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update padding with live preview and auto-save
  const updatePadding = useCallback((side: string, value: string) => {
    setStyleState((prev) => ({
      ...prev,
      padding: { ...prev.padding, [side]: value },
    }));

    // Apply in real-time to canvas
    applyLiveStyleToCanvas(element.id, `padding-${side}`, value);

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update text content with live preview and auto-save
  const updateTextContent = useCallback((value: string) => {
    setTextContent(value);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLElement;

    if (targetElement) {
      targetElement.textContent = value;
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update Tailwind classes with live preview and auto-save
  const updateClasses = useCallback((value: string) => {
    setClasses(value);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLElement;

    if (targetElement) {
      // Preserve the data-buildix-id attribute by keeping any buildix-related classes
      const buildixId = targetElement.getAttribute("data-buildix-id");
      targetElement.className = value;
      if (buildixId) {
        targetElement.setAttribute("data-buildix-id", buildixId);
      }
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update image src with live preview and auto-save (for IMG elements)
  const updateImageSrc = useCallback((value: string) => {
    setImageSrc(value);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLImageElement;

    if (targetElement && targetElement.tagName.toLowerCase() === "img") {
      targetElement.src = value;
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update image alt with live preview and auto-save (for IMG elements)
  const updateImageAlt = useCallback((value: string) => {
    setImageAlt(value);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLImageElement;

    if (targetElement && targetElement.tagName.toLowerCase() === "img") {
      targetElement.alt = value;
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update icon SVG - replaces the SVG in the canvas
  const handleIconChange = useCallback(async (newSvgString: string) => {
    console.log('[RightPanel] handleIconChange called');
    console.log('[RightPanel] newSvgString length:', newSvgString?.length);
    console.log('[RightPanel] newSvgString preview:', newSvgString?.substring(0, 150));

    setIconSvg(newSvgString);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    console.log('[RightPanel] iframe found:', !!iframe);
    console.log('[RightPanel] iframe.contentDocument:', !!iframe?.contentDocument);
    if (!iframe?.contentDocument) return;

    console.log('[RightPanel] Looking for element with id:', element.id);
    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    );
    console.log('[RightPanel] targetElement found:', !!targetElement);

    if (targetElement) {
      // Parse the new SVG and replace the element's content
      const temp = document.createElement("div");
      temp.innerHTML = newSvgString;
      const newSvg = temp.firstElementChild;
      console.log('[RightPanel] Parsed newSvg:', !!newSvg, newSvg?.tagName);

      if (newSvg) {
        // Copy over the data-buildix-id attribute
        newSvg.setAttribute("data-buildix-id", element.id);
        // Preserve any buildix-related classes
        const existingClass = targetElement.getAttribute("class") || "";
        const buildixClasses = existingClass.split(" ").filter(c => c.startsWith("buildix-")).join(" ");
        if (buildixClasses) {
          const newClass = newSvg.getAttribute("class") || "";
          newSvg.setAttribute("class", `${newClass} ${buildixClasses}`.trim());
        }
        console.log('[RightPanel] Replacing element...');
        targetElement.replaceWith(newSvg);
        console.log('[RightPanel] Element replaced successfully');

        // Auto-save after icon change
        await autoSaveToDatabase();
      }
    } else {
      console.warn('[RightPanel] Target element not found in iframe!');
    }
  }, [element.id, autoSaveToDatabase]);

  // Update icon color
  const handleIconColorChange = useCallback((color: string) => {
    setIconColor(color);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLElement;

    if (targetElement) {
      // For iconify-icon elements, use style.color
      if (targetElement.tagName.toLowerCase() === "iconify-icon") {
        targetElement.style.color = color;
      } else {
        // For SVG elements
        targetElement.style.color = color;
        targetElement.setAttribute("fill", color);
        // Also update stroke if present
        if (targetElement.getAttribute("stroke")) {
          targetElement.setAttribute("stroke", color);
        }
      }
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  // Update icon size
  const handleIconSizeChange = useCallback((size: string) => {
    setIconSize(size);

    // Apply in real-time to canvas
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) return;

    const targetElement = iframe.contentDocument.querySelector(
      `[data-buildix-id="${element.id}"]`
    ) as HTMLElement;

    if (targetElement) {
      const sizeNum = parseInt(size) || 24;

      // For iconify-icon elements, use width/height attributes or style
      if (targetElement.tagName.toLowerCase() === "iconify-icon") {
        targetElement.setAttribute("width", String(sizeNum));
        targetElement.setAttribute("height", String(sizeNum));
        targetElement.style.width = `${sizeNum}px`;
        targetElement.style.height = `${sizeNum}px`;
      } else {
        // For SVG elements
        targetElement.setAttribute("width", String(sizeNum));
        targetElement.setAttribute("height", String(sizeNum));
      }
    }

    // Debounced auto-save
    debouncedAutoSave();
  }, [element.id, debouncedAutoSave]);

  const handleSaveChanges = useCallback(async () => {
    console.log("[Buildix] Starting save changes...");

    // Build inline styles from styleState
    const inlineStyles: string[] = [];

    // Margin
    if (styleState.margin.top !== "0px") inlineStyles.push(`margin-top: ${styleState.margin.top}`);
    if (styleState.margin.right !== "0px") inlineStyles.push(`margin-right: ${styleState.margin.right}`);
    if (styleState.margin.bottom !== "0px") inlineStyles.push(`margin-bottom: ${styleState.margin.bottom}`);
    if (styleState.margin.left !== "0px") inlineStyles.push(`margin-left: ${styleState.margin.left}`);

    // Padding
    if (styleState.padding.top !== "0px") inlineStyles.push(`padding-top: ${styleState.padding.top}`);
    if (styleState.padding.right !== "0px") inlineStyles.push(`padding-right: ${styleState.padding.right}`);
    if (styleState.padding.bottom !== "0px") inlineStyles.push(`padding-bottom: ${styleState.padding.bottom}`);
    if (styleState.padding.left !== "0px") inlineStyles.push(`padding-left: ${styleState.padding.left}`);

    // Size
    if (styleState.width !== "auto") inlineStyles.push(`width: ${styleState.width}`);
    if (styleState.height !== "auto") inlineStyles.push(`height: ${styleState.height}`);
    if (styleState.minWidth !== "auto") inlineStyles.push(`min-width: ${styleState.minWidth}`);
    if (styleState.maxWidth !== "none") inlineStyles.push(`max-width: ${styleState.maxWidth}`);
    if (styleState.minHeight !== "auto") inlineStyles.push(`min-height: ${styleState.minHeight}`);
    if (styleState.maxHeight !== "none") inlineStyles.push(`max-height: ${styleState.maxHeight}`);

    // Typography
    if (styleState.fontFamily !== "inherit") inlineStyles.push(`font-family: ${styleState.fontFamily}`);
    if (styleState.fontSize !== "16px") inlineStyles.push(`font-size: ${styleState.fontSize}`);
    if (styleState.fontWeight !== "400") inlineStyles.push(`font-weight: ${styleState.fontWeight}`);
    if (styleState.lineHeight !== "normal") inlineStyles.push(`line-height: ${styleState.lineHeight}`);
    if (styleState.letterSpacing !== "normal") inlineStyles.push(`letter-spacing: ${styleState.letterSpacing}`);
    if (styleState.textAlign !== "left") inlineStyles.push(`text-align: ${styleState.textAlign}`);

    // Text color - special handling for gradients
    if (styleState.color) {
      const isGradient = styleState.color.includes("gradient");
      if (isGradient) {
        // Apply text gradient technique: background-clip text
        inlineStyles.push(`background: ${styleState.color}`);
        inlineStyles.push(`-webkit-background-clip: text`);
        inlineStyles.push(`background-clip: text`);
        inlineStyles.push(`-webkit-text-fill-color: transparent`);
        inlineStyles.push(`color: transparent`);
      } else {
        inlineStyles.push(`color: ${styleState.color}`);
      }
    }

    // Background
    if (styleState.backgroundColor && styleState.backgroundColor !== "transparent" && styleState.backgroundColor !== "rgba(0, 0, 0, 0)") {
      inlineStyles.push(`background-color: ${styleState.backgroundColor}`);
    }
    if (styleState.backgroundImage && styleState.backgroundImage !== "none") {
      inlineStyles.push(`background-image: ${styleState.backgroundImage}`);
    }
    if (styleState.backgroundSize !== "auto") inlineStyles.push(`background-size: ${styleState.backgroundSize}`);
    if (styleState.backgroundPosition !== "0% 0%") inlineStyles.push(`background-position: ${styleState.backgroundPosition}`);

    // Border
    if (styleState.borderWidth !== "0px") inlineStyles.push(`border-width: ${styleState.borderWidth}`);
    if (styleState.borderStyle !== "none") inlineStyles.push(`border-style: ${styleState.borderStyle}`);
    if (styleState.borderColor !== "transparent") inlineStyles.push(`border-color: ${styleState.borderColor}`);
    if (styleState.borderRadius !== "0px") inlineStyles.push(`border-radius: ${styleState.borderRadius}`);

    // Position
    if (styleState.position !== "static") {
      inlineStyles.push(`position: ${styleState.position}`);
      if (styleState.top !== "auto") inlineStyles.push(`top: ${styleState.top}`);
      if (styleState.right !== "auto") inlineStyles.push(`right: ${styleState.right}`);
      if (styleState.bottom !== "auto") inlineStyles.push(`bottom: ${styleState.bottom}`);
      if (styleState.left !== "auto") inlineStyles.push(`left: ${styleState.left}`);
    }
    if (styleState.zIndex !== "auto") inlineStyles.push(`z-index: ${styleState.zIndex}`);

    // Effects
    if (styleState.opacity !== "1") inlineStyles.push(`opacity: ${styleState.opacity}`);
    if (styleState.boxShadow !== "none") inlineStyles.push(`box-shadow: ${styleState.boxShadow}`);
    if (styleState.filter !== "none") inlineStyles.push(`filter: ${styleState.filter}`);
    if (styleState.mixBlendMode !== "normal") inlineStyles.push(`mix-blend-mode: ${styleState.mixBlendMode}`);
    if (styleState.cursor !== "auto") inlineStyles.push(`cursor: ${styleState.cursor}`);
    if (styleState.overflow !== "visible") inlineStyles.push(`overflow: ${styleState.overflow}`);
    if (styleState.visibility !== "visible") inlineStyles.push(`visibility: ${styleState.visibility}`);

    // Transforms
    if (styleState.transform !== "none") inlineStyles.push(`transform: ${styleState.transform}`);
    if (styleState.transformOrigin !== "50% 50% 0px") inlineStyles.push(`transform-origin: ${styleState.transformOrigin}`);
    if (styleState.perspective !== "none") inlineStyles.push(`perspective: ${styleState.perspective}`);

    const styleString = inlineStyles.length > 0 ? inlineStyles.join("; ") : "";
    console.log("[Buildix] Style string:", styleString);

    // Use the iframe to find and update the element, then extract the full HTML
    const iframe = getPreviewIframe();
    if (!iframe?.contentDocument) {
      console.error("[Buildix] Could not find iframe");
      return;
    }

    const doc = iframe.contentDocument;
    const targetElement = doc.querySelector(`[data-buildix-id="${element.id}"]`) as HTMLElement;

    if (!targetElement) {
      console.error("[Buildix] Could not find element in iframe");
      return;
    }

    // Update the element in the iframe
    if (targetElement.children.length === 0) {
      targetElement.textContent = textContent;
    }

    // Update classes (removing buildix-* classes)
    targetElement.className = classes;

    // Update ID
    if (elementId) {
      targetElement.id = elementId;
    } else {
      targetElement.removeAttribute("id");
    }

    // Apply styles
    if (styleString) {
      targetElement.setAttribute("style", styleString);
    } else {
      targetElement.removeAttribute("style");
    }

    // Now extract the full HTML from the iframe body, cleaning buildix attributes
    const bodyClone = doc.body.cloneNode(true) as HTMLElement;

    // Remove all buildix attributes and classes
    bodyClone.querySelectorAll("[data-buildix-id]").forEach((el) => {
      el.removeAttribute("data-buildix-id");
      // Use getAttribute to handle both HTML and SVG elements (SVG has className as SVGAnimatedString)
      const currentClass = el.getAttribute("class") || "";
      const cleanedClasses = currentClass
        .split(/\s+/)
        .filter((c) => !c.startsWith("buildix-"))
        .join(" ")
        .trim();
      if (cleanedClasses) {
        el.setAttribute("class", cleanedClasses);
      } else {
        el.removeAttribute("class");
      }
    });

    // Remove buildix style tag and labels
    bodyClone.querySelectorAll("#buildix-selection-styles, .buildix-element-label, .buildix-spacing-label").forEach((el) => el.remove());

    // Get the full HTML document
    const htmlEl = doc.documentElement.cloneNode(true) as HTMLElement;
    const bodyInHtml = htmlEl.querySelector("body");
    if (bodyInHtml) {
      bodyInHtml.innerHTML = bodyClone.innerHTML;
    }

    // Remove buildix style from head too
    htmlEl.querySelectorAll("#buildix-selection-styles").forEach((el) => el.remove());

    const newHtml = htmlEl.outerHTML;
    console.log("[Buildix] New HTML length:", newHtml.length);

    // Update the store
    setHtmlContent(newHtml);

    // Update the stored original HTML for future edits
    const newOuterHtml = targetElement.outerHTML;
    setOriginalOuterHTML(cleanBuildixAttributes(newOuterHtml));

    // Save to database
    if (projectId && currentPageId) {
      const savedPage = await savePage(projectId, currentPageId, newHtml);
      if (savedPage) {
        console.log("[Buildix] Changes saved to database successfully");
      } else {
        console.error("[Buildix] Failed to save to database");
      }
    } else {
      console.log("[Buildix] No projectId or currentPageId, skipping database save");
    }
  }, [setHtmlContent, element.id, textContent, classes, elementId, styleState, projectId, currentPageId, savePage]);

  return (
    <div className="space-y-1 p-2">
      {/* Element Info Section */}
      <CollapsibleSection title="Element" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-3">
          {/* Element Type */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between h-8">
                  {elementTypes.find((t) => t.value === element.tagName)?.label ||
                    element.tagName.toUpperCase()}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {elementTypes.map((type) => (
                  <DropdownMenuItem key={type.value}>{type.label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Element ID */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">ID</label>
            <Input
              placeholder="element-id"
              value={elementId}
              onChange={(e) => setElementId(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Link (if applicable) */}
          {(element.tagName === "a" || element.attributes.href) && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Link URL</label>
              <div className="relative">
                <Link className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="https://example.com"
                  className="h-8 pl-7 text-sm"
                  defaultValue={element.attributes.href || ""}
                />
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Icon Section - Only for SVG elements and iconify-icon */}
      {isSvgElement && (
        <IconSection
          currentSvg={iconSvg}
          iconColor={iconColor}
          iconSize={iconSize}
          onIconChange={handleIconChange}
          onColorChange={handleIconColorChange}
          onSizeChange={handleIconSizeChange}
          iconifyIconName={isIconifyIcon ? iconifyIconName : undefined}
        />
      )}

      {/* Text Content Section */}
      <CollapsibleSection title="Content" icon={<Type className="h-4 w-4" />}>
        <div className="space-y-3">
          {/* Text Content */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Text</label>
            <textarea
              className="min-h-[60px] w-full resize-none rounded-md border bg-transparent p-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={textContent}
              onChange={(e) => updateTextContent(e.target.value)}
            />
          </div>

          {/* Tailwind Classes */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Tailwind Classes</label>
            <textarea
              className="min-h-[40px] w-full resize-none rounded-md border bg-transparent p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={classes}
              onChange={(e) => updateClasses(e.target.value)}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Spacing Section */}
      <SpacingSection
        margin={styleState.margin}
        padding={styleState.padding}
        onMarginChange={updateMargin}
        onPaddingChange={updatePadding}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.spacing}
      />

      {/* Size Section */}
      <SizeSection
        width={styleState.width}
        height={styleState.height}
        minWidth={styleState.minWidth}
        maxWidth={styleState.maxWidth}
        minHeight={styleState.minHeight}
        maxHeight={styleState.maxHeight}
        onSizeChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.size}
      />

      {/* Typography Section */}
      <TypographySection
        fontFamily={styleState.fontFamily}
        fontSize={styleState.fontSize}
        fontWeight={styleState.fontWeight}
        lineHeight={styleState.lineHeight}
        letterSpacing={styleState.letterSpacing}
        textAlign={styleState.textAlign}
        color={styleState.color}
        onTypographyChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.typography}
      />

      {/* Background Section */}
      <BackgroundSection
        backgroundColor={styleState.backgroundColor}
        backgroundImage={styleState.backgroundImage}
        backgroundSize={styleState.backgroundSize}
        backgroundPosition={styleState.backgroundPosition}
        onBackgroundChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.background}
        // IMG element props
        isImageElement={isImageElement}
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        imageObjectFit={styleState.objectFit}
        imageObjectPosition={styleState.objectPosition}
        onImageSrcChange={updateImageSrc}
        onImageAltChange={updateImageAlt}
        onImageStyleChange={updateStyle}
      />

      {/* Background Assets Section */}
      <BackgroundAssetSection />

      {/* Border Section */}
      <BorderSection
        borderWidth={styleState.borderWidth}
        borderStyle={styleState.borderStyle}
        borderColor={styleState.borderColor}
        borderRadius={styleState.borderRadius}
        borderTopWidth={styleState.borderTopWidth}
        borderBottomWidth={styleState.borderBottomWidth}
        borderLeftWidth={styleState.borderLeftWidth}
        borderRightWidth={styleState.borderRightWidth}
        borderTopStyle={styleState.borderTopStyle}
        borderBottomStyle={styleState.borderBottomStyle}
        borderLeftStyle={styleState.borderLeftStyle}
        borderRightStyle={styleState.borderRightStyle}
        borderTopColor={styleState.borderTopColor}
        borderBottomColor={styleState.borderBottomColor}
        borderLeftColor={styleState.borderLeftColor}
        borderRightColor={styleState.borderRightColor}
        onBorderChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.border}
      />

      {/* Position Section */}
      <PositionSection
        position={styleState.position}
        top={styleState.top}
        right={styleState.right}
        bottom={styleState.bottom}
        left={styleState.left}
        zIndex={styleState.zIndex}
        onPositionChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.position}
      />

      {/* Effects Section */}
      <EffectsSection
        opacity={styleState.opacity}
        boxShadow={styleState.boxShadow}
        filter={styleState.filter}
        backdropFilter={styleState.backdropFilter}
        mixBlendMode={styleState.mixBlendMode}
        cursor={styleState.cursor}
        overflow={styleState.overflow}
        visibility={styleState.visibility}
        onEffectChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.effects}
      />

      {/* Transforms Section */}
      <TransformsSection
        transform={styleState.transform}
        transformOrigin={styleState.transformOrigin}
        perspective={styleState.perspective}
        onTransformChange={updateStyle}
        activeProperties={activeProperties}
        hasActiveProperties={sectionHasActive.transforms}
      />

      {/* Save Button */}
      <div className="sticky bottom-0 bg-card pt-2 pb-4 px-2 border-t mt-4">
        <Button variant="buildix" className="w-full" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function PromptTab({
  element,
  prompt,
  setPrompt,
  isGenerating,
  onApply,
  insertAfterMode,
  insertAfterElementHtml,
  onCancelInsertMode,
}: {
  element: SelectedElementData | null;
  prompt: string;
  setPrompt: (v: string) => void;
  isGenerating: boolean;
  onApply: (options: {
    model: "gemini" | "claude";
    snippets: SelectedSnippet[];
    components: SelectedComponent[];
    referenceImage: { data: string; mimeType: string } | null;
  }) => void;
  insertAfterMode: boolean;
  insertAfterElementHtml: string | null;
  onCancelInsertMode: () => void;
}) {
  // New states for enhanced features
  const [selectedModel, setSelectedModel] = useState<"gemini" | "claude">("gemini");
  const [enabledModels, setEnabledModels] = useState<string[]>(["gemini", "claude"]);
  const [selectedSnippets, setSelectedSnippets] = useState<SelectedSnippet[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<SelectedTemplate[]>([]);
  const [snippetsModalOpen, setSnippetsModalOpen] = useState(false);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState(false);
  const [referenceImage, setReferenceImage] = useState<{
    data: string;
    mimeType: string;
    preview: string;
  } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch enabled AI models from configuration
  useEffect(() => {
    async function fetchAIConfig() {
      try {
        const response = await fetch("/api/ai-config");
        if (response.ok) {
          const data = await response.json();
          setEnabledModels(data.enabledModels || ["gemini", "claude"]);
          // If current model is disabled, switch to first enabled model
          if (data.enabledModels && data.enabledModels.length > 0) {
            if (!data.enabledModels.includes(selectedModel)) {
              setSelectedModel(data.enabledModels[0] as "gemini" | "claude");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI config:", error);
      }
    }
    fetchAIConfig();
  }, []);

  // Quick action prompts
  const quickActions = [
    "Make text larger",
    "Add gradient effect",
    "Make it more modern",
    "Add hover animation",
    "Change colors to match dark theme",
    "Add shadow effect",
  ];

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PNG, JPEG, WebP or GIF image");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64Data = base64.split(",")[1];
      setReferenceImage({
        data: base64Data,
        mimeType: file.type,
        preview: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle snippet selection
  const handleSelectSnippet = (snippet: CodeSnippet) => {
    // Check if already selected
    if (selectedSnippets.some((s) => s.id === snippet.id)) return;

    setSelectedSnippets((prev) => [
      ...prev,
      { id: snippet.id, name: snippet.name, charCount: snippet.charCount },
    ]);
  };

  // Handle component selection
  const handleSelectComponent = (component: UIComponent) => {
    // Check if already selected
    if (selectedComponents.some((c) => c.id === component.id)) return;

    setSelectedComponents((prev) => [
      ...prev,
      { id: component.id, name: component.name, charCount: component.charCount },
    ]);
  };

  // Handle template selection
  const handleSelectTemplate = (template: TemplateWithAuthor) => {
    if (selectedTemplates.some((t) => t.id === template.id)) return;
    setSelectedTemplates((prev) => [
      ...prev,
      { id: template.id, slug: template.slug, title: template.title },
    ]);
  };

  // Handle template removal
  const handleRemoveTemplate = (templateId: string) => {
    setSelectedTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  // Handle apply with all options
  const handleApply = () => {
    onApply({
      model: selectedModel,
      snippets: selectedSnippets,
      components: selectedComponents,
      referenceImage: referenceImage ? { data: referenceImage.data, mimeType: referenceImage.mimeType } : null,
    });
  };

  // Extract element info for display
  const elementTag = element?.tagName?.toUpperCase() || "ELEMENT";
  const elementIdAttr = element?.elementId ? `#${element.elementId}` : "";
  const elementClasses = element?.classes
    ?.split(" ")
    .filter((c) => c && !c.startsWith("buildix-"))
    .slice(0, 5)
    .join(" ") || "";

  return (
    <div className="p-2 space-y-3 overflow-hidden">
      {/* Insert After Mode Banner */}
      {insertAfterMode && insertAfterElementHtml && (
        <div className="rounded-lg border border-violet-500/50 bg-violet-500/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-violet-300">Insert Mode</span>
            </div>
            <button
              onClick={onCancelInsertMode}
              className="text-xs text-violet-400 hover:text-violet-300 underline"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-violet-400/80">
            New content will be added AFTER the selected element.
          </p>
          <div className="bg-zinc-800/50 rounded p-2 overflow-hidden">
            <code className="text-[10px] text-zinc-400 line-clamp-2">
              {insertAfterElementHtml.slice(0, 100)}
              {insertAfterElementHtml.length > 100 ? "..." : ""}
            </code>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!insertAfterMode && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Quick Actions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => setPrompt(action)}
                className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-muted whitespace-nowrap"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {!insertAfterMode && <Separator />}

      {/* Textarea */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={insertAfterMode
          ? "Describe what content to add after the element... (e.g., Add a testimonials section with 3 cards)"
          : "Describe what you want to change... (type @ for snippets)"
        }
        className="min-h-[80px] w-full resize-none rounded-md border bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleApply();
          }
          if (e.key === "@") {
            e.preventDefault();
            setSnippetsModalOpen(true);
          }
        }}
      />

      {/* Selected Templates/Snippets/Components Tags */}
      {(selectedTemplates.length > 0 || selectedSnippets.length > 0 || selectedComponents.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTemplates.map((template) => (
            <TemplateTag
              key={template.id}
              template={template}
              onRemove={() => handleRemoveTemplate(template.id)}
            />
          ))}
          {selectedSnippets.map((snippet) => (
            <SnippetTag
              key={snippet.id}
              snippet={snippet}
              onRemove={() =>
                setSelectedSnippets((prev) => prev.filter((s) => s.id !== snippet.id))
              }
            />
          ))}
          {selectedComponents.map((component) => (
            <ComponentTag
              key={component.id}
              component={component}
              onRemove={() =>
                setSelectedComponents((prev) => prev.filter((c) => c.id !== component.id))
              }
            />
          ))}
        </div>
      )}

      {/* Reference Image Preview */}
      {referenceImage && (
        <div className="relative rounded-md border overflow-hidden">
          <img
            src={referenceImage.preview}
            alt="Reference"
            className="w-full h-24 object-cover"
          />
          <button
            onClick={() => setReferenceImage(null)}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="h-3 w-3 text-white" />
          </button>
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-black/50 text-white">
            Reference Image
          </div>
        </div>
      )}

      {/* Selected Element Info */}
      <div className="rounded-md border bg-muted/30 p-2 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Selected:</span>
          <span className="text-xs font-medium shrink-0">{elementTag}</span>
        </div>
        {elementClasses && (
          <code className="text-[10px] text-muted-foreground block break-all">
            {elementClasses}
          </code>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-t pt-2 flex-wrap">
        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs px-2">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedModel === "gemini" ? "Gemini" : "Claude"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {enabledModels.includes("gemini") && (
              <DropdownMenuItem onClick={() => setSelectedModel("gemini")}>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Gemini
                <span className="ml-2 text-[10px] text-muted-foreground">Google AI - Rápido e criativo</span>
              </DropdownMenuItem>
            )}
            {enabledModels.includes("claude") && (
              <DropdownMenuItem onClick={() => setSelectedModel("claude")}>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Claude
                <span className="ml-2 text-[10px] text-muted-foreground">Anthropic AI - Detalhado e preciso</span>
              </DropdownMenuItem>
            )}
            {enabledModels.length === 0 && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">Nenhum modelo disponível</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* @ Snippets Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSnippetsModalOpen(true)}
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert snippet or component</TooltipContent>
        </Tooltip>

        {/* Image Attachment */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", referenceImage && "text-blue-400")}
              onClick={() => imageInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach reference image</TooltipContent>
        </Tooltip>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Prompt Builder */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPromptBuilderOpen(true)}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Prompt Builder</TooltipContent>
        </Tooltip>
      </div>

      {/* Action Button */}
      <Button
        variant="buildix"
        className="w-full"
        disabled={!prompt.trim() || isGenerating}
        onClick={handleApply}
      >
        {isGenerating ? (
          <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : insertAfterMode ? (
          <Plus className="mr-2 h-3.5 w-3.5" />
        ) : (
          <Sparkles className="mr-2 h-3.5 w-3.5" />
        )}
        {insertAfterMode ? "Insert Content" : "Apply Changes"}
      </Button>

      <p className="text-center text-[10px] text-muted-foreground">
        Costs 1 prompt. Will autosave after completion.
      </p>

      {/* Modals */}
      <CodeSnippetsModal
        open={snippetsModalOpen}
        onOpenChange={setSnippetsModalOpen}
        onSelectSnippet={handleSelectSnippet}
        onSelectComponent={handleSelectComponent}
        onSelectTemplate={handleSelectTemplate}
      />

      {promptBuilderOpen && (
        <PromptBuilder
          onGenerate={(generatedPrompt, refImage, _newContentType) => {
            setPrompt(prompt + (prompt ? "\n" : "") + generatedPrompt);
            // Set reference image if provided (from carousel tab)
            if (refImage) {
              setReferenceImage({
                data: refImage.data,
                mimeType: refImage.mimeType,
                preview: `data:${refImage.mimeType};base64,${refImage.data}`,
              });
            }
            // Note: contentType is not used in right-panel as it's for element-level revisions
            setPromptBuilderOpen(false);
          }}
          onClose={() => setPromptBuilderOpen(false)}
        />
      )}
    </div>
  );
}

function CodeTab({ element }: { element: SelectedElementData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(element.outerHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-2 overflow-hidden">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            Element HTML
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-md border bg-muted/50 p-3 max-h-[400px]">
          <code className="text-xs whitespace-pre-wrap break-all">{element.outerHTML}</code>
        </pre>
      </div>

      {/* Attributes */}
      {Object.keys(element.attributes).length > 0 && (
        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Attributes
          </label>
          <div className="space-y-1">
            {Object.entries(element.attributes).map(([key, value]) => (
              <div key={key} className="text-xs">
                <code className="rounded bg-muted px-1.5 py-0.5">{key}</code>
                <span className="text-muted-foreground"> = </span>
                <code className="text-muted-foreground break-all">{value}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
