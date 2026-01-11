"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Loader2, Trash2, Pencil, ArrowLeft, Wand2, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Valid image magic bytes signatures
const IMAGE_SIGNATURES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF header, also check WEBP at offset 8
};

// Validate file by checking magic bytes
async function validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Size check (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "File too large. Maximum size is 10MB" };
  }

  // Read first 12 bytes for magic byte validation
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { valid: true };
  }

  // Check PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { valid: true };
  }

  // Check GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { valid: true };
  }

  // Check WebP (RIFF + WEBP)
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return { valid: true };
  }

  return { valid: false, error: "Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed." };
}

interface ImageItem {
  id: string;
  url: string;
  thumb: string;
  alt?: string;
  source: string;
}

interface MyImagesTabProps {
  onSelect: (url: string) => void;
}

export function MyImagesTab({ onSelect }: MyImagesTabProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Upload error state
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload usage state
  const [uploadUsage, setUploadUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
    isLimitReached: boolean;
  } | null>(null);

  // Fetch upload usage
  const fetchUploadUsage = useCallback(async () => {
    try {
      const response = await fetch("/api/images/usage");
      if (response.ok) {
        const data = await response.json();
        setUploadUsage(data.uploads);
      }
    } catch (error) {
      console.error("Failed to fetch upload usage:", error);
    }
  }, []);

  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/images/my-images");
      const data = await response.json();
      if (data.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch user images:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchUploadUsage();
  }, [fetchImages, fetchUploadUsage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        // Validate file using magic bytes before uploading
        const validation = await validateImageFile(file);
        if (!validation.valid) {
          setUploadError(validation.error || "Invalid file");
          continue;
        }

        // 1. Get presigned URL
        const presignedResponse = await fetch(
          `/api/images/upload?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`
        );

        // Check for upload limit error
        if (presignedResponse.status === 403) {
          const errorData = await presignedResponse.json();
          if (errorData.code === "UPLOAD_LIMIT_REACHED") {
            setUploadError(`Limite de uploads atingido (${errorData.limit} imagens). Faça upgrade para continuar.`);
            break;
          }
          setUploadError(errorData.error || "Upload not allowed");
          break;
        }

        if (!presignedResponse.ok) {
          const errorData = await presignedResponse.json();
          setUploadError(errorData.error || "Failed to get upload URL");
          continue;
        }

        const { presignedUrl, key, publicUrl } = await presignedResponse.json();

        // 2. Upload to S3
        await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        // 3. Confirm upload and save to DB
        await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            publicUrl,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });
      }

      // Refresh image list and usage
      await fetchImages();
      await fetchUploadUsage();
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Just select the image (don't apply)
  const handleImageClick = (image: ImageItem) => {
    setSelectedId(image.id);
    setSelectedImage(image);
  };

  // Apply the selected image
  const handleUseImage = () => {
    if (selectedImage) {
      onSelect(selectedImage.url);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await fetch(`/api/images/my-images/${imageId}`, {
        method: "DELETE",
      });
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (selectedId === imageId) {
        setSelectedId(null);
        setSelectedImage(null);
      }
      // Refresh usage after delete
      await fetchUploadUsage();
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleEditClick = () => {
    if (selectedImage) {
      setEditingImage(selectedImage);
      setIsEditMode(true);
      setEditPrompt("");
      setEditError(null);
    }
  };

  const handleEditImage = async () => {
    if (!editingImage || !editPrompt.trim()) return;

    setIsEditing(true);
    setEditError(null);

    try {
      const response = await fetch("/api/images/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: editingImage.url,
          editPrompt: editPrompt.trim(),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setEditError(data.error);
        return;
      }

      if (data.image) {
        // Add the edited image to the list
        setImages((prev) => [data.image, ...prev]);
        // Select the new edited image
        setSelectedId(data.image.id);
        setSelectedImage(data.image);
        // Exit edit mode
        setIsEditMode(false);
        setEditingImage(null);
        setEditPrompt("");
      }
    } catch (error) {
      console.error("AI edit failed:", error);
      setEditError("Failed to edit image. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleBackFromEdit = () => {
    setIsEditMode(false);
    setEditingImage(null);
    setEditPrompt("");
    setEditError(null);
  };

  // Edit mode UI
  if (isEditMode && editingImage) {
    return (
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackFromEdit}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-medium">Edit Image with AI</h3>
        </div>

        {/* Image Preview */}
        <div className="relative flex-shrink-0 rounded-lg overflow-hidden bg-muted aspect-video max-h-[200px] flex items-center justify-center">
          <img
            src={editingImage.url}
            alt={editingImage.alt || "Image to edit"}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Edit Prompt Input */}
        <div className="space-y-3">
          <div className="relative">
            <Wand2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Describe what changes you want to make..."
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEditImage();
                }
              }}
            />
          </div>

          <Button
            variant="buildix"
            onClick={handleEditImage}
            disabled={isEditing || !editPrompt.trim()}
            className="w-full"
          >
            {isEditing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            <span className="ml-2">{isEditing ? "Editing..." : "Apply AI Edit"}</span>
          </Button>
        </div>

        {/* Error Message */}
        {editError && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {editError}
          </div>
        )}

        {/* Edit Suggestions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Remove the background",
              "Make it brighter",
              "Add a blue sky",
              "Change colors to warm tones",
              "Add more contrast",
              "Make it look vintage",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setEditPrompt(suggestion)}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Upload Usage Indicator */}
      {uploadUsage && !uploadUsage.isUnlimited && (
        <div className="mb-3 p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Imagens enviadas</span>
            <span className={cn(
              "font-medium",
              uploadUsage.isLimitReached ? "text-destructive" : "text-foreground"
            )}>
              {uploadUsage.used}/{uploadUsage.limit}
            </span>
          </div>
          <Progress
            value={(uploadUsage.used / uploadUsage.limit) * 100}
            className={cn(
              "h-1.5",
              uploadUsage.isLimitReached && "[&>div]:bg-destructive"
            )}
          />
          {uploadUsage.isLimitReached && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
              <Crown className="h-3 w-3" />
              <span>Faça upgrade para mais uploads</span>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          variant="outline"
          className={cn(
            "w-full h-20 border-dashed flex flex-col gap-1",
            uploadUsage?.isLimitReached && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !uploadUsage?.isLimitReached && fileInputRef.current?.click()}
          disabled={isUploading || uploadUsage?.isLimitReached}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : uploadUsage?.isLimitReached ? (
            <>
              <Crown className="h-5 w-5 text-amber-500" />
              <span className="text-sm">Limite de uploads atingido</span>
              <span className="text-xs text-muted-foreground">
                Faça upgrade para continuar
              </span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span className="text-sm">Click to upload images</span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 10MB
              </span>
            </>
          )}
        </Button>

        {/* Upload Error Message */}
        {uploadError && (
          <div className="mt-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
            {uploadError}
          </div>
        )}
      </div>

      {/* Action Buttons - Show when image is selected */}
      {selectedImage && (
        <div className="flex gap-2 mb-4">
          <Button
            variant="buildix"
            className="flex-1"
            onClick={handleUseImage}
          >
            <Check className="h-4 w-4 mr-2" />
            Use Image
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleEditClick}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit with AI
          </Button>
        </div>
      )}

      {/* Image Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-1">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => handleImageClick(image)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border-2 transition-all hover:border-[hsl(var(--buildix-primary))] aspect-square",
                  selectedId === image.id
                    ? "border-[hsl(var(--buildix-primary))] ring-2 ring-[hsl(var(--buildix-primary))]/20"
                    : "border-transparent"
                )}
              >
                <img
                  src={image.thumb}
                  alt={image.alt || "Image"}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {selectedId === image.id && (
                  <div className="absolute top-2 right-2">
                    <div className="rounded-full bg-[hsl(var(--buildix-primary))] p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
