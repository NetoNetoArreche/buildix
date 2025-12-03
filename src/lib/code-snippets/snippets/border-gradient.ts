import { CodeSnippet } from "../types";

const code = `/* Border Gradient Effect */
.border-gradient {
  position: relative;
  background: #0a0a0a;
  border-radius: 12px;
}
.border-gradient::before {
  content: "";
  position: absolute;
  inset: 0;
  padding: 1px;
  border-radius: inherit;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #d946ef);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}`;

export const BORDER_GRADIENT: CodeSnippet = {
  id: "border-gradient",
  name: "Border Gradient",
  description: "Gradient border using pseudo-element",
  category: "css",
  tags: ["border", "gradient", "effect", "glow"],
  charCount: code.length,
  code,
};
