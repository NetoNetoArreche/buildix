import { CodeSnippet } from "../types";

const code = `/* Spotlight Effect - Mouse Following Light */
<style>
.spotlight-container {
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
}

.spotlight-container::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle,
    rgba(120, 119, 198, 0.3) 0%,
    rgba(120, 119, 198, 0.1) 25%,
    transparent 70%
  );
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  left: var(--mouse-x, 50%);
  top: var(--mouse-y, 50%);
  transition: opacity 0.3s;
  z-index: 1;
}

/* Spotlight with blur edge */
.spotlight-blur::before {
  filter: blur(40px);
  width: 600px;
  height: 600px;
}

/* Multiple color spotlight */
.spotlight-rainbow::before {
  background: radial-gradient(
    circle,
    rgba(255, 0, 128, 0.2) 0%,
    rgba(0, 255, 255, 0.15) 30%,
    rgba(128, 0, 255, 0.1) 50%,
    transparent 70%
  );
}

/* Card with spotlight border */
.spotlight-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.spotlight-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--mouse-x, 0) var(--mouse-y, 0),
    rgba(255, 255, 255, 0.06),
    transparent 40%
  );
  pointer-events: none;
}

.spotlight-card::after {
  content: '';
  position: absolute;
  inset: -1px;
  background: radial-gradient(
    400px circle at var(--mouse-x, 0) var(--mouse-y, 0),
    rgba(255, 255, 255, 0.3),
    transparent 40%
  );
  border-radius: 16px;
  z-index: -1;
  pointer-events: none;
}
</style>

<script>
// Spotlight mouse tracking
document.querySelectorAll('.spotlight-container, .spotlight-card').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty('--mouse-x', x + 'px');
    el.style.setProperty('--mouse-y', y + 'px');
  });
});
</script>

<!-- Usage Examples -->
<section class="spotlight-container spotlight-blur min-h-screen">
  <div class="relative z-10 p-8">
    <h1 class="text-white">Move your mouse</h1>
  </div>
</section>

<div class="spotlight-card p-6">
  <h3 class="text-white">Spotlight Card</h3>
</div>`;

export const SPOTLIGHT_EFFECT: CodeSnippet = {
  id: "spotlight-effect",
  name: "Spotlight Effect",
  description: "Efeito de luz que segue o mouse",
  category: "mixed",
  tags: ["spotlight", "mouse", "light", "hover", "gradient", "interactive"],
  charCount: code.length,
  code,
};
