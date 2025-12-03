"use client";

import { useState, useCallback } from "react";
import { Layers, Pencil, Trash2, Code, Video, Image as ImageIcon, GripVertical, Eye, EyeOff } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Button } from "@/components/ui/button";
import { AssetBackgroundModal } from "@/components/editor/modals/AssetBackgroundModal";
import { useEditorStore } from "@/stores/editorStore";
import { cn } from "@/lib/utils";
import type { BackgroundAsset } from "@/types";

export function BackgroundAssetSection() {
  const { backgroundAssets, updateBackgroundAsset, removeBackgroundAsset } = useEditorStore();
  const [editingAsset, setEditingAsset] = useState<BackgroundAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = useCallback((asset: BackgroundAsset) => {
    setEditingAsset(asset);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to remove this background asset?")) {
        removeBackgroundAsset(id);
      }
    },
    [removeBackgroundAsset]
  );

  const handleToggleVisibility = useCallback(
    (asset: BackgroundAsset) => {
      updateBackgroundAsset(asset.id, {
        opacity: asset.opacity === 0 ? 100 : 0,
      });
    },
    [updateBackgroundAsset]
  );

  const handleApplyEdit = useCallback(
    (asset: BackgroundAsset) => {
      if (editingAsset) {
        updateBackgroundAsset(editingAsset.id, asset);
      }
      setEditingAsset(null);
      setIsModalOpen(false);
    },
    [editingAsset, updateBackgroundAsset]
  );

  const handleModalClose = useCallback((open: boolean) => {
    if (!open) {
      setEditingAsset(null);
    }
    setIsModalOpen(open);
  }, []);

  const getAssetIcon = (type: BackgroundAsset["type"]) => {
    switch (type) {
      case "embed":
        return Code;
      case "video":
        return Video;
      case "image":
        return ImageIcon;
      default:
        return Layers;
    }
  };

  const getAssetPreview = (asset: BackgroundAsset) => {
    if (asset.type === "image" && asset.src) {
      return (
        <img
          src={asset.src}
          alt="Background preview"
          className="w-full h-full object-cover"
        />
      );
    }

    if (asset.type === "video" && asset.src) {
      return (
        <video
          src={asset.src}
          muted
          className="w-full h-full object-cover"
        />
      );
    }

    const Icon = getAssetIcon(asset.type);
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  };

  if (backgroundAssets.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Background Assets"
      icon={<Layers className="h-4 w-4" />}
      badge={backgroundAssets.length}
    >
      <div className="space-y-2">
        {backgroundAssets.map((asset) => {
          const Icon = getAssetIcon(asset.type);
          const isHidden = asset.opacity === 0;

          return (
            <div
              key={asset.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border bg-card transition-colors",
                isHidden && "opacity-50"
              )}
            >
              {/* Drag Handle */}
              <div className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              {/* Preview Thumbnail */}
              <div className="w-10 h-10 rounded overflow-hidden border shrink-0">
                {getAssetPreview(asset)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium capitalize truncate">
                    {asset.type}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {asset.embedType ? `${asset.embedType}` : ""}
                  {asset.blendMode !== "normal" ? ` • ${asset.blendMode}` : ""}
                  {asset.blur > 0 ? ` • blur(${asset.blur}px)` : ""}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleToggleVisibility(asset)}
                  title={isHidden ? "Show" : "Hide"}
                >
                  {isHidden ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEdit(asset)}
                  title="Edit"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(asset.id)}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <AssetBackgroundModal
        open={isModalOpen}
        onOpenChange={handleModalClose}
        onApplyAsset={handleApplyEdit}
        editingAsset={editingAsset}
      />
    </CollapsibleSection>
  );
}
