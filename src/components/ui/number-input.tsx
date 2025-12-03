"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  units?: string[];
  onUnitChange?: (unit: string) => void;
  placeholder?: string;
  className?: string;
  showStepper?: boolean;
  allowEmpty?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  unit,
  units,
  onUnitChange,
  placeholder = "0",
  className,
  showStepper = false,
  allowEmpty = true,
}: NumberInputProps) {
  const [localValue, setLocalValue] = React.useState(String(value));

  React.useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (newValue === "" && allowEmpty) {
      onChange("");
      return;
    }

    const numValue = parseFloat(newValue);
    if (!isNaN(numValue)) {
      onChange(Math.min(max, Math.max(min, numValue)));
    }
  };

  const handleBlur = () => {
    if (localValue === "" && allowEmpty) {
      return;
    }

    const numValue = parseFloat(localValue);
    if (isNaN(numValue)) {
      setLocalValue(String(value));
    } else {
      const clampedValue = Math.min(max, Math.max(min, numValue));
      setLocalValue(String(clampedValue));
      onChange(clampedValue);
    }
  };

  const increment = () => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = Math.min(max, numValue + step);
    setLocalValue(String(newValue));
    onChange(newValue);
  };

  const decrement = () => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = Math.max(min, numValue - step);
    setLocalValue(String(newValue));
    onChange(newValue);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {showStepper && (
        <button
          type="button"
          onClick={decrement}
          className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/50 hover:bg-muted transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
      )}

      <div className="relative flex-1">
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "h-8 w-full rounded-md border bg-transparent px-2 text-sm",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            unit && !units && "pr-8"
          )}
        />
        {unit && !units && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {units && units.length > 0 && (
        <select
          value={unit}
          onChange={(e) => onUnitChange?.(e.target.value)}
          className="h-8 rounded-md border bg-transparent px-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      )}

      {showStepper && (
        <button
          type="button"
          onClick={increment}
          className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted/50 hover:bg-muted transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
