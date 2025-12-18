"use client";

import { useState, useCallback } from "react";
import {
  GraduationCap,
  ShoppingCart,
  BookOpen,
  ArrowLeftRight,
  HelpCircle,
  Pencil,
  Link,
  Image,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Loader2,
  Upload,
  X,
  RefreshCw,
  Check,
  Hash,
  Search,
  Clock,
  Lock,
  Zap,
  TrendingUp,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CAROUSEL_TEMPLATES,
  VIRAL_HOOKS,
  STYLE_PRESETS,
  NICHE_PALETTES,
  CONTENT_SOURCES,
  HOOK_CATEGORIES,
  getRandomHook,
  getHooksByCategory,
  type CarouselTemplate,
  type ViralHook,
} from "@/lib/constants/carousel-templates";

interface CarouselTabProps {
  onGenerate: (prompt: string, referenceImage?: { data: string; mimeType: string }, contentType?: string) => void;
}

// Icon mapping for templates
const templateIcons: Record<string, React.ReactNode> = {
  educational: <GraduationCap className="h-5 w-5" />,
  sales: <ShoppingCart className="h-5 w-5" />,
  storytelling: <BookOpen className="h-5 w-5" />,
  comparison: <ArrowLeftRight className="h-5 w-5" />,
  faq: <HelpCircle className="h-5 w-5" />,
};

// Icon mapping for content sources
const sourceIcons: Record<string, React.ReactNode> = {
  manual: <Pencil className="h-5 w-5" />,
  url: <Link className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
};

// Icon mapping for hook categories
const hookCategoryIcons: Record<string, React.ReactNode> = {
  curiosity: <Search className="h-4 w-4" />,
  numbers: <Hash className="h-4 w-4" />,
  negation: <X className="h-4 w-4" />,
  urgency: <Clock className="h-4 w-4" />,
  secret: <Lock className="h-4 w-4" />,
  provocation: <Zap className="h-4 w-4" />,
  transformation: <TrendingUp className="h-4 w-4" />,
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function CarouselTab({ onGenerate }: CarouselTabProps) {
  // Content Sources - Now supports multiple selections
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set(["manual"]));
  const [sourceUrl, setSourceUrl] = useState("");
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [urlAnalysis, setUrlAnalysis] = useState<any>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageMimeType, setReferenceImageMimeType] = useState<string>("image/jpeg");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [styleFromImage, setStyleFromImage] = useState(false); // Track if style came from image

  // Template
  const [selectedTemplate, setSelectedTemplate] = useState<string>("educational");
  const [slideCount, setSlideCount] = useState(5);

  // Style
  const [selectedStyle, setSelectedStyle] = useState<string>("clean");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);

  // Content
  const [topic, setTopic] = useState("");
  const [hookText, setHookText] = useState("");
  const [selectedHookCategory, setSelectedHookCategory] = useState<string | null>(null);
  const [slideContents, setSlideContents] = useState<string[]>(["", "", "", "", ""]);

  // Additional
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // Get current template
  const currentTemplate = CAROUSEL_TEMPLATES.find(t => t.id === selectedTemplate);

  // Handle URL analysis
  const handleAnalyzeUrl = async () => {
    if (!sourceUrl) return;

    setIsAnalyzingUrl(true);
    try {
      const response = await fetch("/api/ai/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setUrlAnalysis(data);
        // Auto-fill topic if available
        if (data.title) {
          setTopic(data.title);
        }
      }
    } catch (error) {
      console.error("Failed to analyze URL:", error);
    } finally {
      setIsAnalyzingUrl(false);
    }
  };

  // Handle image upload
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReferenceImage(base64);
      setReferenceImageMimeType(file.type);

      // Analyze image
      setIsAnalyzingImage(true);
      try {
        const response = await fetch("/api/ai/analyze-design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageData: base64.split(",")[1],
            mimeType: file.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setImageAnalysis(data);
          // Auto-select style based on analysis and mark it came from image
          if (data.suggestedStyle) {
            setSelectedStyle(data.suggestedStyle);
            setStyleFromImage(true);
          }
        }
      } catch (error) {
        console.error("Failed to analyze image:", error);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Toggle content source (allows multiple selections)
  const toggleSource = (sourceId: string) => {
    setActiveSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
        // If removed the last one, keep at least "manual"
        if (next.size === 0) next.add("manual");
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  // Generate random hook
  const handleGenerateHook = () => {
    const hook = selectedHookCategory
      ? getHooksByCategory(selectedHookCategory)[Math.floor(Math.random() * getHooksByCategory(selectedHookCategory).length)]
      : getRandomHook();

    if (hook) {
      setHookText(hook.example);
    }
  };

  // Update slide count and contents array
  const handleSlideCountChange = (newCount: number) => {
    setSlideCount(newCount);
    const newContents = [...slideContents];
    while (newContents.length < newCount) {
      newContents.push("");
    }
    setSlideContents(newContents.slice(0, newCount));
  };

  // Build and generate prompt
  const handleGenerate = () => {
    const template = CAROUSEL_TEMPLATES.find(t => t.id === selectedTemplate);
    const style = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const niche = selectedNiche ? NICHE_PALETTES.find(p => p.id === selectedNiche) : null;

    let prompt = `Create an Instagram carousel with ${slideCount} slides using the "${template?.label}" structure.

TOPIC/THEME: ${topic || "General content"}

SLIDE STRUCTURE:
`;

    // Add slide structure from template
    template?.structure.slice(0, slideCount).forEach((slide, index) => {
      const content = slideContents[index] || slide.placeholder;
      prompt += `- Slide ${index + 1} (${slide.purpose}): ${content}\n`;
    });

    // Add hook if provided
    if (hookText) {
      prompt += `\nHOOK TEXT FOR SLIDE 1: "${hookText}"`;
    }

    // Add style instructions
    prompt += `\n\nVISUAL STYLE: ${style?.label} - ${style?.description}`;

    if (niche) {
      prompt += `\nCOLOR PALETTE: ${niche.label} palette with colors: ${niche.colors.join(", ")}`;
    } else if (style) {
      prompt += `\nCOLORS: Background ${style.colors.background}, Text ${style.colors.text}, Accent ${style.colors.accent}`;
    }

    // Add URL analysis context
    if (urlAnalysis) {
      prompt += `\n\nCONTENT EXTRACTED FROM URL:
- Title: ${urlAnalysis.title || "N/A"}
- Description: ${urlAnalysis.description || "N/A"}
- Key Benefits: ${urlAnalysis.benefits?.join(", ") || "N/A"}
- Brand Colors: ${urlAnalysis.colors?.join(", ") || "N/A"}`;
    }

    // Add image analysis context
    if (imageAnalysis) {
      prompt += `\n\nREFERENCE DESIGN ANALYSIS:
- Style: ${imageAnalysis.style || "N/A"}
- Layout: ${imageAnalysis.layout || "N/A"}
- Colors: ${imageAnalysis.colors?.join(", ") || "N/A"}
- Typography: ${JSON.stringify(imageAnalysis.typography) || "N/A"}
IMPORTANT: A reference image is attached. Analyze it and replicate the visual style, colors, typography, and overall aesthetic in the carousel design.`;
    }

    // Add additional instructions
    if (additionalInstructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS: ${additionalInstructions}`;
    }

    // Add combined sources context when multiple sources are active
    if (activeSources.size > 1) {
      prompt += `\n\nCOMBINED SOURCES PRIORITY:`;
      if (referenceImage || imageAnalysis) {
        prompt += `\n- VISUAL STYLE: Follow the reference image style EXACTLY (colors, typography, layout)`;
      }
      if (urlAnalysis) {
        prompt += `\n- CONTENT: Use the product/service information extracted from the URL`;
      }
      if (activeSources.has("manual") && topic) {
        prompt += `\n- CUSTOMIZATION: Apply the user's topic/theme as the main subject`;
      }
    }

    // Add carousel-specific guidelines with explicit HTML structure
    prompt += `

CAROUSEL GUIDELINES:
- CRITICAL: Each slide MUST be wrapped in a div with class "carousel-slide"
- Each slide should be 1080x1350px (4:5 aspect ratio) with classes: "carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden"
- Body should have: class="m-0 p-8 bg-zinc-800 flex gap-8 overflow-x-auto"
- Use large, readable fonts (min 56px for headlines)
- Maximum 3-4 lines of text per slide
- Include visual elements (icons, illustrations) when appropriate
- Maintain consistent design across all slides
- Add slide numbers or progress indicators
- Last slide should have a clear call-to-action`;

    // Pass image reference if available (regardless of which sources are active)
    // This allows combining image style with URL/manual content
    if (referenceImage) {
      const imageData = referenceImage.split(",")[1]; // Remove data URL prefix
      onGenerate(prompt, { data: imageData, mimeType: referenceImageMimeType }, "instagram-carousel");
    } else {
      onGenerate(prompt, undefined, "instagram-carousel");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-zinc-800/50">
          {/* Content Source */}
          <CollapsibleSection title="FONTE DO CONTEÚDO" icon={<Sparkles className="h-4 w-4" />}>
            <div className="space-y-4">
              {/* Source Selection - Multiple selections allowed */}
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_SOURCES.map((source) => {
                  const isActive = activeSources.has(source.id);
                  return (
                    <button
                      key={source.id}
                      onClick={() => toggleSource(source.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all relative",
                        isActive
                          ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                          : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                      )}
                    >
                      {/* Checkbox indicator */}
                      <div className={cn(
                        "absolute top-2 right-2 w-4 h-4 rounded border flex items-center justify-center transition-all",
                        isActive
                          ? "bg-violet-500 border-violet-500"
                          : "border-zinc-600 bg-transparent"
                      )}>
                        {isActive && <Check className="h-3 w-3 text-white" />}
                      </div>
                      {sourceIcons[source.id]}
                      <span className="text-sm font-medium">{source.label}</span>
                      <span className="text-xs text-zinc-500">{source.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-500 text-center">
                Selecione uma ou mais fontes para combinar
              </p>

              {/* URL Input */}
              {activeSources.has("url") && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cole a URL do site (ex: https://meusite.com)"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                    <Button
                      onClick={handleAnalyzeUrl}
                      disabled={!sourceUrl || isAnalyzingUrl}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {isAnalyzingUrl ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Analisar"
                      )}
                    </Button>
                  </div>

                  {urlAnalysis && (
                    <div className="rounded-lg bg-zinc-800/50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">URL analisada com sucesso!</span>
                      </div>
                      {urlAnalysis.title && (
                        <p className="text-sm text-zinc-300"><strong>Título:</strong> {urlAnalysis.title}</p>
                      )}
                      {urlAnalysis.description && (
                        <p className="text-sm text-zinc-400">{urlAnalysis.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload */}
              {activeSources.has("image") && (
                <div className="space-y-3">
                  {!referenceImage ? (
                    <label className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 p-6 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-800/30 transition-all">
                      <Upload className="h-8 w-8 text-zinc-500" />
                      <span className="text-sm text-zinc-400">Clique para fazer upload de uma imagem de referência</span>
                      <span className="text-xs text-zinc-600">PNG, JPG ou WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={referenceImage}
                        alt="Referência"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setReferenceImage(null);
                          setImageAnalysis(null);
                          setStyleFromImage(false);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                      {isAnalyzingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {imageAnalysis && (
                    <div className="rounded-lg bg-zinc-800/50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-green-400">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Design analisado!</span>
                      </div>
                      {imageAnalysis.style && (
                        <p className="text-sm text-zinc-300"><strong>Estilo:</strong> {imageAnalysis.style}</p>
                      )}
                      {imageAnalysis.colors && (
                        <div className="flex gap-2">
                          <span className="text-sm text-zinc-400">Cores:</span>
                          {imageAnalysis.colors.map((color: string, i: number) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border border-zinc-600"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Topic Input (for manual) */}
              {activeSources.has("manual") && (
                <div>
                  <label className="text-xs text-zinc-500 mb-2 block">Tema/Assunto do Carrossel</label>
                  <Textarea
                    placeholder="Descreva o tema do carrossel. Ex: 5 dicas para aumentar produtividade no trabalho remoto"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="bg-zinc-800/50 border-zinc-700 min-h-[80px]"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Template Selection */}
          <CollapsibleSection title="TEMPLATE DE ESTRUTURA" icon={<BookOpen className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {CAROUSEL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      handleSlideCountChange(template.slideCount);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                      selectedTemplate === template.id
                        ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                        : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                    )}
                  >
                    {templateIcons[template.id]}
                    <span className="text-xs font-medium text-center">{template.label}</span>
                  </button>
                ))}
              </div>

              {currentTemplate && (
                <div className="text-sm text-zinc-400 bg-zinc-800/30 p-3 rounded-lg">
                  <p className="font-medium text-zinc-300 mb-2">{currentTemplate.description}</p>
                  <div className="space-y-1">
                    {currentTemplate.structure.map((slide, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                          {i + 1}
                        </span>
                        <span className="text-zinc-500">{slide.purpose}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slide Count */}
              <div>
                <label className="text-xs text-zinc-500 mb-2 block">Número de Slides</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSlideCountChange(Math.max(3, slideCount - 1))}
                    className="h-8 w-8 border-zinc-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium text-white w-8 text-center">{slideCount}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSlideCountChange(Math.min(10, slideCount + 1))}
                    className="h-8 w-8 border-zinc-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-zinc-500 ml-2">(3-10 slides)</span>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Hook Generator */}
          <CollapsibleSection title="HOOK (SLIDE 1)" icon={<Zap className="h-4 w-4" />}>
            <div className="space-y-4">
              {/* Hook Categories */}
              <div className="flex flex-wrap gap-2">
                {HOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedHookCategory(selectedHookCategory === cat.id ? null : cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all",
                      selectedHookCategory === cat.id
                        ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                        : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    {hookCategoryIcons[cat.id]}
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Hook Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Digite ou gere um hook viral..."
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  className="bg-zinc-800/50 border-zinc-700"
                />
                <Button
                  variant="outline"
                  onClick={handleGenerateHook}
                  className="border-zinc-700 hover:bg-violet-500/10 hover:border-violet-500/50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Gerar
                </Button>
              </div>

              {/* Hook Suggestions */}
              {selectedHookCategory && (
                <div className="space-y-2">
                  <span className="text-xs text-zinc-500">Sugestões:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getHooksByCategory(selectedHookCategory).slice(0, 3).map((hook) => (
                      <button
                        key={hook.id}
                        onClick={() => setHookText(hook.example)}
                        className="w-full text-left text-xs text-zinc-400 hover:text-violet-300 p-2 rounded bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                      >
                        {hook.example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Style Selection - Only show if not using image reference */}
          <CollapsibleSection title="ESTILO VISUAL" icon={<Sparkles className="h-4 w-4" />}>
            <div className="space-y-4">
              {/* Show message when style comes from image */}
              {styleFromImage && imageAnalysis && (
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-violet-300">
                    <Image className="h-4 w-4" />
                    <span className="text-sm font-medium">Estilo extraído da imagem de referência</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O estilo <strong className="text-violet-300">{selectedStyle}</strong> foi detectado automaticamente.
                    {imageAnalysis.colors && (
                      <span className="flex items-center gap-2 mt-2">
                        Cores:
                        {imageAnalysis.colors.slice(0, 4).map((color: string, i: number) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full inline-block border border-zinc-600"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => setStyleFromImage(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Escolher estilo manualmente
                  </button>
                </div>
              )}

              {/* Style Presets - Only show if style doesn't come from image */}
              {!styleFromImage && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          selectedStyle === style.id
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full border border-zinc-600"
                            style={{ backgroundColor: style.colors.background }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-zinc-600"
                            style={{ backgroundColor: style.colors.accent }}
                          />
                        </div>
                        <span className="text-xs font-medium">{style.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Niche Palettes */}
                  <div>
                    <label className="text-xs text-zinc-500 mb-2 block">Paleta por Nicho (opcional)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {NICHE_PALETTES.map((palette) => (
                        <button
                          key={palette.id}
                          onClick={() => setSelectedNiche(selectedNiche === palette.id ? null : palette.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border p-2 transition-all",
                            selectedNiche === palette.id
                              ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                              : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                          )}
                        >
                          <div className="flex gap-0.5">
                            {palette.colors.slice(0, 4).map((color, i) => (
                              <div
                                key={i}
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <span className="text-xs">{palette.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CollapsibleSection>

          {/* Additional Instructions */}
          <CollapsibleSection title="INSTRUÇÕES ADICIONAIS" icon={<Pencil className="h-4 w-4" />} defaultOpen={false}>
            <Textarea
              placeholder="Adicione instruções específicas para personalizar o carrossel..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="bg-zinc-800/50 border-zinc-700 min-h-[80px]"
            />
          </CollapsibleSection>
        </div>
      </div>

      {/* Apply Button - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900">
        <Button
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl py-3 transition-all shadow-lg shadow-violet-500/20"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Aplicar ao Prompt
        </Button>
      </div>
    </div>
  );
}
