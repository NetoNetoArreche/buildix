"use client";

import { useState } from "react";
import { Maximize2, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

interface SpacingSectionProps {
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  padding: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  onMarginChange: (side: string, value: string) => void;
  onPaddingChange: (side: string, value: string) => void;
  activeProperties?: Record<string, boolean>;
  hasActiveProperties?: boolean;
}

function parseValue(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  return String(Math.round(num));
}

function SpacingInput({
  label,
  value,
  onChange,
  isActive = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isActive?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-2 transition-opacity",
      !isActive && "opacity-50"
    )}>
      <span className={cn(
        "text-xs font-medium flex items-center gap-1",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}>
        {isActive && <span className="w-1 h-1 rounded-full bg-[hsl(var(--buildix-primary))]" />}
        {label}
      </span>
      <input
        type="text"
        value={parseValue(value)}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val ? `${val}px` : "0px");
        }}
        placeholder="0"
        className="w-full bg-transparent text-xs focus:outline-none"
      />
    </div>
  );
}

export function SpacingSection({
  margin,
  padding,
  onMarginChange,
  onPaddingChange,
  activeProperties = {},
  hasActiveProperties,
}: SpacingSectionProps) {
  const [linkMargin, setLinkMargin] = useState(false);
  const [linkPadding, setLinkPadding] = useState(false);

  const handleMarginChange = (side: string, value: string) => {
    if (linkMargin) {
      onMarginChange("top", value);
      onMarginChange("right", value);
      onMarginChange("bottom", value);
      onMarginChange("left", value);
    } else {
      onMarginChange(side, value);
    }
  };

  const handlePaddingChange = (side: string, value: string) => {
    if (linkPadding) {
      onPaddingChange("top", value);
      onPaddingChange("right", value);
      onPaddingChange("bottom", value);
      onPaddingChange("left", value);
    } else {
      onPaddingChange(side, value);
    }
  };

  return (
    <CollapsibleSection
      title="Spacing"
      icon={<Box className="h-4 w-4" />}
      hasActiveProperties={hasActiveProperties}
    >
      <div className="space-y-4">
        {/* Margin Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Margin</span>
            <button
              onClick={() => setLinkMargin(!linkMargin)}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                linkMargin && "text-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10"
              )}
              title="Link all sides"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SpacingInput
              label="L"
              value={margin.left}
              onChange={(v) => handleMarginChange("left", v)}
              isActive={activeProperties.marginLeft}
            />
            <SpacingInput
              label="T"
              value={margin.top}
              onChange={(v) => handleMarginChange("top", v)}
              isActive={activeProperties.marginTop}
            />
            <SpacingInput
              label="R"
              value={margin.right}
              onChange={(v) => handleMarginChange("right", v)}
              isActive={activeProperties.marginRight}
            />
            <SpacingInput
              label="B"
              value={margin.bottom}
              onChange={(v) => handleMarginChange("bottom", v)}
              isActive={activeProperties.marginBottom}
            />
          </div>
        </div>

        {/* Padding Section */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Padding</span>
            <button
              onClick={() => setLinkPadding(!linkPadding)}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                linkPadding && "text-[hsl(var(--buildix-primary))] bg-[hsl(var(--buildix-primary))]/10"
              )}
              title="Link all sides"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SpacingInput
              label="L"
              value={padding.left}
              onChange={(v) => handlePaddingChange("left", v)}
              isActive={activeProperties.paddingLeft}
            />
            <SpacingInput
              label="T"
              value={padding.top}
              onChange={(v) => handlePaddingChange("top", v)}
              isActive={activeProperties.paddingTop}
            />
            <SpacingInput
              label="R"
              value={padding.right}
              onChange={(v) => handlePaddingChange("right", v)}
              isActive={activeProperties.paddingRight}
            />
            <SpacingInput
              label="B"
              value={padding.bottom}
              onChange={(v) => handlePaddingChange("bottom", v)}
              isActive={activeProperties.paddingBottom}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
