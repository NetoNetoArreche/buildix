import { CodeSnippet } from "../types";

const code = `/* Glow Text Effect - Neon Style */
<style>
.glow-text {
  color: #fff;
  text-shadow:
    0 0 5px currentColor,
    0 0 10px currentColor,
    0 0 20px currentColor,
    0 0 40px currentColor;
}

.glow-text-blue {
  color: #00d4ff;
  text-shadow:
    0 0 5px #00d4ff,
    0 0 10px #00d4ff,
    0 0 20px #00d4ff,
    0 0 40px #0099cc;
}

.glow-text-purple {
  color: #b76cfd;
  text-shadow:
    0 0 5px #b76cfd,
    0 0 10px #b76cfd,
    0 0 20px #b76cfd,
    0 0 40px #8b5cf6;
}

.glow-text-green {
  color: #00ff88;
  text-shadow:
    0 0 5px #00ff88,
    0 0 10px #00ff88,
    0 0 20px #00ff88,
    0 0 40px #00cc6a;
}

.glow-text-animated {
  animation: glow-pulse 2s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from {
    text-shadow:
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor;
  }
  to {
    text-shadow:
      0 0 10px currentColor,
      0 0 20px currentColor,
      0 0 30px currentColor,
      0 0 40px currentColor;
  }
}
</style>

<!-- Usage Examples -->
<h1 class="glow-text-blue glow-text-animated">Neon Glow</h1>
<h2 class="glow-text-purple">Purple Magic</h2>
<p class="glow-text-green">Matrix Style</p>`;

export const GLOW_TEXT: CodeSnippet = {
  id: "glow-text",
  name: "Glow Text",
  description: "Efeito de texto neon com brilho animado",
  category: "css",
  tags: ["glow", "neon", "text", "animation", "shadow"],
  charCount: code.length,
  code,
};
