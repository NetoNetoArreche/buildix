"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCommunityStore } from "@/stores/communityStore";
import { useProjectStore } from "@/stores/projectStore";
import type { TemplateCategory } from "@/types/community";
import {
  Globe,
  Loader2,
  X,
  Sparkles,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Upload,
  MonitorPlay,
} from "lucide-react";
import { ScreenCaptureOverlay } from "./ScreenCaptureOverlay";

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "landing", label: "Landing Page" },
  { value: "portfolio", label: "Portfolio" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "agency", label: "Agency" },
  { value: "startup", label: "Startup" },
  { value: "saas", label: "SaaS" },
  { value: "personal", label: "Personal" },
];

export function PublishModal() {
  const router = useRouter();
  const { isPublishModalOpen, closePublishModal, openPublishModal, publishingProjectId } =
    useCommunityStore();
  const { currentProject } = useProjectStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("landing");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allowRemix, setAllowRemix] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isScreenCaptureOpen, setIsScreenCaptureOpen] = useState(false);

  // Ref para guardar o projectId durante a captura de tela
  const captureProjectIdRef = useRef<string | null>(null);

  // Reset form when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Só reseta o form se não for para abrir o screen capture
      if (!isScreenCaptureOpen) {
        closePublishModal();
        // Reset after animation
        setTimeout(() => {
          setTitle("");
          setDescription("");
          setCategory("landing");
          setTags([]);
          setTagInput("");
          setAllowRemix(true);
          setError(null);
          setPublishedUrl(null);
          setThumbnail(null);
        }, 200);
      }
    }
  };

  // Initialize with project name when modal opens
  const handleOpen = () => {
    if (currentProject && !title) {
      setTitle(currentProject.name);
      setDescription(currentProject.description || "");
    }
  };

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Handle tag input keydown
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 300KB)
    if (file.size > 300 * 1024) {
      setError("Image must be less than 300KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize if needed
        const canvas = document.createElement("canvas");
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        setThumbnail(canvas.toDataURL("image/jpeg", 0.8));
        setError(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Abrir screen capture (fecha dialog primeiro para evitar conflito de eventos)
  const handleOpenScreenCapture = () => {
    // Guarda o projectId no ref antes de fechar
    captureProjectIdRef.current = publishingProjectId;
    // Fecha o dialog do Radix (para liberar eventos)
    closePublishModal();
    // Abre o overlay de captura
    setIsScreenCaptureOpen(true);
  };

  // Handle screen capture - recebe imagem e reabre o modal
  const handleScreenCapture = (imageDataUrl: string) => {
    setThumbnail(imageDataUrl);
    setError(null);
    setIsScreenCaptureOpen(false);
    // Reabre o modal após captura usando o ref
    const projectId = captureProjectIdRef.current;
    if (projectId) {
      setTimeout(() => openPublishModal(projectId), 50);
    }
    captureProjectIdRef.current = null;
  };

  // Cancelar captura - reabre o modal
  const handleCaptureCancel = () => {
    setIsScreenCaptureOpen(false);
    // Reabre o modal usando o ref
    const projectId = captureProjectIdRef.current;
    if (projectId) {
      setTimeout(() => openPublishModal(projectId), 50);
    }
    captureProjectIdRef.current = null;
  };

  // Publish
  const handlePublish = async () => {
    if (!publishingProjectId || !title.trim() || !category) {
      setError("Please fill in all required fields");
      return;
    }

    if (!thumbnail) {
      setError("Please add a preview image");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch("/api/community/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: publishingProjectId,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          tags,
          allowRemix,
          thumbnail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish");
      }

      setPublishedUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (publishedUrl) {
      const fullUrl = `${window.location.origin}${publishedUrl}`;
      navigator.clipboard.writeText(fullUrl);
    }
  };

  // View template
  const handleViewTemplate = () => {
    if (publishedUrl) {
      router.push(publishedUrl);
      closePublishModal();
    }
  };

  return (
    <>
    <Dialog
      open={isPublishModalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={handleOpen}
      >
        {publishedUrl ? (
          // Success state
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <DialogTitle className="text-center">Published Successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Your template is now live and available for the community.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 rounded-lg border bg-muted/50 p-4 overflow-hidden">
              <div className="flex items-center gap-3 min-w-0">
                <LinkIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <code className="flex-1 text-sm truncate min-w-0">
                  {window.location.origin}{publishedUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyUrl} className="shrink-0">
                  Copy
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => closePublishModal()}>
                Close
              </Button>
              <Button onClick={handleViewTemplate}>
                <Globe className="mr-2 h-4 w-4" />
                View Template
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Publish to Community
              </DialogTitle>
              <DialogDescription>
                Share your creation with the Buildix community. Others can discover and remix your template.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="My Awesome Template"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  className="bg-muted/50 border-muted-foreground/20"
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/60 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="A brief description of your template..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="bg-muted/50 border-muted-foreground/20 resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                  <SelectTrigger className="bg-muted/50 border-muted-foreground/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (up to 5)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={tags.length >= 5}
                    className="bg-muted/50 border-muted-foreground/20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || tags.length >= 5}
                    className="border-muted-foreground/20"
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 bg-muted">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="space-y-3 rounded-xl bg-muted/30 p-4 border border-muted-foreground/10">
                <div>
                  <Label className="text-sm font-medium">Preview Image (required)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 300 KB, 800×600 pixels
                  </p>
                </div>

                {thumbnail ? (
                  <div className="relative rounded-lg overflow-hidden border border-muted-foreground/20">
                    <img
                      src={thumbnail}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setThumbnail(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl bg-background/50 border border-muted-foreground/20 p-4 cursor-pointer hover:bg-background/80 hover:border-primary/50 transition-all">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleOpenScreenCapture}
                      className="flex flex-col items-center justify-center gap-2 rounded-xl bg-background/50 border border-muted-foreground/20 p-4 hover:bg-background/80 hover:border-primary/50 transition-all"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <MonitorPlay className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium">Screenshot</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3 rounded-xl bg-muted/30 p-4 border border-muted-foreground/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="remix"
                      checked={allowRemix}
                      onCheckedChange={setAllowRemix}
                    />
                    <div>
                      <Label htmlFor="remix" className="text-sm font-medium cursor-pointer">Allow Remixing</Label>
                      <p className="text-xs text-muted-foreground">
                        Let others create their own version
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => closePublishModal()}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isPublishing || !title.trim()}>
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

    </Dialog>

    {/* Screen Capture Overlay - renderizado FORA do Dialog para evitar conflito de eventos */}
    {isScreenCaptureOpen && (
      <ScreenCaptureOverlay
        onCapture={handleScreenCapture}
        onCancel={handleCaptureCancel}
      />
    )}
    </>
  );
}
