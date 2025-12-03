import { CodeSnippet } from "../types";

const verticalCode = `/* Alpha Mask Vertical */
.alpha-mask-vertical {
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}`;

const horizontalCode = `/* Alpha Mask Horizontal */
.alpha-mask-horizontal {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}`;

export const ALPHA_MASK_VERTICAL: CodeSnippet = {
  id: "alpha-mask-vertical",
  name: "Alpha Mask Vertical",
  description: "Fade edges with vertical gradient mask",
  category: "css",
  tags: ["mask", "fade", "gradient", "vertical"],
  charCount: verticalCode.length,
  code: verticalCode,
};

export const ALPHA_MASK_HORIZONTAL: CodeSnippet = {
  id: "alpha-mask-horizontal",
  name: "Alpha Mask Horizontal",
  description: "Fade edges with horizontal gradient mask",
  category: "css",
  tags: ["mask", "fade", "gradient", "horizontal"],
  charCount: horizontalCode.length,
  code: horizontalCode,
};
