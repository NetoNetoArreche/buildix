"use client";

import { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  Square,
  Trash2,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Artboard,
  type DeviceType,
  devicePresets,
  useArtboardsStore,
} from "@/stores/artboardsStore";
import { cn } from "@/lib/utils";

interface ArtboardHeaderProps {
  artboard: Artboard;
  isSelected: boolean;
  onSelect: () => void;
}

const deviceIcons: Record<DeviceType, React.ReactNode> = {
  desktop: <Monitor className="h-3.5 w-3.5" />,
  laptop: <Laptop className="h-3.5 w-3.5" />,
  tablet: <Tablet className="h-3.5 w-3.5" />,
  mobile: <Smartphone className="h-3.5 w-3.5" />,
  custom: <Square className="h-3.5 w-3.5" />,
};

export function ArtboardHeader({ artboard, isSelected, onSelect }: ArtboardHeaderProps) {
  const { setArtboardName, setArtboardDevice, removeArtboard, duplicateArtboard } = useArtboardsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(artboard.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setEditValue(artboard.name);
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== artboard.name) {
      setArtboardName(artboard.id, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(artboard.name);
    }
  };

  return (
    <div
      className={cn(
        "absolute -top-8 left-0 flex items-center gap-2 px-2 py-1 rounded-t-md transition-colors cursor-pointer select-none",
        isSelected
          ? "bg-violet-500/20 text-violet-300"
          : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-300"
      )}
      onClick={onSelect}
    >
      {/* Device Icon */}
      <span className="opacity-70">{deviceIcons[artboard.device]}</span>

      {/* Editable Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-24 bg-transparent border-none outline-none text-xs font-medium"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="text-xs font-medium"
          onDoubleClick={handleDoubleClick}
        >
          {artboard.name}
        </span>
      )}

      {/* Dimensions */}
      <span className="text-[10px] opacity-50">
        {artboard.width} x {artboard.height}
      </span>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-50 hover:opacity-100"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {/* Device Presets */}
          {Object.entries(devicePresets).map(([key, preset]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setArtboardDevice(artboard.id, key as DeviceType)}
              className={cn(
                "gap-2",
                artboard.device === key && "bg-violet-500/10 text-violet-400"
              )}
            >
              {deviceIcons[key as DeviceType]}
              <span>{preset.name}</span>
              <span className="ml-auto text-[10px] opacity-50">
                {preset.width}x{preset.height}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => duplicateArtboard(artboard.id)}
            className="gap-2"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => removeArtboard(artboard.id)}
            className="gap-2 text-red-400 focus:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
