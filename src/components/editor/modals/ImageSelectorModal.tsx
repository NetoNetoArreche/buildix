"use client";

import { useState } from "react";
import { Search, Sparkles, ImageIcon, Upload, Palette } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BuildixGalleryTab } from "./image-tabs/BuildixGalleryTab";
import { UnsplashTab } from "./image-tabs/UnsplashTab";
import { PexelsTab } from "./image-tabs/PexelsTab";
import { MyImagesTab } from "./image-tabs/MyImagesTab";
import { AIGenerateTab } from "./image-tabs/AIGenerateTab";
import { cn } from "@/lib/utils";

interface ImageSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (imageUrl: string) => void;
}

const CATEGORIES = [
  "abstract",
  "portrait",
  "landscape",
  "architecture",
  "nature",
  "minimal",
];

const COLORS = [
  { name: "red", color: "#ef4444" },
  { name: "orange", color: "#f97316" },
  { name: "yellow", color: "#eab308" },
  { name: "green", color: "#22c55e" },
  { name: "blue", color: "#3b82f6" },
  { name: "purple", color: "#a855f7" },
  { name: "pink", color: "#ec4899" },
  { name: "black", color: "#171717" },
  { name: "white", color: "#ffffff" },
];

const ASPECT_RATIOS = ["all", "landscape", "portrait", "square"];

export function ImageSelectorModal({
  open,
  onOpenChange,
  onSelectImage,
}: ImageSelectorModalProps) {
  const [activeTab, setActiveTab] = useState("buildix");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | null>(
    "all"
  );

  const handleSelect = (url: string) => {
    onSelectImage(url);
    onOpenChange(false);
  };

  const showFilters = ["buildix", "unsplash", "pexels"].includes(activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Background Image</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="buildix" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Buildix</span>
              </TabsTrigger>
              <TabsTrigger value="unsplash" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Unsplash</span>
              </TabsTrigger>
              <TabsTrigger value="pexels" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Pexels</span>
              </TabsTrigger>
              <TabsTrigger value="mine" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Mine</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Generate</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search & Filters */}
          {showFilters && (
            <div className="flex flex-col gap-3 px-6 py-4 border-b">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === cat ? null : cat
                      )
                    }
                    className="capitalize"
                  >
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Color & Aspect Ratio Filters */}
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <div className="flex gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                          selectedColor === c.name
                            ? "border-[hsl(var(--buildix-primary))] scale-110"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c.color }}
                        onClick={() =>
                          setSelectedColor(
                            selectedColor === c.name ? null : c.name
                          )
                        }
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Aspect:</span>
                  {ASPECT_RATIOS.map((ar) => (
                    <Button
                      key={ar}
                      variant={
                        selectedAspectRatio === ar ? "secondary" : "ghost"
                      }
                      size="sm"
                      onClick={() => setSelectedAspectRatio(ar)}
                      className="capitalize"
                    >
                      {ar}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Contents */}
          <div className="flex-1 overflow-hidden px-6 py-4">
            <TabsContent value="buildix" className="h-full m-0 mt-0">
              <BuildixGalleryTab
                searchQuery={searchQuery}
                category={selectedCategory}
                color={selectedColor}
                aspectRatio={selectedAspectRatio}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="unsplash" className="h-full m-0 mt-0">
              <UnsplashTab
                searchQuery={searchQuery}
                color={selectedColor}
                aspectRatio={selectedAspectRatio}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="pexels" className="h-full m-0 mt-0">
              <PexelsTab
                searchQuery={searchQuery}
                color={selectedColor}
                aspectRatio={selectedAspectRatio}
                onSelect={handleSelect}
              />
            </TabsContent>
            <TabsContent value="mine" className="h-full m-0 mt-0">
              <MyImagesTab onSelect={handleSelect} />
            </TabsContent>
            <TabsContent value="ai" className="h-full m-0 mt-0">
              <AIGenerateTab onSelect={handleSelect} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
