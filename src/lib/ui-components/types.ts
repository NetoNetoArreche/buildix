export type ComponentCategory =
  | "hero"
  | "feature"
  | "cta"
  | "pricing"
  | "testimonial"
  | "footer"
  | "navbar"
  | "card"
  | "form"
  | "gallery";

export interface UIComponent {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
  code: string;
  tags: string[];
  charCount: number;
  isPro?: boolean;
}

export interface SelectedComponent {
  id: string;
  name: string;
  charCount: number;
}
