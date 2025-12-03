import { CodeSnippet } from "../types";

const code = `/* Noise Texture Overlay - Film Grain Effect */
<style>
.noise-overlay {
  position: relative;
}

.noise-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.05;
  pointer-events: none;
  z-index: 10;
}

/* Stronger noise for dark sections */
.noise-overlay-strong::before {
  opacity: 0.1;
}

/* Animated noise */
.noise-overlay-animated::before {
  animation: noise-shift 0.5s steps(10) infinite;
}

@keyframes noise-shift {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1%, -1%); }
  20% { transform: translate(1%, 1%); }
  30% { transform: translate(-1%, 1%); }
  40% { transform: translate(1%, -1%); }
  50% { transform: translate(-1%, 0); }
  60% { transform: translate(1%, 0); }
  70% { transform: translate(0, -1%); }
  80% { transform: translate(0, 1%); }
  90% { transform: translate(-1%, -1%); }
}

/* Grain texture for hero sections */
.grain-bg {
  background:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  background-blend-mode: overlay;
}
</style>

<!-- Usage Examples -->
<section class="noise-overlay grain-bg min-h-screen">
  <div class="relative z-20 p-8">
    <h1 class="text-white">Content with noise texture</h1>
  </div>
</section>`;

export const NOISE_TEXTURE: CodeSnippet = {
  id: "noise-texture",
  name: "Noise Texture",
  description: "Textura de ruido/grain para fundos estilizados",
  category: "css",
  tags: ["noise", "grain", "texture", "overlay", "background", "film"],
  charCount: code.length,
  code,
};
