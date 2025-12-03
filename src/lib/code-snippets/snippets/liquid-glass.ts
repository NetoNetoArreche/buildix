import { CodeSnippet } from "../types";

const code = `/* Liquid Glass Effect - FxFilter.js */
<style>
.liquid-glass-container {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

.liquid-glass-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.liquid-glass-content {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>

<script>
class LiquidGlassEffect {
  constructor(container) {
    this.container = container;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'liquid-glass-canvas';
    this.ctx = this.canvas.getContext('2d');
    this.container.prepend(this.canvas);

    this.resize();
    this.animate();

    window.addEventListener('resize', () => this.resize());
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  animate() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create gradient effect
    const gradient = ctx.createRadialGradient(
      this.mouseX || canvas.width / 2,
      this.mouseY || canvas.height / 2,
      0,
      this.mouseX || canvas.width / 2,
      this.mouseY || canvas.height / 2,
      200
    );

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize on all .liquid-glass-container elements
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.liquid-glass-container').forEach(container => {
    new LiquidGlassEffect(container);
  });
});
</script>

<!-- Usage Example -->
<div class="liquid-glass-container">
  <div class="liquid-glass-content p-8">
    <h2 class="text-white text-2xl font-bold">Liquid Glass Card</h2>
    <p class="text-white/70 mt-2">Interactive glass morphism effect</p>
  </div>
</div>`;

export const LIQUID_GLASS: CodeSnippet = {
  id: "liquid-glass",
  name: "Liquid Glass",
  description: "Interactive glass morphism with canvas FX",
  category: "mixed",
  tags: ["glass", "liquid", "canvas", "interactive", "morphism", "blur"],
  charCount: code.length,
  code,
};
