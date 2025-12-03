"use client";

import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Video, Layers, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectAssetsInDocument, getAssetTypeLabel } from "@/lib/asset-detection";
import type { DetectedAsset } from "@/types";
import { cn, getPreviewIframe } from "@/lib/utils";

interface DesignAssetsTabProps {
  onSelectAsset: (asset: DetectedAsset) => void;
}

export function DesignAssetsTab({ onSelectAsset }: DesignAssetsTabProps) {
  const [assets, setAssets] = useState<DetectedAsset[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scanAssets = useCallback(() => {
    setIsScanning(true);
    setError(null);

    try {
      // Get the preview iframe (works in both normal and Canvas Mode)
      const iframe = getPreviewIframe();

      if (!iframe?.contentDocument) {
        setError("Could not access the design preview. Please try again.");
        setAssets([]);
        return;
      }

      const detected = detectAssetsInDocument(iframe.contentDocument);
      setAssets(detected);
    } catch (err) {
      console.error("Error scanning assets:", err);
      setError("Failed to scan assets in the design.");
      setAssets([]);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Scan assets when component mounts
  useEffect(() => {
    // Small delay to ensure iframe is ready
    const timer = setTimeout(scanAssets, 200);
    return () => clearTimeout(timer);
  }, [scanAssets]);

  const getAssetIcon = (type: DetectedAsset["type"]) => {
    switch (type) {
      case "img":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "background":
        return <Layers className="h-4 w-4" />;
    }
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  };

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm">Scanning your design for assets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={scanAssets}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageIcon className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm font-medium mb-1">No assets found</p>
        <p className="text-xs text-center max-w-xs">
          Your design doesn&apos;t contain any images, videos, or background images yet.
        </p>
        <Button variant="outline" size="sm" onClick={scanAssets} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  const imageAssets = assets.filter((a) => a.type === "img");
  const videoAssets = assets.filter((a) => a.type === "video");
  const backgroundAssets = assets.filter((a) => a.type === "background");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Found <span className="font-medium text-foreground">{assets.length}</span>{" "}
          {assets.length === 1 ? "asset" : "assets"} in your design
        </div>
        <Button variant="ghost" size="sm" onClick={scanAssets}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-6 pr-4">
          {/* Images Section */}
          {imageAssets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ImageIcon className="h-4 w-4" />
                Images ({imageAssets.length})
              </div>
              <div className="space-y-2">
                {imageAssets.map((asset) => (
                  <AssetItem
                    key={asset.id}
                    asset={asset}
                    onSelect={onSelectAsset}
                    truncateUrl={truncateUrl}
                    getAssetIcon={getAssetIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {videoAssets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Video className="h-4 w-4" />
                Videos ({videoAssets.length})
              </div>
              <div className="space-y-2">
                {videoAssets.map((asset) => (
                  <AssetItem
                    key={asset.id}
                    asset={asset}
                    onSelect={onSelectAsset}
                    truncateUrl={truncateUrl}
                    getAssetIcon={getAssetIcon}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Backgrounds Section */}
          {backgroundAssets.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4" />
                Background Images ({backgroundAssets.length})
              </div>
              <div className="space-y-2">
                {backgroundAssets.map((asset) => (
                  <AssetItem
                    key={asset.id}
                    asset={asset}
                    onSelect={onSelectAsset}
                    truncateUrl={truncateUrl}
                    getAssetIcon={getAssetIcon}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

interface AssetItemProps {
  asset: DetectedAsset;
  onSelect: (asset: DetectedAsset) => void;
  truncateUrl: (url: string, maxLength?: number) => string;
  getAssetIcon: (type: DetectedAsset["type"]) => React.ReactNode;
}

function AssetItem({ asset, onSelect, truncateUrl, getAssetIcon }: AssetItemProps) {
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {thumbnailError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            {getAssetIcon(asset.type)}
          </div>
        ) : asset.type === "video" ? (
          <video
            src={asset.src}
            className="w-full h-full object-cover"
            muted
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <img
            src={asset.src}
            alt={asset.alt || "Asset thumbnail"}
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate text-muted-foreground" title={asset.src}>
          {truncateUrl(asset.src)}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {getAssetIcon(asset.type)}
            {getAssetTypeLabel(asset.type)}
          </span>
          <span className="text-xs text-muted-foreground">
            • Instance #{asset.instanceNumber}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onSelect(asset)}
        className="shrink-0"
      >
        {asset.type === "video" ? (
          <>
            <Video className="h-4 w-4 mr-1" />
            Change
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 mr-1" />
            Change
          </>
        )}
      </Button>
    </div>
  );
}
