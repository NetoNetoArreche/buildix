import { CodeSnippet } from "../types";

const code = `/* Magnetic Button Effect - Interactive Hover */
<style>
.magnetic-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}

.magnetic-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.magnetic-btn:hover::before {
  opacity: 1;
}

.magnetic-btn span {
  position: relative;
  z-index: 1;
}

/* Ripple effect on click */
.magnetic-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  transform: scale(0);
  opacity: 0;
  transition: transform 0.5s, opacity 0.5s;
}

.magnetic-btn:active::after {
  transform: scale(2);
  opacity: 1;
  transition: 0s;
}

/* Shine effect */
.magnetic-btn-shine::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s;
}

.magnetic-btn-shine:hover::before {
  left: 100%;
}
</style>

<script>
// Magnetic effect JavaScript
document.querySelectorAll('.magnetic-btn').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btn.style.transform = \`translate(\${x * 0.3}px, \${y * 0.3}px)\`;
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});
</script>

<!-- Usage Example -->
<button class="magnetic-btn magnetic-btn-shine">
  <span>Hover Me</span>
</button>`;

export const MAGNETIC_BUTTON: CodeSnippet = {
  id: "magnetic-button",
  name: "Magnetic Button",
  description: "Botao interativo com efeito magnetico no hover",
  category: "mixed",
  tags: ["button", "magnetic", "hover", "interactive", "animation"],
  charCount: code.length,
  code,
};
