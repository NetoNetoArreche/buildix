"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Wand2,
  Layout,
  Grid3X3,
  Palette,
  Sun,
  Moon,
  Sparkles,
  RotateCcw,
  Monitor,
  Frame,
  Type,
  Play,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  FileText,
  Square,
  List,
  LayoutGrid,
  Table,
  PanelLeft,
  PanelRight,
  AlignCenter,
  Maximize,
  AppWindow,
  Box,
  Layers,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  Diamond,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUIStore } from "@/stores/uiStore";
import {
  PROMPT_BUILDER_OPTIONS,
  buildPromptFromOptions,
} from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

interface PromptBuilderProps {
  onGenerate: (prompt: string) => void;
  onClose?: () => void;
}

// Wireframe components for layout types (visual preview like Aura)
const LayoutWireframe = ({ type, selected }: { type: string; selected: boolean }) => {
  const strokeColor = selected ? "#a78bfa" : "#52525b";
  const fillColor = selected ? "#a78bfa" : "#3f3f46";

  const wireframes: Record<string, React.ReactNode> = {
    hero: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Nav bar */}
        <rect x="2" y="2" width="44" height="4" rx="1" fill={fillColor} />
        {/* Hero content - centered */}
        <rect x="12" y="12" width="24" height="3" rx="1" fill={fillColor} />
        <rect x="16" y="17" width="16" height="2" rx="0.5" fill={strokeColor} opacity="0.5" />
        {/* CTA button */}
        <rect x="18" y="22" width="12" height="4" rx="1" fill={fillColor} />
      </svg>
    ),
    features: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Grid of feature cards */}
        <rect x="2" y="2" width="13" height="10" rx="1" fill={fillColor} />
        <rect x="17" y="2" width="13" height="10" rx="1" fill={fillColor} />
        <rect x="32" y="2" width="13" height="10" rx="1" fill={fillColor} />
        <rect x="2" y="14" width="13" height="10" rx="1" fill={fillColor} />
        <rect x="17" y="14" width="13" height="10" rx="1" fill={fillColor} />
        <rect x="32" y="14" width="13" height="10" rx="1" fill={fillColor} />
      </svg>
    ),
    onboarding: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Steps indicator */}
        <circle cx="12" cy="6" r="3" fill={fillColor} />
        <circle cx="24" cy="6" r="3" fill={strokeColor} opacity="0.5" />
        <circle cx="36" cy="6" r="3" fill={strokeColor} opacity="0.5" />
        {/* Content area */}
        <rect x="8" y="14" width="32" height="14" rx="2" fill={fillColor} />
        {/* Next button */}
        <rect x="30" y="30" width="10" height="4" rx="1" fill={fillColor} />
      </svg>
    ),
    docs: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Sidebar */}
        <rect x="2" y="2" width="12" height="32" rx="1" fill={fillColor} />
        {/* Content lines */}
        <rect x="17" y="4" width="28" height="2" rx="0.5" fill={fillColor} />
        <rect x="17" y="9" width="24" height="1.5" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="17" y="13" width="26" height="1.5" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="17" y="17" width="20" height="1.5" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="17" y="23" width="28" height="2" rx="0.5" fill={fillColor} />
        <rect x="17" y="28" width="22" height="1.5" rx="0.5" fill={strokeColor} opacity="0.5" />
      </svg>
    ),
    updates: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Update cards stacked */}
        <rect x="4" y="2" width="40" height="8" rx="1" fill={fillColor} />
        <rect x="4" y="12" width="40" height="8" rx="1" fill={fillColor} />
        <rect x="4" y="22" width="40" height="8" rx="1" fill={fillColor} />
      </svg>
    ),
    portfolio: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Masonry grid */}
        <rect x="2" y="2" width="14" height="18" rx="1" fill={fillColor} />
        <rect x="18" y="2" width="14" height="10" rx="1" fill={fillColor} />
        <rect x="34" y="2" width="12" height="14" rx="1" fill={fillColor} />
        <rect x="18" y="14" width="14" height="12" rx="1" fill={fillColor} />
        <rect x="2" y="22" width="14" height="10" rx="1" fill={fillColor} />
        <rect x="34" y="18" width="12" height="14" rx="1" fill={fillColor} />
      </svg>
    ),
    pricing: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Pricing cards */}
        <rect x="2" y="4" width="13" height="28" rx="1" fill={fillColor} />
        <rect x="17" y="2" width="14" height="32" rx="1" fill={fillColor} stroke={strokeColor} strokeWidth="0.5" />
        <rect x="33" y="4" width="13" height="28" rx="1" fill={fillColor} />
      </svg>
    ),
    landing: (
      <svg viewBox="0 0 48 36" className="w-full h-full">
        {/* Full landing - nav, hero, features, footer */}
        <rect x="2" y="2" width="44" height="3" rx="0.5" fill={fillColor} />
        <rect x="8" y="8" width="32" height="8" rx="1" fill={fillColor} />
        <rect x="4" y="19" width="12" height="6" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="18" y="19" width="12" height="6" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="32" y="19" width="12" height="6" rx="0.5" fill={strokeColor} opacity="0.5" />
        <rect x="2" y="28" width="44" height="6" rx="0.5" fill={fillColor} />
      </svg>
    ),
  };

  return wireframes[type] || wireframes.hero;
};

// Configuration preview component - shows all selected options visually
interface ConfigPreviewProps {
  layoutType: string | null;
  layoutConfig: string | null;
  framing: string | null;
  style: string | null;
  theme: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
}

const ConfigurationPreview = ({
  layoutType,
  layoutConfig,
  framing,
  style,
  theme,
  accentColor,
  backgroundColor
}: ConfigPreviewProps) => {
  // Get accent color hex
  const accent = accentColor
    ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex || "#a78bfa"
    : "#a78bfa";

  // Get background color based on theme
  const bgColor = backgroundColor
    ? PROMPT_BUILDER_OPTIONS.backgroundColors.find(c => c.value === backgroundColor)?.hex || "#09090b"
    : theme === "light" ? "#fafafa" : "#09090b";

  const cardBg = theme === "light" ? "#ffffff" : "#27272a";
  const borderColor = theme === "light" ? "#e4e4e7" : "#3f3f46";
  const textColor = theme === "light" ? "#18181b" : "#a1a1aa";

  // Glass effect overlay
  const glassOverlay = style === "glass" ? "rgba(255,255,255,0.1)" : "transparent";

  // Border radius based on style
  const radius = style === "ios" ? 12 : style === "flat" ? 2 : 6;

  // Check if anything is selected
  const hasSelection = layoutType || layoutConfig || framing || style || theme || accentColor || backgroundColor;

  if (!hasSelection) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Select options to preview
      </div>
    );
  }

  // Render framing wrapper
  const renderFraming = (content: React.ReactNode) => {
    if (framing === "browser") {
      return (
        <svg viewBox="0 0 220 165" className="w-full h-full">
          {/* Browser chrome */}
          <rect x="5" y="5" width="210" height="155" rx="8" fill={cardBg} stroke={borderColor} strokeWidth="1" />
          <rect x="5" y="5" width="210" height="24" rx="8" fill={borderColor} />
          <rect x="5" y="21" width="210" height="8" fill={borderColor} />
          {/* Traffic lights */}
          <circle cx="18" cy="17" r="5" fill="#ef4444" />
          <circle cx="34" cy="17" r="5" fill="#eab308" />
          <circle cx="50" cy="17" r="5" fill="#22c55e" />
          {/* URL bar */}
          <rect x="70" y="11" width="130" height="12" rx="4" fill={bgColor} />
          {/* Content area */}
          <foreignObject x="10" y="34" width="200" height="120">
            {content}
          </foreignObject>
        </svg>
      );
    }

    if (framing === "mac-app") {
      return (
        <svg viewBox="0 0 220 165" className="w-full h-full">
          {/* Window chrome */}
          <rect x="5" y="5" width="210" height="155" rx="10" fill={cardBg} stroke={borderColor} strokeWidth="1" />
          <rect x="5" y="5" width="210" height="28" rx="10" fill={borderColor} />
          <rect x="5" y="25" width="210" height="8" fill={borderColor} />
          {/* Traffic lights */}
          <circle cx="20" cy="19" r="6" fill="#ef4444" />
          <circle cx="38" cy="19" r="6" fill="#eab308" />
          <circle cx="56" cy="19" r="6" fill="#22c55e" />
          {/* Title */}
          <text x="110" y="22" textAnchor="middle" fill={textColor} fontSize="9" fontWeight="500">App Window</text>
          {/* Content area */}
          <foreignObject x="10" y="38" width="200" height="116">
            {content}
          </foreignObject>
        </svg>
      );
    }

    if (framing === "card") {
      return (
        <svg viewBox="0 0 220 165" className="w-full h-full">
          {/* Outer background */}
          <rect x="0" y="0" width="220" height="165" fill={bgColor} />
          {/* Card with shadow */}
          <rect x="20" y="15" width="180" height="135" rx={radius + 4} fill={cardBg} stroke={borderColor} strokeWidth="1" filter="url(#shadow)" />
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
            </filter>
          </defs>
          {/* Content area */}
          <foreignObject x="25" y="20" width="170" height="125">
            {content}
          </foreignObject>
        </svg>
      );
    }

    // Full screen (default)
    return content;
  };

  // Render layout config pattern
  const renderLayoutConfig = () => {
    const configs: Record<string, React.ReactNode> = {
      card: (
        <g>
          <rect x="30" y="40" width="140" height="80" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="45" y="55" width="70" height="8" rx="2" fill={accent} />
          <rect x="45" y="70" width="110" height="5" rx="1" fill={textColor} opacity="0.5" />
          <rect x="45" y="80" width="90" height="5" rx="1" fill={textColor} opacity="0.3" />
          <rect x="45" y="100" width="50" height="12" rx={radius} fill={accent} />
        </g>
      ),
      list: (
        <g>
          <rect x="20" y="35" width="160" height="24" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="30" y="42" width="60" height="4" rx="1" fill={accent} />
          <rect x="30" y="50" width="100" height="3" rx="1" fill={textColor} opacity="0.4" />

          <rect x="20" y="65" width="160" height="24" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="30" y="72" width="50" height="4" rx="1" fill={accent} />
          <rect x="30" y="80" width="90" height="3" rx="1" fill={textColor} opacity="0.4" />

          <rect x="20" y="95" width="160" height="24" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="30" y="102" width="70" height="4" rx="1" fill={accent} />
          <rect x="30" y="110" width="80" height="3" rx="1" fill={textColor} opacity="0.4" />
        </g>
      ),
      "grid-2x2": (
        <g>
          <rect x="15" y="35" width="85" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="25" y="45" width="40" height="5" rx="1" fill={accent} />
          <rect x="25" y="55" width="65" height="3" rx="1" fill={textColor} opacity="0.4" />

          <rect x="105" y="35" width="85" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="115" y="45" width="35" height="5" rx="1" fill={accent} />
          <rect x="115" y="55" width="60" height="3" rx="1" fill={textColor} opacity="0.4" />

          <rect x="15" y="95" width="85" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="25" y="105" width="45" height="5" rx="1" fill={accent} />
          <rect x="25" y="115" width="55" height="3" rx="1" fill={textColor} opacity="0.4" />

          <rect x="105" y="95" width="85" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="115" y="105" width="50" height="5" rx="1" fill={accent} />
          <rect x="115" y="115" width="65" height="3" rx="1" fill={textColor} opacity="0.4" />
        </g>
      ),
      table: (
        <g>
          {/* Header */}
          <rect x="15" y="35" width="170" height="20" rx="2" fill={accent} opacity="0.2" />
          <rect x="20" y="42" width="30" height="6" rx="1" fill={accent} />
          <rect x="60" y="42" width="40" height="6" rx="1" fill={accent} />
          <rect x="110" y="42" width="35" height="6" rx="1" fill={accent} />
          <rect x="155" y="42" width="25" height="6" rx="1" fill={accent} />
          {/* Rows */}
          <line x1="15" y1="55" x2="185" y2="55" stroke={borderColor} />
          <rect x="20" y="62" width="25" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="60" y="62" width="35" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="110" y="62" width="30" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="155" y="62" width="20" height="4" rx="1" fill={textColor} opacity="0.5" />

          <line x1="15" y1="75" x2="185" y2="75" stroke={borderColor} />
          <rect x="20" y="82" width="28" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="60" y="82" width="32" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="110" y="82" width="28" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="155" y="82" width="22" height="4" rx="1" fill={textColor} opacity="0.5" />

          <line x1="15" y1="95" x2="185" y2="95" stroke={borderColor} />
          <rect x="20" y="102" width="22" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="60" y="102" width="38" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="110" y="102" width="25" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="155" y="102" width="18" height="4" rx="1" fill={textColor} opacity="0.5" />
        </g>
      ),
      "sidebar-left": (
        <g>
          {/* Sidebar */}
          <rect x="10" y="30" width="50" height="120" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="18" y="40" width="34" height="5" rx="1" fill={accent} />
          <rect x="18" y="52" width="30" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="18" y="62" width="32" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="18" y="72" width="28" height="4" rx="1" fill={textColor} opacity="0.4" />
          {/* Content */}
          <rect x="68" y="30" width="122" height="120" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="78" y="40" width="80" height="8" rx="2" fill={accent} />
          <rect x="78" y="55" width="100" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="78" y="65" width="95" height="4" rx="1" fill={textColor} opacity="0.3" />
        </g>
      ),
      "sidebar-right": (
        <g>
          {/* Content */}
          <rect x="10" y="30" width="122" height="120" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="20" y="40" width="80" height="8" rx="2" fill={accent} />
          <rect x="20" y="55" width="100" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="20" y="65" width="95" height="4" rx="1" fill={textColor} opacity="0.3" />
          {/* Sidebar */}
          <rect x="140" y="30" width="50" height="120" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="148" y="40" width="34" height="5" rx="1" fill={accent} />
          <rect x="148" y="52" width="30" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="148" y="62" width="32" height="4" rx="1" fill={textColor} opacity="0.4" />
        </g>
      ),
      centered: (
        <g>
          <rect x="35" y="40" width="130" height="80" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="65" y="55" width="70" height="8" rx="2" fill={accent} />
          <rect x="55" y="70" width="90" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="60" y="80" width="80" height="4" rx="1" fill={textColor} opacity="0.3" />
          <rect x="75" y="100" width="50" height="12" rx={radius} fill={accent} />
        </g>
      ),
      masonry: (
        <g>
          <rect x="10" y="30" width="55" height="70" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="70" y="30" width="55" height="45" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="130" y="30" width="55" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="70" y="80" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="10" y="105" width="55" height="45" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="130" y="90" width="55" height="60" rx={radius} fill={cardBg} stroke={borderColor} />
        </g>
      ),
    };

    return configs[layoutConfig || "card"] || configs.card;
  };

  // Render layout type
  const renderLayoutType = () => {
    const layouts: Record<string, React.ReactNode> = {
      hero: (
        <g>
          {/* Nav */}
          <rect x="10" y="10" width="180" height="14" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="20" y="14" width="30" height="6" rx="1" fill={accent} />
          {/* Hero */}
          <rect x="10" y="30" width="180" height="70" rx={radius} fill={cardBg} stroke={borderColor} style={{ fill: glassOverlay !== "transparent" ? `url(#glass)` : cardBg }} />
          <rect x="50" y="50" width="100" height="10" rx="2" fill={accent} />
          <rect x="60" y="65" width="80" height="5" rx="1" fill={textColor} opacity="0.5" />
          <rect x="75" y="80" width="50" height="12" rx={radius} fill={accent} />
          {/* Features hint */}
          <rect x="10" y="110" width="55" height="35" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.6" />
          <rect x="70" y="110" width="55" height="35" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.6" />
          <rect x="130" y="110" width="55" height="35" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.6" />
        </g>
      ),
      features: (
        <g>
          <rect x="60" y="15" width="80" height="10" rx="2" fill={accent} />
          <rect x="10" y="35" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="70" y="35" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="130" y="35" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="10" y="95" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="70" y="95" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="130" y="95" width="55" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
        </g>
      ),
      onboarding: (
        <g>
          {/* Steps */}
          <circle cx="70" cy="20" r="8" fill={accent} />
          <circle cx="100" cy="20" r="8" fill={borderColor} />
          <circle cx="130" cy="20" r="8" fill={borderColor} />
          <line x1="78" y1="20" x2="92" y2="20" stroke={borderColor} strokeWidth="2" />
          <line x1="108" y1="20" x2="122" y2="20" stroke={borderColor} strokeWidth="2" />
          {/* Card */}
          <rect x="20" y="40" width="160" height="85" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="50" y="60" width="100" height="8" rx="2" fill={accent} />
          <rect x="40" y="75" width="120" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="55" y="85" width="90" height="4" rx="1" fill={textColor} opacity="0.3" />
          {/* Button */}
          <rect x="130" y="130" width="50" height="14" rx={radius} fill={accent} />
        </g>
      ),
      docs: (
        <g>
          {/* Sidebar */}
          <rect x="10" y="10" width="50" height="135" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="15" y="20" width="40" height="6" rx="1" fill={accent} />
          <rect x="15" y="32" width="35" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="15" y="42" width="38" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="15" y="52" width="30" height="4" rx="1" fill={textColor} opacity="0.4" />
          {/* Content */}
          <rect x="68" y="15" width="100" height="10" rx="1" fill={accent} />
          <rect x="68" y="35" width="115" height="4" rx="1" fill={textColor} opacity="0.5" />
          <rect x="68" y="45" width="110" height="4" rx="1" fill={textColor} opacity="0.4" />
          <rect x="68" y="55" width="100" height="4" rx="1" fill={textColor} opacity="0.3" />
        </g>
      ),
      updates: (
        <g>
          <rect x="70" y="10" width="60" height="10" rx="2" fill={accent} />
          <rect x="20" y="30" width="160" height="32" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="20" y="68" width="160" height="32" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="20" y="106" width="160" height="32" rx={radius} fill={cardBg} stroke={borderColor} />
        </g>
      ),
      portfolio: (
        <g>
          <rect x="10" y="10" width="58" height="70" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="72" y="10" width="58" height="45" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="134" y="10" width="55" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="72" y="60" width="58" height="50" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="10" y="85" width="58" height="55" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="134" y="70" width="55" height="70" rx={radius} fill={cardBg} stroke={borderColor} />
        </g>
      ),
      pricing: (
        <g>
          <rect x="60" y="5" width="80" height="10" rx="2" fill={accent} />
          <rect x="10" y="25" width="55" height="115" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="70" y="20" width="60" height="125" rx={radius} fill={cardBg} stroke={accent} strokeWidth="2" />
          <rect x="135" y="25" width="55" height="115" rx={radius} fill={cardBg} stroke={borderColor} />
          <text x="40" y="50" textAnchor="middle" fill={textColor} fontSize="7">Basic</text>
          <text x="100" y="50" textAnchor="middle" fill={accent} fontSize="8" fontWeight="600">Pro</text>
          <text x="162" y="50" textAnchor="middle" fill={textColor} fontSize="7">Enterprise</text>
        </g>
      ),
      landing: (
        <g>
          <rect x="10" y="5" width="180" height="12" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="10" y="22" width="180" height="40" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="60" y="35" width="80" height="8" rx="2" fill={accent} />
          <rect x="10" y="67" width="55" height="30" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.7" />
          <rect x="70" y="67" width="55" height="30" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.7" />
          <rect x="130" y="67" width="55" height="30" rx={radius} fill={cardBg} stroke={borderColor} opacity="0.7" />
          <rect x="40" y="105" width="120" height="20" rx={radius} fill={cardBg} stroke={borderColor} />
          <rect x="10" y="132" width="180" height="13" rx={radius} fill={borderColor} />
        </g>
      ),
    };

    return layouts[layoutType || "hero"] || null;
  };

  // Build the preview content
  const previewContent = (
    <svg viewBox="0 0 200 150" className="w-full h-full">
      {/* Glass gradient definition */}
      {style === "glass" && (
        <defs>
          <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
      )}
      {/* Background */}
      <rect x="0" y="0" width="200" height="150" fill={bgColor} rx={framing === "full-screen" ? 0 : radius} />
      {/* Content based on selections */}
      {layoutConfig && !layoutType ? renderLayoutConfig() : renderLayoutType()}
    </svg>
  );

  return renderFraming(previewContent);
};

// Icon mapping for layout configs
const layoutConfigIcons: Record<string, React.ReactNode> = {
  card: <Square className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  "grid-2x2": <LayoutGrid className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />,
  "sidebar-left": <PanelLeft className="h-4 w-4" />,
  "sidebar-right": <PanelRight className="h-4 w-4" />,
  centered: <AlignCenter className="h-4 w-4" />,
  masonry: <LayoutGrid className="h-4 w-4" />,
};

// Icon mapping for framing
const framingIcons: Record<string, React.ReactNode> = {
  "full-screen": <Maximize className="h-4 w-4" />,
  card: <Square className="h-4 w-4" />,
  browser: <Monitor className="h-4 w-4" />,
  "mac-app": <AppWindow className="h-4 w-4" />,
  "clay-web": <Box className="h-4 w-4" />,
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800/50 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-zinc-500" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function PromptBuilder({ onGenerate, onClose }: PromptBuilderProps) {
  const { closeModal } = useUIStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeModal();
    }
  };

  // State for all options - start with null/empty (nothing selected)
  const [layoutType, setLayoutType] = useState<string | null>(null);
  const [layoutConfig, setLayoutConfig] = useState<string | null>(null);
  const [framing, setFraming] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);
  const [borderColor, setBorderColor] = useState<string | null>(null);
  const [shadow, setShadow] = useState<string | null>(null);
  const [typefaceType, setTypefaceType] = useState<string | null>(null);
  const [headingFont, setHeadingFont] = useState<string | null>(null);
  const [bodyFont, setBodyFont] = useState<string | null>(null);
  const [headingSize, setHeadingSize] = useState<string | null>(null);
  const [subheadingSize, setSubheadingSize] = useState<string | null>(null);
  const [bodyTextSize, setBodyTextSize] = useState<string | null>(null);
  const [headingWeight, setHeadingWeight] = useState<string | null>(null);
  const [letterSpacing, setLetterSpacing] = useState<string | null>(null);
  const [animation, setAnimation] = useState<string | null>(null);
  // New animation options
  const [animationType, setAnimationType] = useState<string | null>(null);
  const [animationScene, setAnimationScene] = useState<string | null>(null);
  const [animationDuration, setAnimationDuration] = useState(0.8);
  const [animationDelay, setAnimationDelay] = useState(0);
  const [animationTiming, setAnimationTiming] = useState<string | null>(null);
  const [animationIterations, setAnimationIterations] = useState<string | null>(null);
  const [animationDirection, setAnimationDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  // Auto-play animation when animation type changes
  useEffect(() => {
    if (animationType) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsAnimating(true), 50);
      return () => clearTimeout(timer);
    }
  }, [animationType, animationScene, animationDuration, animationDelay, animationTiming, animationIterations, animationDirection]);

  // Dynamic prompts based on current selections - only shows selected options
  const dynamicPrompts = useMemo(() => {
    const prompts: Array<{ id: string; category: string; label: string; description: string }> = [];

    // Layout Type - only add if selected
    if (layoutType) {
      const layoutOption = PROMPT_BUILDER_OPTIONS.layoutTypes.find(t => t.value === layoutType);
      if (layoutOption) {
        prompts.push({
          id: `layout-${layoutType}`,
          category: "Layout Type",
          label: layoutOption.label,
          description: layoutOption.description,
        });
      }
    }

    // Layout Config - only add if selected
    if (layoutConfig) {
      const configOption = PROMPT_BUILDER_OPTIONS.layoutConfigs.find(c => c.value === layoutConfig);
      if (configOption) {
        prompts.push({
          id: `config-${layoutConfig}`,
          category: "Layout Configuration",
          label: configOption.label,
          description: configOption.description,
        });
      }
    }

    // Framing - only add if selected
    if (framing) {
      const framingOption = PROMPT_BUILDER_OPTIONS.framing.find(f => f.value === framing);
      if (framingOption) {
        prompts.push({
          id: `framing-${framing}`,
          category: "Framing",
          label: framingOption.label,
          description: framingOption.description,
        });
      }
    }

    // Style - only add if selected
    if (style) {
      const styleOption = PROMPT_BUILDER_OPTIONS.styles.find(s => s.value === style);
      if (styleOption) {
        prompts.push({
          id: `style-${style}`,
          category: "Style",
          label: styleOption.label,
          description: styleOption.description,
        });
      }
    }

    // Theme - only add if selected
    if (theme) {
      const themeOption = PROMPT_BUILDER_OPTIONS.themes.find(t => t.value === theme);
      if (themeOption) {
        prompts.push({
          id: `theme-${theme}`,
          category: "Theme",
          label: themeOption.label,
          description: themeOption.description,
        });
      }
    }

    // Accent Color - only add if selected
    if (accentColor) {
      const accentOption = PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor);
      if (accentOption) {
        prompts.push({
          id: `accent-${accentColor}`,
          category: "Accent Color",
          label: accentOption.label,
          description: `${accentOption.label} accent color for buttons, links and highlights`,
        });
      }
    }

    // Background Color - only add if selected
    if (backgroundColor) {
      const bgOption = PROMPT_BUILDER_OPTIONS.backgroundColors.find(c => c.value === backgroundColor);
      if (bgOption) {
        prompts.push({
          id: `bg-${backgroundColor}`,
          category: "Background",
          label: bgOption.label,
          description: `${bgOption.label} background color`,
        });
      }
    }

    // Shadow - only add if selected and not "none"
    if (shadow && shadow !== "none") {
      const shadowOption = PROMPT_BUILDER_OPTIONS.shadows.find(s => s.value === shadow);
      if (shadowOption) {
        prompts.push({
          id: `shadow-${shadow}`,
          category: "Shadow",
          label: shadowOption.label,
          description: `${shadowOption.label} shadow effects on elements`,
        });
      }
    }

    // Typography - only add if selected
    if (typefaceType) {
      const typefaceOption = PROMPT_BUILDER_OPTIONS.typefaceTypes.find(t => t.value === typefaceType);
      if (typefaceOption) {
        prompts.push({
          id: `typeface-${typefaceType}`,
          category: "Typography",
          label: typefaceOption.label,
          description: `${typefaceOption.label} typeface family`,
        });
      }
    }

    // Heading Font - only add if selected
    if (headingFont) {
      const headingOption = PROMPT_BUILDER_OPTIONS.headingFonts.find(f => f.value === headingFont);
      if (headingOption) {
        prompts.push({
          id: `heading-${headingFont}`,
          category: "Heading Font",
          label: headingOption.label,
          description: `${headingOption.label} font for headings`,
        });
      }
    }

    // Animation - only add if selected and not "none"
    if (animation && animation !== "none") {
      const animationOption = PROMPT_BUILDER_OPTIONS.animations.find(a => a.value === animation);
      if (animationOption) {
        prompts.push({
          id: `animation-${animation}`,
          category: "Animation",
          label: animationOption.label,
          description: animationOption.description,
        });
      }
    }

    // Body Font
    if (bodyFont) {
      const bodyFontOption = PROMPT_BUILDER_OPTIONS.bodyFonts.find(f => f.value === bodyFont);
      if (bodyFontOption) {
        prompts.push({
          id: `body-font-${bodyFont}`,
          category: "Body Font",
          label: bodyFontOption.label,
          description: `${bodyFontOption.label} font for body text`,
        });
      }
    }

    // Heading Size
    if (headingSize) {
      const sizeOption = PROMPT_BUILDER_OPTIONS.headingSizes.find(s => s.value === headingSize);
      if (sizeOption) {
        prompts.push({
          id: `heading-size-${headingSize}`,
          category: "Heading Size",
          label: sizeOption.label,
          description: `Heading size ${sizeOption.label}`,
        });
      }
    }

    // Heading Weight
    if (headingWeight) {
      const weightOption = PROMPT_BUILDER_OPTIONS.headingWeights.find(w => w.value === headingWeight);
      if (weightOption) {
        prompts.push({
          id: `heading-weight-${headingWeight}`,
          category: "Font Weight",
          label: weightOption.label,
          description: `${weightOption.label} font weight for headings`,
        });
      }
    }

    // Letter Spacing
    if (letterSpacing) {
      const spacingOption = PROMPT_BUILDER_OPTIONS.letterSpacings.find(l => l.value === letterSpacing);
      if (spacingOption) {
        prompts.push({
          id: `letter-spacing-${letterSpacing}`,
          category: "Letter Spacing",
          label: spacingOption.label,
          description: `${spacingOption.label} letter spacing`,
        });
      }
    }

    // Animation Type
    if (animationType) {
      const animationOption = PROMPT_BUILDER_OPTIONS.animationTypes.find(a => a.value === animationType);
      if (animationOption) {
        prompts.push({
          id: `animation-type-${animationType}`,
          category: "Animation",
          label: animationOption.label,
          description: `${animationOption.label} animation effect`,
        });
      }
    }

    // Animation Scene
    if (animationScene) {
      const sceneOption = PROMPT_BUILDER_OPTIONS.animationScenes.find(s => s.value === animationScene);
      if (sceneOption) {
        prompts.push({
          id: `animation-scene-${animationScene}`,
          category: "Animation Scene",
          label: sceneOption.label,
          description: `Animate ${sceneOption.label.toLowerCase()}`,
        });
      }
    }

    // Animation Timing
    if (animationTiming) {
      const timingOption = PROMPT_BUILDER_OPTIONS.animationTimings.find(t => t.value === animationTiming);
      if (timingOption) {
        prompts.push({
          id: `animation-timing-${animationTiming}`,
          category: "Animation Timing",
          label: timingOption.label,
          description: `${timingOption.label} timing function`,
        });
      }
    }

    return prompts;
  }, [layoutType, layoutConfig, framing, style, theme, accentColor, backgroundColor, shadow, typefaceType, headingFont, bodyFont, headingSize, headingWeight, letterSpacing, animation, animationType, animationScene, animationTiming]);

  const handleReset = () => {
    setLayoutType(null);
    setLayoutConfig(null);
    setFraming(null);
    setStyle(null);
    setTheme(null);
    setAccentColor(null);
    setBackgroundColor(null);
    setBorderColor(null);
    setShadow(null);
    setTypefaceType(null);
    setHeadingFont(null);
    setBodyFont(null);
    setHeadingSize(null);
    setSubheadingSize(null);
    setBodyTextSize(null);
    setHeadingWeight(null);
    setLetterSpacing(null);
    setAnimation(null);
    // Reset new animation options
    setAnimationType(null);
    setAnimationScene(null);
    setAnimationDuration(0.8);
    setAnimationDelay(0);
    setAnimationTiming(null);
    setAnimationIterations(null);
    setAnimationDirection(null);
    setIsAnimating(false);
    setAdditionalInstructions("");
    setSelectedPrompts([]);
  };

  const handleGenerate = () => {
    let prompt = buildPromptFromOptions({
      layoutType,
      layoutConfig,
      framing,
      style,
      theme,
      accentColor,
      backgroundColor,
      borderColor,
      shadow,
      typefaceType,
      headingFont,
      bodyFont,
      headingSize,
      headingWeight,
      letterSpacing,
      animation,
      additionalInstructions,
    });

    // Add selected generated prompts
    if (selectedPrompts.length > 0) {
      const promptTexts = selectedPrompts
        .map((id) => {
          const found = PROMPT_BUILDER_OPTIONS.generatedPrompts.find((p) => p.id === id);
          return found?.prompt;
        })
        .filter(Boolean);
      if (promptTexts.length > 0) {
        prompt += " " + promptTexts.join(". ");
      }
    }

    onGenerate(prompt);
    handleClose();
  };

  const togglePrompt = (id: string) => {
    setSelectedPrompts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getAccentHex = (value: string | null) => {
    if (!value) return "#8b5cf6"; // Default violet
    return PROMPT_BUILDER_OPTIONS.accentColors.find((c) => c.value === value)?.hex || "#8b5cf6";
  };

  const getBgHex = (value: string | null) => {
    if (!value) return "#09090b"; // Default dark
    return PROMPT_BUILDER_OPTIONS.backgroundColors.find((c) => c.value === value)?.hex || "#09090b";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
              <Wand2 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Prompt Builder</h2>
              <p className="text-sm text-zinc-400">
                Configure your design parameters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Options */}
          <div className="flex-1 overflow-hidden border-r border-zinc-800">
            <ScrollArea className="h-full">
              <div className="divide-y divide-zinc-800/50">
                {/* Layout Type */}
                <CollapsibleSection title="LAYOUT TYPE" icon={<Layout className="h-4 w-4" />}>
                  <div className="grid grid-cols-4 gap-2">
                    {PROMPT_BUILDER_OPTIONS.layoutTypes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLayoutType(prev => prev === option.value ? null : option.value)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                          layoutType === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <div className="w-full h-9">
                          <LayoutWireframe type={option.value} selected={layoutType === option.value} />
                        </div>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Layout Configuration */}
                <CollapsibleSection title="LAYOUT CONFIGURATION" icon={<Grid3X3 className="h-4 w-4" />}>
                  <div className="grid grid-cols-4 gap-2">
                    {PROMPT_BUILDER_OPTIONS.layoutConfigs.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLayoutConfig(prev => prev === option.value ? null : option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          layoutConfig === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="text-lg">{layoutConfigIcons[option.value]}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Framing */}
                <CollapsibleSection title="FRAMING" icon={<Frame className="h-4 w-4" />}>
                  <div className="grid grid-cols-5 gap-2">
                    {PROMPT_BUILDER_OPTIONS.framing.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFraming(prev => prev === option.value ? null : option.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                          framing === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        <span className="text-lg">{framingIcons[option.value]}</span>
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Style */}
                <CollapsibleSection title="STYLE" icon={<Sparkles className="h-4 w-4" />}>
                  <div className="grid grid-cols-6 gap-2">
                    {PROMPT_BUILDER_OPTIONS.styles.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStyle(prev => prev === option.value ? null : option.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                          style === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Theme */}
                <CollapsibleSection title="THEME" icon={<Sun className="h-4 w-4" />}>
                  <div className="flex gap-2">
                    {PROMPT_BUILDER_OPTIONS.themes.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(prev => prev === option.value ? null : option.value)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 transition-all",
                          theme === option.value
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                            : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/50"
                        )}
                      >
                        {option.value === "dark" ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Colors Row */}
                <CollapsibleSection title="COLORS" icon={<Palette className="h-4 w-4" />}>
                  <div className="space-y-4">
                    {/* Accent Color */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Accent Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.accentColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setAccentColor(prev => prev === color.value ? null : color.value)}
                            className={cn(
                              "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                              accentColor === color.value
                                ? "border-white/50 ring-2 ring-white/20"
                                : "border-transparent hover:border-zinc-600"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          >
                            {accentColor === color.value && (
                              <Check className="h-4 w-4 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Background Color */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Background Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PROMPT_BUILDER_OPTIONS.backgroundColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBackgroundColor(prev => prev === color.value ? null : color.value)}
                            className={cn(
                              "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
                              backgroundColor === color.value
                                ? "border-violet-500/50 ring-2 ring-violet-500/20"
                                : "border-zinc-700 hover:border-zinc-600"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          >
                            {backgroundColor === color.value && (
                              <Check className="h-4 w-4 text-violet-400 drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border & Shadow */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Border Color</label>
                        <div className="flex flex-wrap gap-2">
                          {PROMPT_BUILDER_OPTIONS.borderColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setBorderColor(prev => prev === color.value ? null : color.value)}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs transition-all",
                                borderColor === color.value
                                  ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                  : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                              )}
                            >
                              {color.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Shadow</label>
                        <div className="flex flex-wrap gap-2">
                          {PROMPT_BUILDER_OPTIONS.shadows.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => setShadow(prev => prev === s.value ? null : s.value)}
                              className={cn(
                                "rounded-lg border px-3 py-1.5 text-xs transition-all",
                                shadow === s.value
                                  ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                  : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Typography */}
                <CollapsibleSection title="TYPEFACE FAMILY" icon={<Type className="h-4 w-4" />}>
                  <div className="space-y-6">
                    {/* Typeface Type */}
                    <div className="grid grid-cols-6 gap-2">
                      {PROMPT_BUILDER_OPTIONS.typefaceTypes.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTypefaceType(prev => prev === t.value ? null : t.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                            typefaceType === t.value
                              ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                              : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          <span className={cn(
                            "text-lg",
                            t.value === "serif" && "font-serif",
                            t.value === "mono" && "font-mono",
                            t.value === "condensed" && "tracking-tighter",
                            t.value === "expanded" && "tracking-widest",
                          )}>Type</span>
                          <span className="text-[10px] text-zinc-500">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Heading Font */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Heading Font</label>
                      <div className="grid grid-cols-6 gap-2">
                        {PROMPT_BUILDER_OPTIONS.headingFonts.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => setHeadingFont(prev => prev === f.value ? null : f.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              headingFont === f.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "text-lg",
                              (f.value === "playfair" || f.value === "instrument-serif" || f.value === "plex-serif") && "font-serif italic"
                            )}>Title</span>
                            <span className="text-[10px] text-zinc-500">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Body & UI Font */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Body & UI Font</label>
                      <div className="grid grid-cols-6 gap-2">
                        {PROMPT_BUILDER_OPTIONS.bodyFonts.map((f) => (
                          <button
                            key={f.value}
                            onClick={() => setBodyFont(prev => prev === f.value ? null : f.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              bodyFont === f.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "text-base",
                              (f.value === "playfair" || f.value === "instrument-serif" || f.value === "plex-serif") && "font-serif"
                            )}>Body</span>
                            <span className="text-[10px] text-zinc-500">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Heading Size */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Heading Size</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.headingSizes.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setHeadingSize(prev => prev === s.value ? null : s.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              headingSize === s.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "font-semibold",
                              s.value === "sm" && "text-lg",
                              s.value === "md" && "text-xl",
                              s.value === "lg" && "text-2xl",
                              s.value === "xl" && "text-3xl",
                            )}>Title</span>
                            <span className="text-[10px] text-zinc-500">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Subheading Size */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Subheading Size</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.subheadingSizes.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setSubheadingSize(prev => prev === s.value ? null : s.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              subheadingSize === s.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn(
                              "font-medium",
                              s.value === "sm" && "text-sm",
                              s.value === "md" && "text-base",
                              s.value === "lg" && "text-lg",
                              s.value === "xl" && "text-xl",
                            )}>Subtitle</span>
                            <span className="text-[10px] text-zinc-500">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Body Text Size */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Body Text Size</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.bodyTextSizes.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setBodyTextSize(prev => prev === s.value ? null : s.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              bodyTextSize === s.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className={cn(
                              s.value === "sm" && "text-xs",
                              s.value === "md" && "text-sm",
                              s.value === "lg" && "text-base",
                              s.value === "xl" && "text-lg",
                            )}>Body</span>
                            <span className="text-[10px] text-zinc-500">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Heading Font Weight */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Heading Font Weight</label>
                      <div className="grid grid-cols-6 gap-2">
                        {PROMPT_BUILDER_OPTIONS.headingWeights.map((w) => (
                          <button
                            key={w.value}
                            onClick={() => setHeadingWeight(prev => prev === w.value ? null : w.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              headingWeight === w.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span style={{ fontWeight: w.weight }} className="text-lg">Title</span>
                            <span className="text-[10px] text-zinc-500">{w.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Letter Spacing */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">Heading Letter Spacing</label>
                      <div className="grid grid-cols-6 gap-2">
                        {PROMPT_BUILDER_OPTIONS.letterSpacings.map((l) => (
                          <button
                            key={l.value}
                            onClick={() => setLetterSpacing(prev => prev === l.value ? null : l.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              letterSpacing === l.value
                                ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span style={{ letterSpacing: l.tracking }} className="text-lg font-medium">Title</span>
                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                              <span className="flex gap-px">
                                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                                <span className="h-1 w-1 rounded-full bg-zinc-600" />
                              </span>
                            </span>
                            <span className="text-[10px] text-zinc-500">{l.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Animation Type - Expanded like Aura */}
                <CollapsibleSection title="ANIMATION TYPE" icon={<Play className="h-4 w-4" />}>
                  <div className="space-y-6">
                    {/* Animation Type Selection */}
                    <div className="grid grid-cols-6 gap-2">
                      {PROMPT_BUILDER_OPTIONS.animationTypes.map((a) => (
                        <button
                          key={a.value}
                          onClick={() => setAnimationType(prev => prev === a.value ? null : a.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                            animationType === a.value
                              ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                              : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                          )}
                        >
                          {a.value === "rotate" ? (
                            <Diamond className={cn("h-5 w-5", animationType === a.value && "text-blue-400")} />
                          ) : (
                            <Square className={cn("h-5 w-5", animationType === a.value && "text-blue-400")} />
                          )}
                          <span className="text-xs">{a.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Scene */}
                    <div>
                      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase">
                        SCENE
                        <button
                          onClick={() => setAnimationScene(null)}
                          className="text-zinc-600 hover:text-zinc-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.animationScenes.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => setAnimationScene(prev => prev === s.value ? null : s.value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                              animationScene === s.value
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            {s.value === "all-at-once" && <LayoutGrid className="h-4 w-4" />}
                            {s.value === "sequence" && <Layers className="h-4 w-4" />}
                            {(s.value === "word-by-word" || s.value === "letter-by-letter") && <Type className="h-4 w-4" />}
                            <span className="text-[10px]">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase">DURATION</label>
                        <span className="text-xs text-zinc-400">{animationDuration.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={animationDuration}
                        onChange={(e) => setAnimationDuration(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>

                    {/* Delay */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase">DELAY</label>
                        <span className="text-xs text-zinc-400">{animationDelay.toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={animationDelay}
                        onChange={(e) => setAnimationDelay(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                      />
                    </div>

                    {/* Timing */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">TIMING</label>
                      <div className="grid grid-cols-6 gap-2">
                        {PROMPT_BUILDER_OPTIONS.animationTimings.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setAnimationTiming(prev => prev === t.value ? null : t.value)}
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all",
                              animationTiming === t.value
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            {/* Timing curve visualization */}
                            <svg viewBox="0 0 24 16" className="w-8 h-4">
                              <path
                                d={
                                  t.value === "linear" ? "M2 14 L22 2" :
                                  t.value === "ease" ? "M2 14 Q6 14 12 8 Q18 2 22 2" :
                                  t.value === "ease-in" ? "M2 14 Q12 14 22 2" :
                                  t.value === "ease-out" ? "M2 14 Q12 2 22 2" :
                                  t.value === "ease-in-out" ? "M2 14 Q2 8 12 8 Q22 8 22 2" :
                                  "M2 14 Q6 20 12 8 Q18 -4 22 2" // spring
                                }
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="text-[10px]">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Iterations */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">ITERATIONS</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.animationIterations.map((i) => (
                          <button
                            key={i.value}
                            onClick={() => setAnimationIterations(prev => prev === i.value ? null : i.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              animationIterations === i.value
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            <span className="text-lg font-medium">
                              {i.value === "infinite" ? <Infinity className="h-5 w-5" /> : i.display}
                            </span>
                            <span className="text-[10px]">{i.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direction */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-zinc-500 uppercase">DIRECTION</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PROMPT_BUILDER_OPTIONS.animationDirections.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setAnimationDirection(prev => prev === d.value ? null : d.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                              animationDirection === d.value
                                ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:border-zinc-700"
                            )}
                          >
                            {d.value === "normal" && <ArrowRight className="h-4 w-4" />}
                            {d.value === "reverse" && <ArrowLeft className="h-4 w-4" />}
                            {d.value === "alternate" && <ArrowRightLeft className="h-4 w-4" />}
                            {d.value === "alternate-reverse" && <ArrowRightLeft className="h-4 w-4 rotate-180" />}
                            <span className="text-[10px]">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Additional Instructions */}
                <CollapsibleSection title="ADDITIONAL INSTRUCTIONS" icon={<FileText className="h-4 w-4" />} defaultOpen={false}>
                  <textarea
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="Add any specific requirements or details..."
                    className="min-h-[100px] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                  />
                </CollapsibleSection>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Dynamic Prompts & Preview */}
          <div className="flex w-96 flex-col bg-zinc-900/50">
            {/* Preview Header */}
            <div className="border-b border-zinc-800 p-4">
              <h3 className="mb-1 text-sm font-semibold text-zinc-200">PREVIEW</h3>
              <p className="text-xs text-zinc-500">
                {dynamicPrompts.length > 0
                  ? `${dynamicPrompts.length} option${dynamicPrompts.length > 1 ? 's' : ''} selected`
                  : "Select options to preview"
                }
              </p>
            </div>

            {/* Configuration Preview - shows all selections */}
            <div className="p-4 border-b border-zinc-800">
              {/* Show Animation Preview if any animation option is selected */}
              {animationType ? (
                <div
                  className="relative rounded-xl border border-zinc-800 p-6 space-y-3 flex flex-col items-center justify-center h-44"
                  style={{
                    backgroundColor: backgroundColor
                      ? PROMPT_BUILDER_OPTIONS.backgroundColors.find(c => c.value === backgroundColor)?.hex
                      : theme === "light" ? "#fafafa" : "#09090b"
                  }}
                >
                  {/* Replay Animation Icon - Top Right */}
                  <button
                    onClick={() => {
                      setIsAnimating(false);
                      setTimeout(() => setIsAnimating(true), 50);
                    }}
                    className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    title="Replay Animation"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  {/* Badge */}
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-full text-xs font-medium",
                      isAnimating && animationType === "fade" && "animate-[fadeIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "slide" && "animate-[slideIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "scale" && "animate-[scaleIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "rotate" && "animate-[rotateIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "blur" && "animate-[blurIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "3d" && "animate-[flip3d_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                    )}
                    style={{
                      backgroundColor: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex + "20"
                        : "#3b82f620",
                      color: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex
                        : "#3b82f6",
                      // @ts-expect-error CSS custom properties
                      "--duration": `${animationDuration}s`,
                      "--timing": animationTiming ? PROMPT_BUILDER_OPTIONS.animationTimings.find(t => t.value === animationTiming)?.curve : "ease",
                      "--delay": `${animationDelay}s`,
                      "--iterations": animationIterations || "1",
                      "--direction": animationDirection || "normal",
                    }}
                  >
                    New Feature
                  </span>

                  {/* Animated Heading */}
                  <h3
                    className={cn(
                      "text-xl font-semibold text-center",
                      isAnimating && animationType === "fade" && "animate-[fadeIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "slide" && "animate-[slideIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "scale" && "animate-[scaleIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "rotate" && "animate-[rotateIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "blur" && "animate-[blurIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "3d" && "animate-[flip3d_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                    )}
                    style={{
                      color: theme === "light" ? "#18181b" : "#fafafa",
                      animationDelay: animationScene === "sequence" ? `${animationDelay + 0.1}s` : `${animationDelay}s`,
                      // @ts-expect-error CSS custom properties
                      "--duration": `${animationDuration}s`,
                      "--timing": animationTiming ? PROMPT_BUILDER_OPTIONS.animationTimings.find(t => t.value === animationTiming)?.curve : "ease",
                      "--delay": animationScene === "sequence" ? `${animationDelay + 0.1}s` : `${animationDelay}s`,
                      "--iterations": animationIterations || "1",
                      "--direction": animationDirection || "normal",
                    }}
                  >
                    Animated Content
                  </h3>

                  {/* Animated Button */}
                  <button
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium text-white",
                      isAnimating && animationType === "fade" && "animate-[fadeIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "slide" && "animate-[slideIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "scale" && "animate-[scaleIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "rotate" && "animate-[rotateIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "blur" && "animate-[blurIn_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                      isAnimating && animationType === "3d" && "animate-[flip3d_var(--duration)_var(--timing)_var(--delay)_var(--iterations)_var(--direction)]",
                    )}
                    style={{
                      backgroundColor: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex
                        : "#3b82f6",
                      animationDelay: animationScene === "sequence" ? `${animationDelay + 0.2}s` : `${animationDelay}s`,
                      // @ts-expect-error CSS custom properties
                      "--duration": `${animationDuration}s`,
                      "--timing": animationTiming ? PROMPT_BUILDER_OPTIONS.animationTimings.find(t => t.value === animationTiming)?.curve : "ease",
                      "--delay": animationScene === "sequence" ? `${animationDelay + 0.2}s` : `${animationDelay}s`,
                      "--iterations": animationIterations || "1",
                      "--direction": animationDirection || "normal",
                    }}
                  >
                    Button
                  </button>

                  {/* CSS Keyframes - injected via style tag */}
                  <style jsx>{`
                    @keyframes fadeIn {
                      from { opacity: 0; }
                      to { opacity: 1; }
                    }
                    @keyframes slideIn {
                      from { transform: translateY(20px); opacity: 0; }
                      to { transform: translateY(0); opacity: 1; }
                    }
                    @keyframes scaleIn {
                      from { transform: scale(0.8); opacity: 0; }
                      to { transform: scale(1); opacity: 1; }
                    }
                    @keyframes rotateIn {
                      from { transform: rotate(-10deg) scale(0.9); opacity: 0; }
                      to { transform: rotate(0deg) scale(1); opacity: 1; }
                    }
                    @keyframes blurIn {
                      from { filter: blur(10px); opacity: 0; }
                      to { filter: blur(0); opacity: 1; }
                    }
                    @keyframes flip3d {
                      from { transform: perspective(400px) rotateY(-90deg); opacity: 0; }
                      to { transform: perspective(400px) rotateY(0); opacity: 1; }
                    }
                  `}</style>
                </div>
              ) : (typefaceType || headingFont || bodyFont || headingSize || headingWeight || letterSpacing) ? (
                <div
                  className="rounded-xl border border-zinc-800 p-6 space-y-3"
                  style={{
                    backgroundColor: backgroundColor
                      ? PROMPT_BUILDER_OPTIONS.backgroundColors.find(c => c.value === backgroundColor)?.hex
                      : theme === "light" ? "#fafafa" : "#09090b"
                  }}
                >
                  {/* Badge */}
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex + "20"
                        : "#8b5cf620",
                      color: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex
                        : "#8b5cf6"
                    }}
                  >
                    New Feature
                  </span>

                  {/* Heading */}
                  <h3
                    className={cn(
                      "leading-tight",
                      headingSize === "sm" && "text-lg",
                      headingSize === "md" && "text-xl",
                      headingSize === "lg" && "text-2xl",
                      headingSize === "xl" && "text-3xl",
                      !headingSize && "text-2xl",
                      // Typeface type styling
                      typefaceType === "serif" && "font-serif",
                      typefaceType === "mono" && "font-mono",
                      typefaceType === "condensed" && "tracking-tighter",
                      typefaceType === "expanded" && "tracking-widest",
                      // Heading font styling (overrides typeface type if both set)
                      (headingFont === "playfair" || headingFont === "instrument-serif" || headingFont === "plex-serif") && "font-serif",
                    )}
                    style={{
                      fontWeight: headingWeight
                        ? PROMPT_BUILDER_OPTIONS.headingWeights.find(w => w.value === headingWeight)?.weight
                        : 600,
                      letterSpacing: letterSpacing
                        ? PROMPT_BUILDER_OPTIONS.letterSpacings.find(l => l.value === letterSpacing)?.tracking
                        : "0",
                      color: theme === "light" ? "#18181b" : "#fafafa"
                    }}
                  >
                    Create Beautiful Designs
                  </h3>

                  {/* Subheading */}
                  <p
                    className={cn(
                      "font-medium",
                      subheadingSize === "sm" && "text-sm",
                      subheadingSize === "md" && "text-base",
                      subheadingSize === "lg" && "text-lg",
                      subheadingSize === "xl" && "text-xl",
                      !subheadingSize && "text-base",
                      // Typeface type styling for subheading
                      typefaceType === "serif" && "font-serif",
                      typefaceType === "mono" && "font-mono",
                      typefaceType === "condensed" && "tracking-tighter",
                      typefaceType === "expanded" && "tracking-wider",
                    )}
                    style={{ color: theme === "light" ? "#3f3f46" : "#a1a1aa" }}
                  >
                    Font Preview & Styling
                  </p>

                  {/* Body text */}
                  <p
                    className={cn(
                      bodyTextSize === "sm" && "text-xs",
                      bodyTextSize === "md" && "text-sm",
                      bodyTextSize === "lg" && "text-base",
                      bodyTextSize === "xl" && "text-lg",
                      !bodyTextSize && "text-sm",
                      // Typeface type styling for body
                      typefaceType === "serif" && "font-serif",
                      typefaceType === "mono" && "font-mono",
                      typefaceType === "condensed" && "tracking-tighter",
                      typefaceType === "expanded" && "tracking-wider",
                      // Body font styling (overrides typeface type if both set)
                      (bodyFont === "playfair" || bodyFont === "instrument-serif" || bodyFont === "plex-serif") && "font-serif",
                    )}
                    style={{ color: theme === "light" ? "#52525b" : "#71717a" }}
                  >
                    This text shows how your selected font looks in a paragraph format with the chosen weight and spacing applied.
                  </p>

                  {/* Button */}
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{
                      backgroundColor: accentColor
                        ? PROMPT_BUILDER_OPTIONS.accentColors.find(c => c.value === accentColor)?.hex
                        : "#8b5cf6",
                      borderRadius: style === "ios" ? "12px" : style === "flat" ? "4px" : "8px"
                    }}
                  >
                    Action Button
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 h-44 overflow-hidden">
                  <ConfigurationPreview
                    layoutType={layoutType}
                    layoutConfig={layoutConfig}
                    framing={framing}
                    style={style}
                    theme={theme}
                    accentColor={accentColor}
                    backgroundColor={backgroundColor}
                  />
                </div>
              )}
            </div>

            {/* Generated Prompts Header */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase">Generated Prompts</h3>
            </div>

            <ScrollArea className="flex-1">
              {/* Dynamic Prompts based on selections */}
              <div className="px-4 pb-4 space-y-2">
                {dynamicPrompts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs text-zinc-600">Selecione opções para gerar prompts</p>
                  </div>
                ) : (
                  dynamicPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3"
                    >
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{prompt.category}</span>
                      <p className="text-sm text-violet-300 font-medium">{prompt.label}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{prompt.description}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Add Section - Pre-defined prompts */}
              <div className="border-t border-zinc-800 p-4">
                <h4 className="mb-3 text-xs font-semibold text-zinc-400 uppercase">Quick Add</h4>
                <div className="space-y-2">
                  {PROMPT_BUILDER_OPTIONS.generatedPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => togglePrompt(prompt.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all",
                        selectedPrompts.includes(prompt.id)
                          ? "border-violet-500/50 bg-violet-500/10"
                          : "border-zinc-800 bg-zinc-800/20 hover:border-zinc-700 hover:bg-zinc-800/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all",
                          selectedPrompts.includes(prompt.id)
                            ? "border-violet-500 bg-violet-500 text-white"
                            : "border-zinc-700 bg-zinc-800"
                        )}
                      >
                        {selectedPrompts.includes(prompt.id) ? (
                          <Check className="h-2.5 w-2.5" />
                        ) : (
                          <Plus className="h-2.5 w-2.5 text-zinc-500" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs",
                          selectedPrompts.includes(prompt.id) ? "text-violet-300" : "text-zinc-400"
                        )}
                      >
                        {prompt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Generate Footer */}
            <div className="border-t border-zinc-800 p-4 space-y-3">
              {/* Color Preview */}
              {(accentColor || backgroundColor) && (
                <div className="flex items-center gap-3 rounded-lg bg-zinc-800/30 p-2">
                  <div
                    className="h-8 w-8 rounded-md border border-zinc-700"
                    style={{ backgroundColor: getBgHex(backgroundColor) }}
                  />
                  <div
                    className="h-8 w-8 rounded-md"
                    style={{ backgroundColor: getAccentHex(accentColor) }}
                  />
                  <span className="text-xs text-zinc-500">Colors</span>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium rounded-xl py-3 transition-all shadow-lg shadow-violet-500/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
