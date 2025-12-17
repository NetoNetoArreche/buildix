"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Trash2,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Loader2,
  X,
  FolderOpen,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  category?: string;
  source: string;
  filename?: string;
}

const GALLERY_CATEGORIES = [
  { id: "all", name: "All" },
  { id: "abstract", name: "Abstract" },
  { id: "gradient", name: "Gradient" },
  { id: "minimal", name: "Minimal" },
  { id: "nature", name: "Nature" },
  { id: "technology", name: "Technology" },
  { id: "business", name: "Business" },
  { id: "lifestyle", name: "Lifestyle" },
];

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<"my-assets" | "gallery">("my-assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [myAssetsCategory, setMyAssetsCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // My Assets state with pagination
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [isLoadingMyAssets, setIsLoadingMyAssets] = useState(true);
  const [isLoadingMoreMyAssets, setIsLoadingMoreMyAssets] = useState(false);
  const [myAssetsPage, setMyAssetsPage] = useState(1);
  const [hasMoreMyAssets, setHasMoreMyAssets] = useState(true);
  const [totalMyAssets, setTotalMyAssets] = useState(0);

  // Gallery state with pagination
  const [galleryAssets, setGalleryAssets] = useState<Asset[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isLoadingMoreGallery, setIsLoadingMoreGallery] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [hasMoreGallery, setHasMoreGallery] = useState(true);

  // Upload state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch my assets with pagination
  const fetchMyAssets = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoadingMyAssets(true);
      } else {
        setIsLoadingMoreMyAssets(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (myAssetsCategory !== "all") {
        params.set("category", myAssetsCategory);
      }

      const response = await fetch(`/api/images/my-images?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setMyAssets(data.images || []);
        } else {
          setMyAssets((prev) => [...prev, ...(data.images || [])]);
        }
        setHasMoreMyAssets(data.pagination?.hasMore ?? false);
        setTotalMyAssets(data.pagination?.total ?? 0);
        setMyAssetsPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch my assets:", error);
    } finally {
      setIsLoadingMyAssets(false);
      setIsLoadingMoreMyAssets(false);
    }
  }, [myAssetsCategory]);

  // Fetch gallery assets with pagination
  const fetchGalleryAssets = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoadingGallery(true);
      } else {
        setIsLoadingMoreGallery(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
      });
      if (activeCategory !== "all") {
        params.set("category", activeCategory);
      }

      const response = await fetch(`/api/images/buildix?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (reset) {
          setGalleryAssets(data.images || []);
        } else {
          setGalleryAssets((prev) => [...prev, ...(data.images || [])]);
        }
        setHasMoreGallery(data.pagination?.hasMore ?? false);
        setGalleryPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setIsLoadingGallery(false);
      setIsLoadingMoreGallery(false);
    }
  }, [activeCategory]);

  // Initial fetch and refetch when myAssetsCategory changes
  useEffect(() => {
    setMyAssetsPage(1);
    fetchMyAssets(1, true);
  }, [myAssetsCategory]);

  // Fetch gallery when category changes
  useEffect(() => {
    setGalleryPage(1);
    fetchGalleryAssets(1, true);
  }, [activeCategory]);

  // Load more handlers
  const loadMoreMyAssets = useCallback(() => {
    if (!isLoadingMoreMyAssets && hasMoreMyAssets) {
      fetchMyAssets(myAssetsPage + 1, false);
    }
  }, [fetchMyAssets, myAssetsPage, isLoadingMoreMyAssets, hasMoreMyAssets]);

  const loadMoreGallery = useCallback(() => {
    if (!isLoadingMoreGallery && hasMoreGallery) {
      fetchGalleryAssets(galleryPage + 1, false);
    }
  }, [fetchGalleryAssets, galleryPage, isLoadingMoreGallery, hasMoreGallery]);

  // Infinite scroll hooks
  const { ref: myAssetsLoadMoreRef } = useInfiniteScroll(loadMoreMyAssets, {
    enabled: hasMoreMyAssets && !isLoadingMyAssets && !isLoadingMoreMyAssets && activeTab === "my-assets",
  });

  const { ref: galleryLoadMoreRef } = useInfiniteScroll(loadMoreGallery, {
    enabled: hasMoreGallery && !isLoadingGallery && !isLoadingMoreGallery && activeTab === "gallery",
  });

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        // Step 1: Get presigned URL
        const presignedResponse = await fetch(
          `/api/images/upload?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`
        );

        if (!presignedResponse.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { presignedUrl, key, publicUrl } = await presignedResponse.json();

        // Step 2: Upload directly to S3
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload to S3");
        }

        // Step 3: Confirm upload and save to database with category
        await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            publicUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            category: uploadCategory !== "all" ? uploadCategory : null,
          }),
        });
      }

      // Refresh my assets
      await fetchMyAssets(1, true);
      setSelectedFiles([]);
      setUploadCategory("all");
      setIsUploadOpen(false);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAsset) return;

    try {
      const response = await fetch(`/api/images/upload?id=${deleteAsset.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMyAssets((prev) => prev.filter((a) => a.id !== deleteAsset.id));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleteAsset(null);
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  // Filter assets based on search
  const filteredMyAssets = myAssets.filter((asset) =>
    asset.alt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGalleryAssets = galleryAssets.filter((asset) =>
    asset.alt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Browse and manage images and resources
          </p>
        </div>
        <Button variant="buildix" onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my-assets" | "gallery")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-assets" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            My Assets
            {totalMyAssets > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({totalMyAssets})
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Buildix Gallery
          </TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* My Assets Tab */}
        <TabsContent value="my-assets" className="mt-6 space-y-4">
          {/* Categories for My Assets */}
          <div className="flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={myAssetsCategory === category.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => setMyAssetsCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {isLoadingMyAssets ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMyAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
              <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No assets yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery
                  ? "No assets match your search"
                  : "Upload your first image to get started"}
              </p>
              {!searchQuery && (
                <Button variant="buildix" onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {filteredMyAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onCopy={copyToClipboard}
                  onDelete={() => setDeleteAsset(asset)}
                  canDelete
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMyAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  onCopy={copyToClipboard}
                  onDelete={() => setDeleteAsset(asset)}
                  canDelete
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel for My Assets */}
          {filteredMyAssets.length > 0 && (
            <div ref={myAssetsLoadMoreRef} className="flex justify-center py-8">
              {isLoadingMoreMyAssets && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              {!hasMoreMyAssets && filteredMyAssets.length > 0 && (
                <p className="text-sm text-muted-foreground">All assets loaded</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6 space-y-4">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {GALLERY_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {isLoadingGallery ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredGalleryAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No images found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try a different search term"
                  : "No images in this category yet"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {filteredGalleryAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGalleryAssets.map((asset) => (
                <AssetListItem
                  key={asset.id}
                  asset={asset}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel for Gallery */}
          {filteredGalleryAssets.length > 0 && (
            <div ref={galleryLoadMoreRef} className="flex justify-center py-8">
              {isLoadingMoreGallery && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              {!hasMoreGallery && filteredGalleryAssets.length > 0 && (
                <p className="text-sm text-muted-foreground">All images loaded</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Upload images to your personal asset library
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Drag and drop images here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse (PNG, JPG, WebP)
              </p>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedFiles.length} files selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear all
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-md overflow-hidden bg-muted"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="upload-category">Category (optional)</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger id="upload-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {GALLERY_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="w-full"
              variant="buildix"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? "image" : "images"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AssetCardProps {
  asset: Asset;
  onCopy: (url: string) => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

function AssetCard({ asset, onCopy, onDelete, canDelete }: AssetCardProps) {
  return (
    <div className="group relative rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md break-inside-avoid mb-4">
      <div className="relative bg-muted">
        {asset.url ? (
          <img
            src={asset.thumb || asset.url}
            alt={asset.alt || "Asset"}
            className="w-full h-auto"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.innerHTML =
                '<div class="flex items-center justify-center h-32"><svg class="h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-32">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(asset.url, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCopy(asset.url)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <AssetMenu asset={asset} onCopy={onCopy} onDelete={onDelete} canDelete={canDelete} />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium truncate">{asset.alt || "Untitled"}</h3>
        {asset.category && (
          <p className="text-xs text-muted-foreground capitalize">
            {asset.category}
          </p>
        )}
      </div>
    </div>
  );
}

function AssetListItem({ asset, onCopy, onDelete, canDelete }: AssetCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-all hover:border-[hsl(var(--buildix-primary))]/50">
      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {asset.url ? (
          <img
            src={asset.thumb || asset.url}
            alt={asset.alt || "Asset"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium truncate">{asset.alt || "Untitled"}</h3>
        {asset.category && (
          <p className="text-xs text-muted-foreground capitalize">
            {asset.category}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(asset.url, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCopy(asset.url)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <AssetMenu asset={asset} onCopy={onCopy} onDelete={onDelete} canDelete={canDelete} />
      </div>
    </div>
  );
}

interface AssetMenuProps {
  asset: Asset;
  onCopy: (url: string) => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

function AssetMenu({ asset, onCopy, onDelete, canDelete }: AssetMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => window.open(asset.url, "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in new tab
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopy(asset.url)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </DropdownMenuItem>
        {canDelete && onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
