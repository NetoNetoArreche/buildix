"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw, MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type FrameConfig,
  devicePresets,
} from "@/stores/canvasModeStore";
import { cn } from "@/lib/utils";

interface DraggableNumberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function DraggableNumber({ value, onChange, min = 100, max = 3840, step = 1 }: DraggableNumberProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  const [inputValue, setInputValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const startX = useRef(0);
  const startValue = useRef(0);
  const currentValue = useRef(value);
  const rafId = useRef<number | null>(null);
  const lastCommittedValue = useRef(value);

  // Sync display value with prop when not dragging/editing
  useEffect(() => {
    if (!isDragging && !isEditing) {
      setDisplayValue(value);
      setInputValue(String(value));
      currentValue.current = value;
      lastCommittedValue.current = value;
    }
  }, [value, isDragging, isEditing]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setInputValue(String(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(String(value));
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startX.current = e.clientX;
    startValue.current = value;
    currentValue.current = value;
    lastCommittedValue.current = value;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const delta = moveEvent.clientX - startX.current;
      const newValue = Math.round((startValue.current + delta * step) / step) * step;
      const clampedValue = Math.max(min, Math.min(max, newValue));
      currentValue.current = clampedValue;

      // Cancel previous frame and schedule new update
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        setDisplayValue(clampedValue);
        // Only call onChange if value actually changed significantly (throttle updates)
        if (Math.abs(clampedValue - lastCommittedValue.current) >= step) {
          lastCommittedValue.current = clampedValue;
          onChange(clampedValue);
        }
      });
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();

      // Cancel any pending animation frame
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      // Commit final value
      const finalValue = currentValue.current;
      if (finalValue !== value) {
        onChange(finalValue);
      }

      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    // Set cursor and prevent text selection during drag
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [value, onChange, min, max, step]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        className="w-14 bg-zinc-800 border border-violet-500 rounded px-1 text-center text-xs text-zinc-100 outline-none"
      />
    );
  }

  return (
    <span
      className={cn(
        "tabular-nums cursor-ew-resize select-none hover:text-zinc-300 transition-colors px-0.5 rounded",
        isDragging && "text-violet-400 bg-violet-500/20"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title="Drag to change, double-click to type"
    >
      {displayValue}
    </span>
  );
}

interface FrameHeaderProps {
  index: number;
  frame: FrameConfig;
  cornerRadius: number;
  onPresetChange: (presetId: string) => void;
  onDimensionChange: (width: number, height: number) => void;
  onRefresh: () => void;
  onDragStart?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}

export function FrameHeader({
  index,
  frame,
  cornerRadius,
  onPresetChange,
  onDimensionChange,
  onRefresh,
  onDragStart,
  isDragging,
}: FrameHeaderProps) {
  // Find current preset based on dimensions
  const currentPreset = devicePresets.find(
    (p) => p.width === frame.width && p.height === frame.height
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 bg-zinc-900/90 backdrop-blur-sm text-zinc-300 text-xs border-b border-zinc-800",
        isDragging && "bg-violet-900/50 border-violet-500"
      )}
      style={{ borderRadius: `${cornerRadius}px ${cornerRadius}px 0 0` }}
    >
      {/* Left: Drag Handle + Name */}
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <div
          className={cn(
            "cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded hover:bg-zinc-800 transition-colors",
            isDragging && "text-violet-400"
          )}
          onMouseDown={onDragStart}
          title="Drag to reposition"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <span className="font-medium text-zinc-100">Preview {index + 1}</span>
      </div>

      {/* Center: Dimensions + Device Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-zinc-500">
          <DraggableNumber
            value={frame.width}
            onChange={(w) => onDimensionChange(w, frame.height)}
          />
          <span>×</span>
          <DraggableNumber
            value={frame.height}
            onChange={(h) => onDimensionChange(frame.width, h)}
          />
        </div>
        <Select
          value={currentPreset?.id || "custom"}
          onValueChange={onPresetChange}
        >
          <SelectTrigger className="h-6 w-[180px] text-xs bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800">
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {devicePresets.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
                className="text-xs"
              >
                <div className="flex items-center justify-between w-full gap-4">
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          onClick={onRefresh}
          title="Refresh preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          title="More options"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
