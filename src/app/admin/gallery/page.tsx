"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Upload,
  Link,
  X,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface GalleryImage {
  id: string;
  url: string;
  thumb: string | null;
  alt: string | null;
  category: string;
  color: string | null;
  aspectRatio: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "abstract",
  "nature",
  "architecture",
  "portrait",
  "landscape",
  "minimal",
  "technology",
  "business",
  "lifestyle",
  "gradient",
];

const ASPECT_RATIOS = [
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "Square", value: "square" },
];

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Upload states
  const [uploadMode, setUploadMode] = useState<"upload" | "url">("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("abstract");
  const [uploadTags, setUploadTags] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for URL mode
  const [formData, setFormData] = useState({
    url: "",
    thumb: "",
    alt: "",
    category: "abstract",
    color: "#8b5cf6",
    aspectRatio: "landscape",
    tags: "",
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/admin/gallery");
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    setSelectedFiles(prev => [...prev, ...imageFiles]);
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
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Compress image to reduce file size (max 4MB for Vercel limit)
  const compressImage = async (file: File, maxSizeMB: number = 3.5): Promise<File> => {
    // If file is already small enough, return as-is
    if (file.size <= maxSizeMB * 1024 * 1024) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Reduce dimensions if image is very large
          const maxDimension = 2400;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to get under the size limit
          const tryCompress = (quality: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }

                if (blob.size <= maxSizeMB * 1024 * 1024 || quality <= 0.3) {
                  const compressedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Try again with lower quality
                  tryCompress(quality - 0.1);
                }
              },
              "image/jpeg",
              quality
            );
          };

          tryCompress(0.85);
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Compress images before upload
    const compressedFiles: File[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadProgress(Math.round((i / selectedFiles.length) * 30)); // 0-30% for compression
      const compressed = await compressImage(selectedFiles[i]);
      compressedFiles.push(compressed);
    }

    setUploadProgress(35);

    const formData = new FormData();
    compressedFiles.forEach(file => {
      formData.append("files", file);
    });
    formData.append("category", uploadCategory);
    formData.append("tags", uploadTags);

    try {
      setUploadProgress(40);
      const response = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setImages(prev => [...data.images, ...prev]);
        setSelectedFiles([]);
        setUploadTags("");
        setIsCreateOpen(false);

        if (data.errors && data.errors.length > 0) {
          alert(`Uploaded ${data.uploaded} images. ${data.failed} failed.`);
        }
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFromUrl = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        const newImage = await response.json();
        setImages((prev) => [newImage, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingImage) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/gallery/${editingImage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
        setEditingImage(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to update image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/gallery/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setImages((prev) => prev.filter((img) => img.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete image:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (image: GalleryImage) => {
    try {
      const response = await fetch(`/api/admin/gallery/${image.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !image.isActive }),
      });

      if (response.ok) {
        const updated = await response.json();
        setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));
      }
    } catch (error) {
      console.error("Failed to toggle image:", error);
    }
  };

  const openEdit = (image: GalleryImage) => {
    setFormData({
      url: image.url,
      thumb: image.thumb || "",
      alt: image.alt || "",
      category: image.category,
      color: image.color || "#8b5cf6",
      aspectRatio: image.aspectRatio || "landscape",
      tags: image.tags.join(", "),
    });
    setPreviewUrl(image.url);
    setEditingImage(image);
  };

  const resetForm = () => {
    setFormData({
      url: "",
      thumb: "",
      alt: "",
      category: "abstract",
      color: "#8b5cf6",
      aspectRatio: "landscape",
      tags: "",
    });
    setPreviewUrl("");
    setSelectedFiles([]);
    setUploadTags("");
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, url });
    setPreviewUrl(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredImages = images.filter((img) => {
    const matchesSearch =
      img.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || img.category === categoryFilter;
    const matchesAspect = aspectFilter === "all" || img.aspectRatio === aspectFilter;
    return matchesSearch && matchesCategory && matchesAspect;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gallery Images</h1>
          <p className="text-zinc-400">Manage images available in the editor</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setUploadMode("upload");
              setIsCreateOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Images
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by alt text or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-zinc-700 bg-zinc-800 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={aspectFilter} onValueChange={setAspectFilter}>
          <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Aspect Ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All aspects</SelectItem>
            {ASPECT_RATIOS.map((aspect) => (
              <SelectItem key={aspect.value} value={aspect.value}>
                {aspect.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-zinc-400">
        <span>Total: {images.length} images</span>
        <span>Active: {images.filter((i) => i.isActive).length}</span>
        <span>Filtered: {filteredImages.length}</span>
      </div>

      {/* Image Grid - Masonry Layout */}
      {filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
          <p>No images found</p>
          <Button
            variant="link"
            className="text-violet-400 mt-2"
            onClick={() => setIsCreateOpen(true)}
          >
            Upload your first images
          </Button>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className={`group relative rounded-lg border overflow-hidden transition-all hover:border-violet-500 break-inside-avoid mb-4 ${
                image.isActive ? "border-zinc-700 bg-zinc-800" : "border-zinc-800 bg-zinc-900 opacity-60"
              }`}
            >
              {/* Image Preview */}
              <div className="relative overflow-hidden bg-zinc-900">
                <img
                  src={image.thumb || image.url}
                  alt={image.alt || "Gallery image"}
                  className="w-full h-auto transition-transform group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%2327272a' width='100' height='100'/%3E%3Ctext fill='%2371717a' font-family='sans-serif' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo image%3C/text%3E%3C/svg%3E";
                  }}
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => window.open(image.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => copyToClipboard(image.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {/* Color Badge */}
                {image.color && (
                  <div
                    className="absolute top-2 left-2 w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: image.color }}
                    title={`Color: ${image.color}`}
                  />
                )}
              </div>

              {/* Image Info */}
              <div className="p-2">
                <div className="flex items-center justify-between gap-1">
                  <Badge variant="secondary" className="text-[10px] bg-zinc-700 text-zinc-300 truncate">
                    {image.category}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-400 hover:text-white"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(image)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(image)}>
                        {image.isActive ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setDeleteId(image.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {image.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {image.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[9px] text-zinc-500">
                        #{tag}
                      </span>
                    ))}
                    {image.tags.length > 2 && (
                      <span className="text-[9px] text-zinc-600">+{image.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Upload Dialog */}
      <Dialog
        open={isCreateOpen || !!editingImage}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingImage(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingImage ? "Edit Image" : "Add Images"}</DialogTitle>
            <DialogDescription>
              {editingImage ? "Update the image details" : "Upload images or add from URL"}
            </DialogDescription>
          </DialogHeader>

          {!editingImage && (
            <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as "upload" | "url")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Files
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  From URL
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="space-y-4 mt-4">
                {/* Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragging
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 mx-auto mb-4 text-zinc-500" />
                  <p className="text-white font-medium">
                    Drag and drop images here
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    or click to browse (PNG, JPG, WebP)
                  </p>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{selectedFiles.length} files selected</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles([])}
                        className="text-zinc-400 hover:text-white"
                      >
                        Clear all
                      </Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-md overflow-hidden bg-zinc-800"
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                            <p className="text-[10px] text-white truncate">{file.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category for all</Label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tags for all (comma separated)</Label>
                    <Input
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="abstract, dark, modern"
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                  </div>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Uploading...</span>
                      <span className="text-white">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading {selectedFiles.length} images...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} {selectedFiles.length === 1 ? "image" : "images"}
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* URL Tab */}
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Image URL *</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                {previewUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative h-48 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="thumb">Thumbnail URL (optional)</Label>
                  <Input
                    id="thumb"
                    value={formData.thumb}
                    onChange={(e) => setFormData({ ...formData, thumb: e.target.value })}
                    placeholder="https://example.com/thumb.jpg"
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={formData.alt}
                    onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                    placeholder="Describe the image"
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                    <Select
                      value={formData.aspectRatio}
                      onValueChange={(value) => setFormData({ ...formData, aspectRatio: value })}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((aspect) => (
                          <SelectItem key={aspect.value} value={aspect.value}>
                            {aspect.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Dominant Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-9 w-9 cursor-pointer rounded border border-zinc-700 bg-transparent"
                    />
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#8b5cf6"
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="purple, abstract, gradient, dark"
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                <Button
                  onClick={handleCreateFromUrl}
                  disabled={isSaving || !formData.url || !formData.category}
                  className="w-full bg-violet-600 hover:bg-violet-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Image
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {/* Edit Mode */}
          {editingImage && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="url">Image URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              {previewUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative h-48 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="thumb">Thumbnail URL (optional)</Label>
                <Input
                  id="thumb"
                  value={formData.thumb}
                  onChange={(e) => setFormData({ ...formData, thumb: e.target.value })}
                  placeholder="https://example.com/thumb.jpg"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt">Alt Text</Label>
                <Input
                  id="alt"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  placeholder="Describe the image"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select
                    value={formData.aspectRatio}
                    onValueChange={(value) => setFormData({ ...formData, aspectRatio: value })}
                  >
                    <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((aspect) => (
                        <SelectItem key={aspect.value} value={aspect.value}>
                          {aspect.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Dominant Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-9 w-9 cursor-pointer rounded border border-zinc-700 bg-transparent"
                  />
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#8b5cf6"
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="purple, abstract, gradient, dark"
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingImage(null);
                    resetForm();
                  }}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isSaving || !formData.url || !formData.category}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
