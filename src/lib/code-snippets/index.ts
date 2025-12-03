import { CodeSnippet } from "./types";
import { BORDER_GRADIENT } from "./snippets/border-gradient";
import { ALPHA_MASK_VERTICAL, ALPHA_MASK_HORIZONTAL } from "./snippets/alpha-mask";
import { PROGRESSIVE_BLUR_TOP, PROGRESSIVE_BLUR_BOTTOM } from "./snippets/progressive-blur";
import { ANIMATION_SCROLL, ANIMATION_KEYFRAME } from "./snippets/animation";
import { LIQUID_GLASS } from "./snippets/liquid-glass";
import { GLOW_TEXT } from "./snippets/glow-text";
import { NOISE_TEXTURE } from "./snippets/noise-texture";
import { FLOATING_ELEMENTS } from "./snippets/floating-elements";
import { MAGNETIC_BUTTON } from "./snippets/magnetic-button";
import { SPOTLIGHT_EFFECT } from "./snippets/spotlight";
import { TEXT_GRADIENT } from "./snippets/text-gradient";
import { CARD_3D } from "./snippets/3d-card";
import { TYPING_EFFECT } from "./snippets/typing-effect";

export const CODE_SNIPPETS: CodeSnippet[] = [
  // Interactive Effects
  LIQUID_GLASS,
  MAGNETIC_BUTTON,
  SPOTLIGHT_EFFECT,
  CARD_3D,

  // Text Effects
  GLOW_TEXT,
  TEXT_GRADIENT,
  TYPING_EFFECT,

  // Visual Effects
  ALPHA_MASK_VERTICAL,
  ALPHA_MASK_HORIZONTAL,
  PROGRESSIVE_BLUR_TOP,
  PROGRESSIVE_BLUR_BOTTOM,
  NOISE_TEXTURE,
  FLOATING_ELEMENTS,

  // Borders & Decorations
  BORDER_GRADIENT,

  // Animations
  ANIMATION_SCROLL,
  ANIMATION_KEYFRAME,
];

export { type CodeSnippet, type SelectedSnippet, type SnippetCategory, type ModalTab } from "./types";

export function getSnippetById(id: string): CodeSnippet | undefined {
  return CODE_SNIPPETS.find((s) => s.id === id);
}

export function getSnippetsByCategory(category: CodeSnippet["category"]): CodeSnippet[] {
  return CODE_SNIPPETS.filter((s) => s.category === category);
}

export function searchSnippets(query: string): CodeSnippet[] {
  const lowerQuery = query.toLowerCase();
  return CODE_SNIPPETS.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some((t) => t.toLowerCase().includes(lowerQuery))
  );
}
