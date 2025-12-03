"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface IconSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectIcon: (svgString: string) => void;
  currentColor?: string;
  currentSize?: string;
}

type IconLibrary = "lucide" | "iconify" | "mingcute" | "logos" | "skills";

// Popular Iconify icon sets
const iconifySets = [
  { prefix: "mdi", name: "Material Design Icons", count: 7000 },
  { prefix: "ph", name: "Phosphor", count: 7000 },
  { prefix: "ri", name: "Remix Icon", count: 2800 },
  { prefix: "bi", name: "Bootstrap Icons", count: 2000 },
  { prefix: "tabler", name: "Tabler Icons", count: 5000 },
  { prefix: "heroicons", name: "Heroicons", count: 600 },
  { prefix: "ion", name: "Ionicons", count: 1300 },
  { prefix: "fa6-solid", name: "Font Awesome Solid", count: 1400 },
  { prefix: "fa6-regular", name: "Font Awesome Regular", count: 160 },
  { prefix: "fluent", name: "Fluent UI", count: 4000 },
  { prefix: "carbon", name: "Carbon", count: 2000 },
  { prefix: "octicon", name: "Octicons", count: 500 },
  { prefix: "solar", name: "Solar", count: 7000 },
  { prefix: "iconamoon", name: "IconaMoon", count: 1200 },
  { prefix: "uil", name: "Unicons Line", count: 1200 },
];

interface IconifySearchResult {
  icons: string[];
  total: number;
}

interface IconifyIcon {
  prefix: string;
  name: string;
}

// Função para extrair nomes de ícones válidos do lucide-react
function getLucideIconNames(): string[] {
  const iconNames: string[] = [];
  const excludeKeys = new Set([
    'default', 'createLucideIcon', 'IconNode', 'Icon', 'icons',
    'createElement', 'LucideIcon', 'LucideProps', 'icons', 'dynamicIconImports'
  ]);

  for (const key of Object.keys(LucideIcons)) {
    if (excludeKeys.has(key)) continue;
    // Icon names start with uppercase
    if (!/^[A-Z]/.test(key)) continue;

    const value = (LucideIcons as Record<string, unknown>)[key];
    // Check if it's a valid React component (function or object with $$typeof)
    if (value && (typeof value === 'function' || (typeof value === 'object' && '$$typeof' in value))) {
      iconNames.push(key);
    }
  }

  return iconNames.sort();
}

// Simple Icons (popular brand logos) - updated slugs
const simpleIconSlugs = [
  "github", "google", "facebook", "x", "instagram", "youtube",
  "discord", "slack", "telegram", "whatsapp", "tiktok", "pinterest", "reddit",
  "spotify", "apple", "netflix", "twitch",
  "figma", "sketch",
  "html5", "javascript", "typescript", "react", "vuedotjs", "angular",
  "nextdotjs", "svelte", "tailwindcss", "bootstrap", "sass",
  "nodedotjs", "express", "nestjs", "fastify", "django", "flask", "laravel",
  "postgresql", "mysql", "mongodb", "redis", "firebase", "supabase",
  "docker", "kubernetes", "googlecloud", "vercel", "netlify",
  "git", "gitlab", "bitbucket", "jira", "notion", "trello",
  "python", "kotlin", "swift", "go", "rust", "cplusplus",
  "php", "ruby", "elixir", "haskell", "scala", "dart", "flutter",
  "stripe", "paypal", "shopify",
  "wordpress", "contentful", "strapi", "sanity", "ghost",
  "npm", "yarn", "pnpm", "webpack", "vite", "esbuild",
  "jest", "cypress", "vitest", "storybook",
  "linux", "ubuntu", "debian", "archlinux", "fedora"
];

// Skill Icons (developer/tech skills)
const skillIconNames = [
  "js", "ts", "react", "vue", "angular", "svelte", "nextjs", "nuxtjs",
  "html", "css", "sass", "tailwind", "bootstrap", "materialui", "styledcomponents",
  "nodejs", "express", "nestjs", "fastapi", "django", "flask", "rails", "laravel",
  "python", "java", "kotlin", "swift", "go", "rust", "cpp", "cs", "php", "ruby",
  "postgres", "mysql", "mongodb", "redis", "elasticsearch", "graphql", "prisma",
  "docker", "kubernetes", "aws", "gcp", "azure", "vercel", "netlify", "heroku",
  "git", "github", "gitlab", "bitbucket", "vscode", "idea", "figma", "xd",
  "linux", "bash", "powershell", "vim", "neovim", "emacs",
  "jest", "cypress", "selenium", "postman", "nginx", "apache",
  "tensorflow", "pytorch", "opencv", "sklearn",
  "unity", "unreal", "godot", "blender", "threejs",
  "wordpress", "webflow", "wix", "shopify",
  "discord", "twitter", "linkedin", "stackoverflow", "devto", "medium"
];

// Mingcute icon categories with sample icons
const mingcuteCategories = [
  { name: "arrows", icons: ["arrow-up", "arrow-down", "arrow-left", "arrow-right", "arrows-up-down", "arrows-left-right", "chevron-up", "chevron-down", "chevron-left", "chevron-right"] },
  { name: "buildings", icons: ["home", "building", "store", "hospital", "school", "church", "bank", "factory", "warehouse", "garage"] },
  { name: "business", icons: ["briefcase", "chart", "presentation", "calculator", "clipboard", "document", "folder", "inbox", "mail", "phone"] },
  { name: "communication", icons: ["chat", "comment", "message", "notification", "bell", "megaphone", "broadcast", "share", "send", "inbox"] },
  { name: "design", icons: ["palette", "brush", "pen", "pencil", "ruler", "scissors", "crop", "layers", "frame", "grid"] },
  { name: "development", icons: ["code", "terminal", "bug", "database", "server", "cloud", "api", "git", "github", "settings"] },
  { name: "devices", icons: ["phone", "tablet", "laptop", "desktop", "tv", "watch", "headphones", "speaker", "camera", "printer"] },
  { name: "files", icons: ["file", "folder", "document", "image", "video", "audio", "archive", "pdf", "excel", "word"] },
  { name: "media", icons: ["play", "pause", "stop", "forward", "backward", "volume", "mute", "fullscreen", "minimize", "record"] },
  { name: "navigation", icons: ["menu", "close", "more", "search", "filter", "sort", "home", "back", "forward", "refresh"] },
  { name: "social", icons: ["user", "users", "heart", "star", "bookmark", "share", "like", "follow", "comment", "emoji"] },
  { name: "weather", icons: ["sun", "moon", "cloud", "rain", "snow", "wind", "thunder", "fog", "temperature", "umbrella"] },
];

export function IconSelectorModal({
  open,
  onOpenChange,
  onSelectIcon,
  currentColor = "currentColor",
  currentSize = "24",
}: IconSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<IconLibrary>("lucide");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lucideIconNames, setLucideIconNames] = useState<string[]>([]);

  // Iconify state
  const [selectedIconifySet, setSelectedIconifySet] = useState<string>("mdi");
  const [iconifyIcons, setIconifyIcons] = useState<IconifyIcon[]>([]);
  const [iconifySearchResults, setIconifySearchResults] = useState<IconifyIcon[]>([]);
  const [isLoadingIconify, setIsLoadingIconify] = useState(false);

  // Debug: log current properties being inherited
  useEffect(() => {
    if (open) {
      console.log('[IconSelector] Modal opened with inherited properties:');
      console.log('[IconSelector]   currentColor:', currentColor);
      console.log('[IconSelector]   currentSize:', currentSize);
    }
  }, [open, currentColor, currentSize]);

  // Populate icon names on client side
  useEffect(() => {
    const names = getLucideIconNames();
    console.log('[IconSelector] Loaded', names.length, 'Lucide icons');
    console.log('[IconSelector] Sample icons:', names.slice(0, 10));
    setLucideIconNames(names);
  }, []);

  // Load icons from selected Iconify set
  useEffect(() => {
    if (activeTab !== "iconify") return;

    const loadIconifySet = async () => {
      setIsLoadingIconify(true);
      try {
        // Fetch all icons from the selected set
        const response = await fetch(`https://api.iconify.design/collection?prefix=${selectedIconifySet}`);
        if (response.ok) {
          const data = await response.json();
          if (data.uncategorized) {
            // If uncategorized, use all icons
            const icons = data.uncategorized.map((name: string) => ({
              prefix: selectedIconifySet,
              name,
            }));
            setIconifyIcons(icons.slice(0, 500)); // Limit to 500 for performance
          } else if (data.categories) {
            // If categorized, flatten all categories
            const icons: IconifyIcon[] = [];
            Object.values(data.categories).forEach((categoryIcons) => {
              (categoryIcons as string[]).forEach((name) => {
                icons.push({ prefix: selectedIconifySet, name });
              });
            });
            setIconifyIcons(icons.slice(0, 500)); // Limit to 500 for performance
          }
        }
      } catch (error) {
        console.error("Failed to load Iconify set:", error);
      } finally {
        setIsLoadingIconify(false);
      }
    };

    loadIconifySet();
  }, [activeTab, selectedIconifySet]);

  // Search Iconify icons
  useEffect(() => {
    if (activeTab !== "iconify" || !searchQuery) {
      setIconifySearchResults([]);
      return;
    }

    const searchIconify = async () => {
      setIsLoadingIconify(true);
      try {
        // Search across the selected icon set
        const response = await fetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&prefix=${selectedIconifySet}&limit=100`
        );
        if (response.ok) {
          const data: IconifySearchResult = await response.json();
          const icons = data.icons.map((iconId) => {
            const [prefix, ...nameParts] = iconId.split(":");
            return { prefix, name: nameParts.join(":") };
          });
          setIconifySearchResults(icons);
        }
      } catch (error) {
        console.error("Failed to search Iconify:", error);
      } finally {
        setIsLoadingIconify(false);
      }
    };

    const debounce = setTimeout(searchIconify, 300);
    return () => clearTimeout(debounce);
  }, [activeTab, searchQuery, selectedIconifySet]);

  // Filter Lucide icons based on search
  const filteredLucideIcons = useMemo(() => {
    if (!searchQuery) return lucideIconNames;

    const query = searchQuery.toLowerCase();
    return lucideIconNames.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [searchQuery, lucideIconNames]);

  // Filter Simple Icons based on search
  const filteredSimpleIcons = useMemo(() => {
    if (!searchQuery) return simpleIconSlugs;
    const query = searchQuery.toLowerCase();
    return simpleIconSlugs.filter((slug) =>
      slug.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter Skill Icons based on search
  const filteredSkillIcons = useMemo(() => {
    if (!searchQuery) return skillIconNames;
    const query = searchQuery.toLowerCase();
    return skillIconNames.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter Mingcute icons based on search
  const filteredMingcuteIcons = useMemo(() => {
    const allIcons: string[] = [];
    mingcuteCategories.forEach(cat => {
      cat.icons.forEach(icon => {
        allIcons.push(`${cat.name}/${icon}`);
      });
    });

    if (!searchQuery) return allIcons;
    const query = searchQuery.toLowerCase();
    return allIcons.filter((name) =>
      name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Handle Lucide icon selection
  const handleLucideSelect = useCallback((iconName: string) => {
    console.log('[IconSelector] handleLucideSelect called with:', iconName);
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[iconName];
    console.log('[IconSelector] IconComponent found:', !!IconComponent);
    if (IconComponent) {
      // Parse size - handle cases like "24", "24px", "2", etc.
      let size = parseInt(currentSize) || 24;
      // If size is too small (probably a parsing error), use default
      if (size < 8) size = 24;

      // Handle color - if it's "none", "currentColor" or invalid, use a default
      let color = currentColor;
      if (!color || color === "none" || color === "transparent") {
        color = "currentColor";
      }

      console.log('[IconSelector] Rendering with size:', size, 'color:', color);
      const svgString = renderToStaticMarkup(
        <IconComponent size={size} color={color} />
      );
      console.log('[IconSelector] Generated SVG:', svgString.substring(0, 200));
      onSelectIcon(svgString);
      onOpenChange(false);
    } else {
      console.error('[IconSelector] IconComponent not found for:', iconName);
    }
  }, [currentColor, currentSize, onSelectIcon, onOpenChange]);

  // Handle Simple Icons selection (fetch from CDN)
  const handleSimpleIconSelect = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://cdn.simpleicons.org/${slug}`);
      if (response.ok) {
        let svgText = await response.text();
        // Add size and color attributes
        const size = parseInt(currentSize) || 24;
        svgText = svgText
          .replace(/<svg/, `<svg width="${size}" height="${size}"`)
          .replace(/fill="[^"]*"/, `fill="${currentColor}"`);
        if (!svgText.includes('fill=')) {
          svgText = svgText.replace(/<svg/, `<svg fill="${currentColor}"`);
        }
        onSelectIcon(svgText);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to fetch Simple Icon:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColor, currentSize, onSelectIcon, onOpenChange]);

  // Handle Skill Icons selection (fetch from CDN)
  const handleSkillIconSelect = useCallback(async (name: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://go-skill-icons.vercel.app/api/icons?i=${name}`);
      if (response.ok) {
        let svgText = await response.text();
        const size = parseInt(currentSize) || 24;
        // Check if response is SVG
        if (svgText.includes('<svg')) {
          svgText = svgText
            .replace(/width="[^"]*"/, `width="${size}"`)
            .replace(/height="[^"]*"/, `height="${size}"`);
          onSelectIcon(svgText);
          onOpenChange(false);
        } else {
          // If not SVG, create an img-based approach or use a fallback
          console.error("Response is not SVG");
        }
      }
    } catch (error) {
      console.error("Failed to fetch Skill Icon:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSize, onSelectIcon, onOpenChange]);

  // Handle Iconify icon selection (fetch from CDN)
  const handleIconifySelect = useCallback(async (icon: IconifyIcon) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.iconify.design/${icon.prefix}/${icon.name}.svg`);
      if (response.ok) {
        let svgText = await response.text();
        const size = parseInt(currentSize) || 24;
        // Add/update size attributes
        if (svgText.includes('width=')) {
          svgText = svgText.replace(/width="[^"]*"/, `width="${size}"`);
        } else {
          svgText = svgText.replace(/<svg/, `<svg width="${size}"`);
        }
        if (svgText.includes('height=')) {
          svgText = svgText.replace(/height="[^"]*"/, `height="${size}"`);
        } else {
          svgText = svgText.replace(/<svg/, `<svg height="${size}"`);
        }
        // Handle color - only apply if not currentColor and icon uses currentColor or no fill
        if (currentColor && currentColor !== "currentColor") {
          svgText = svgText.replace(/fill="currentColor"/g, `fill="${currentColor}"`);
          svgText = svgText.replace(/stroke="currentColor"/g, `stroke="${currentColor}"`);
        }
        onSelectIcon(svgText);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to fetch Iconify icon:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColor, currentSize, onSelectIcon, onOpenChange]);

  // Handle Mingcute icon selection (fetch from CDN)
  const handleMingcuteSelect = useCallback(async (iconPath: string) => {
    setIsLoading(true);
    try {
      // Mingcute icons from unpkg CDN
      const [category, name] = iconPath.split('/');
      const response = await fetch(`https://unpkg.com/@aspect-ratio/mingcute-icon@0.0.14/svg/${category}/${name}.svg`);
      if (response.ok) {
        let svgText = await response.text();
        const size = parseInt(currentSize) || 24;
        svgText = svgText
          .replace(/width="[^"]*"/, `width="${size}"`)
          .replace(/height="[^"]*"/, `height="${size}"`)
          .replace(/fill="[^"]*"/g, `fill="${currentColor}"`);
        if (!svgText.includes('fill=')) {
          svgText = svgText.replace(/<svg/, `<svg fill="${currentColor}"`);
        }
        onSelectIcon(svgText);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to fetch Mingcute Icon:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentColor, currentSize, onSelectIcon, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as IconLibrary)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="lucide" className="gap-2">
                <LucideIcons.Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Lucide</span>
              </TabsTrigger>
              <TabsTrigger value="iconify" className="gap-2">
                <LucideIcons.Package className="h-4 w-4" />
                <span className="hidden sm:inline">Iconify</span>
              </TabsTrigger>
              <TabsTrigger value="mingcute" className="gap-2">
                <LucideIcons.Shapes className="h-4 w-4" />
                <span className="hidden sm:inline">Mingcute</span>
              </TabsTrigger>
              <TabsTrigger value="logos" className="gap-2">
                <LucideIcons.Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Logos</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <LucideIcons.Code className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search Input */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden px-6 py-4">
            {/* Lucide Icons */}
            <TabsContent value="lucide" className="h-full m-0 mt-0" forceMount style={{ display: activeTab === 'lucide' ? 'block' : 'none' }}>
              <ScrollArea className="h-[calc(80vh-220px)]">
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                  {filteredLucideIcons.map((iconName) => {
                    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
                    // Skip if icon doesn't exist
                    if (!IconComponent) return null;
                    return (
                      <button
                        key={iconName}
                        onClick={() => handleLucideSelect(iconName)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border hover:bg-muted hover:border-[hsl(var(--buildix-primary))] transition-colors aspect-square",
                          "group"
                        )}
                        title={iconName}
                      >
                        <IconComponent className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>
                {lucideIconNames.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading icons...
                  </div>
                )}
                {lucideIconNames.length > 0 && filteredLucideIcons.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No icons found for "{searchQuery}"
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Iconify Icons */}
            <TabsContent value="iconify" className="h-full m-0 mt-0" forceMount style={{ display: activeTab === 'iconify' ? 'block' : 'none' }}>
              <div className="flex flex-col h-[calc(80vh-220px)]">
                {/* Icon Set Selector */}
                <div className="mb-4 flex gap-2 flex-wrap">
                  <select
                    value={selectedIconifySet}
                    onChange={(e) => setSelectedIconifySet(e.target.value)}
                    className="h-8 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {iconifySets.map((set) => (
                      <option key={set.prefix} value={set.prefix}>
                        {set.name} ({set.count.toLocaleString()}+ icons)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icons Grid */}
                <ScrollArea className="flex-1">
                  {isLoadingIconify ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading icons...
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                      {(searchQuery ? iconifySearchResults : iconifyIcons).map((icon) => (
                        <button
                          key={`${icon.prefix}:${icon.name}`}
                          onClick={() => handleIconifySelect(icon)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2 rounded-md border hover:bg-muted hover:border-[hsl(var(--buildix-primary))] transition-colors aspect-square",
                            "group relative"
                          )}
                          title={`${icon.prefix}:${icon.name}`}
                        >
                          <img
                            src={`https://api.iconify.design/${icon.prefix}/${icon.name}.svg`}
                            alt={icon.name}
                            className="h-5 w-5 dark:invert"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {!isLoadingIconify && searchQuery && iconifySearchResults.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      No icons found for "{searchQuery}" in {selectedIconifySet}
                    </div>
                  )}
                  {!isLoadingIconify && !searchQuery && iconifyIcons.length === 0 && (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                      No icons loaded. Try selecting a different icon set.
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Mingcute Icons */}
            <TabsContent value="mingcute" className="h-full m-0 mt-0" forceMount style={{ display: activeTab === 'mingcute' ? 'block' : 'none' }}>
              <ScrollArea className="h-[calc(80vh-220px)]">
                <div className="space-y-4">
                  {mingcuteCategories.map((category) => {
                    const filteredCategoryIcons = category.icons.filter(icon =>
                      !searchQuery || `${category.name}/${icon}`.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (filteredCategoryIcons.length === 0) return null;
                    return (
                      <div key={category.name}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 capitalize">{category.name}</h3>
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                          {filteredCategoryIcons.map((iconName) => (
                            <button
                              key={`${category.name}/${iconName}`}
                              onClick={() => handleMingcuteSelect(`${category.name}/${iconName}`)}
                              className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-md border hover:bg-muted hover:border-[hsl(var(--buildix-primary))] transition-colors aspect-square",
                                "group"
                              )}
                              title={iconName}
                            >
                              <span className="text-xs truncate max-w-full">{iconName.slice(0, 3)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Simple Icons (Logos) */}
            <TabsContent value="logos" className="h-full m-0 mt-0" forceMount style={{ display: activeTab === 'logos' ? 'block' : 'none' }}>
              <ScrollArea className="h-[calc(80vh-220px)]">
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filteredSimpleIcons.map((slug) => (
                    <button
                      key={slug}
                      onClick={() => handleSimpleIconSelect(slug)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md border hover:bg-muted hover:border-[hsl(var(--buildix-primary))] transition-colors aspect-square",
                        "group"
                      )}
                      title={slug}
                    >
                      <img
                        src={`https://cdn.simpleicons.org/${slug}`}
                        alt={slug}
                        className="h-6 w-6 dark:invert"
                        loading="lazy"
                        onError={(e) => {
                          // Hide broken images
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs font-medium uppercase">${slug.slice(0, 3)}</span>`;
                        }}
                      />
                    </button>
                  ))}
                </div>
                {filteredSimpleIcons.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No logos found for "{searchQuery}"
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Skill Icons */}
            <TabsContent value="skills" className="h-full m-0 mt-0" forceMount style={{ display: activeTab === 'skills' ? 'block' : 'none' }}>
              <ScrollArea className="h-[calc(80vh-220px)]">
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {filteredSkillIcons.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleSkillIconSelect(name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-md border hover:bg-muted hover:border-[hsl(var(--buildix-primary))] transition-colors aspect-square",
                        "group"
                      )}
                      title={name}
                    >
                      <img
                        src={`https://go-skill-icons.vercel.app/api/icons?i=${name}`}
                        alt={name}
                        className="h-8 w-8 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to simple text if image fails
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-xs font-medium">${name.slice(0, 3).toUpperCase()}</span>`;
                        }}
                      />
                    </button>
                  ))}
                </div>
                {filteredSkillIcons.length === 0 && (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No skill icons found for "{searchQuery}"
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
