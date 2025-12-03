import { CodeSnippet } from "../types";

const topCode = `/* Progressive Blur Top */
.progressive-blur-top {
  position: relative;
}
.progressive-blur-top::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.8) 0%,
    transparent 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    black 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 10;
}`;

const bottomCode = `/* Progressive Blur Bottom */
.progressive-blur-bottom {
  position: relative;
}
.progressive-blur-bottom::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100px;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    transparent 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  mask-image: linear-gradient(
    to top,
    black 0%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to top,
    black 0%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 10;
}`;

export const PROGRESSIVE_BLUR_TOP: CodeSnippet = {
  id: "progressive-blur-top",
  name: "Progressive Blur Top",
  description: "Backdrop blur fading from top edge",
  category: "css",
  tags: ["blur", "backdrop", "fade", "glass", "top"],
  charCount: topCode.length,
  code: topCode,
};

export const PROGRESSIVE_BLUR_BOTTOM: CodeSnippet = {
  id: "progressive-blur-bottom",
  name: "Progressive Blur Bottom",
  description: "Backdrop blur fading from bottom edge",
  category: "css",
  tags: ["blur", "backdrop", "fade", "glass", "bottom"],
  charCount: bottomCode.length,
  code: bottomCode,
};
