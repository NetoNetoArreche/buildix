"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { User, Palette, Loader2, Save, Globe, Camera, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Cropper, { Area } from "react-easy-crop";

type Tab = "profile" | "preferences";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");

  // useCallback must be called before any conditional returns (Rules of Hooks)
  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // Fetch avatar from database on mount
  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch("/api/user/avatar");
        if (response.ok) {
          const data = await response.json();
          if (data.avatarUrl) {
            setCurrentAvatar(data.avatarUrl);
          }
        }
      } catch (error) {
        console.error("Failed to fetch avatar:", error);
      }
    };
    fetchAvatar();
  }, []);

  // Set initial avatar from session or fetched data
  const displayAvatar = currentAvatar || session?.user?.image || undefined;

  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  const tabs = [
    { id: "profile" as Tab, label: t("profile"), icon: User },
    { id: "preferences" as Tab, label: t("preferences"), icon: Palette },
  ];

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U";

  const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Set canvas size to the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return as blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas is empty"));
          }
        },
        "image/jpeg",
        0.95
      );
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
      // Reset crop settings
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarPreview || !croppedAreaPixels) return;

    setIsUploadingAvatar(true);

    try {
      // Step 1: Create cropped image blob
      const croppedImageBlob = await createCroppedImage(
        avatarPreview,
        croppedAreaPixels
      );

      // Step 2: Get presigned URL
      const presignedResponse = await fetch(
        `/api/images/upload?fileName=avatar.jpg&fileType=image/jpeg`
      );

      if (!presignedResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { presignedUrl, publicUrl } = await presignedResponse.json();

      // Step 3: Upload cropped image directly to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: croppedImageBlob,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3");
      }

      // Step 4: Update avatar in database
      const avatarResponse = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });

      if (!avatarResponse.ok) {
        throw new Error("Failed to update avatar");
      }

      // Step 5: Update local state to show new avatar immediately
      setCurrentAvatar(publicUrl);

      // Close dialog and reset
      setIsAvatarDialogOpen(false);
      setAvatarPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);

    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove avatar");
      }

      // Update local state to remove avatar immediately
      setCurrentAvatar("");

      setIsAvatarDialogOpen(false);
    } catch (error) {
      console.error("Error removing avatar:", error);
      alert("Failed to remove avatar. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[hsl(var(--buildix-primary))] text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 rounded-xl border bg-card p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("profile")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("profileDesc")}
                </p>
              </div>

              {/* Avatar Section with Edit Button */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={displayAvatar}
                      alt={session?.user?.name || "User"}
                    />
                    <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setIsAvatarDialogOpen(true)}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">{session?.user?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">
                    {session?.user?.email}
                  </p>
                  <button
                    onClick={() => setIsAvatarDialogOpen(true)}
                    className="mt-1 text-sm text-[hsl(var(--buildix-primary))] hover:underline"
                  >
                    Change avatar
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    defaultValue={session?.user?.name || ""}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={session?.user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <Button
                variant="buildix"
                disabled={isSaving}
                onClick={() => {
                  setIsSaving(true);
                  setTimeout(() => setIsSaving(false), 1000);
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon("loading")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {tCommon("save")}
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{t("preferences")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("preferencesDesc")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{t("theme")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("themeDesc")}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the toggle in the header
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{t("language")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("languageDesc")}
                      </p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Avatar</DialogTitle>
            <DialogDescription>
              Upload a new profile picture or remove the current one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area or Preview */}
            {avatarPreview ? (
              <div className="space-y-4">
                {/* Cropper */}
                <div className="relative h-64 w-full rounded-lg overflow-hidden bg-muted">
                  <Cropper
                    image={avatarPreview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                {/* Zoom Control */}
                <div className="flex items-center gap-3">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(values) => setZoom(values[0])}
                    min={1}
                    max={3}
                    step={0.1}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={displayAvatar} alt="Current avatar" />
                  <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="avatar-upload">
                {avatarPreview ? "Choose different image" : "Select image"}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="buildix"
                className="flex-1"
                disabled={!avatarPreview || isUploadingAvatar}
                onClick={handleUploadAvatar}
              >
                {isUploadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
              {displayAvatar && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={isUploadingAvatar}
                  onClick={handleRemoveAvatar}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
