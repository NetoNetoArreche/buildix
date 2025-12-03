import { CodeSnippet } from "../types";

const code = `/* 3D Card Hover Effect - Tilt on Mouse Move */
<style>
.card-3d {
  position: relative;
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 0.1s ease;
}

.card-3d-inner {
  position: relative;
  padding: 2rem;
  background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  transform-style: preserve-3d;
  backdrop-filter: blur(10px);
}

/* Floating elements inside card */
.card-3d-float {
  transform: translateZ(50px);
}

.card-3d-float-high {
  transform: translateZ(80px);
}

/* Shine effect */
.card-3d-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgba(255, 255, 255, 0.1) 45%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 55%,
    transparent 60%
  );
  border-radius: 20px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.card-3d:hover .card-3d-inner::before {
  opacity: 1;
}

/* Glow shadow on hover */
.card-3d-glow {
  transition: box-shadow 0.3s ease;
}

.card-3d-glow:hover {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 60px rgba(120, 119, 198, 0.3);
}

/* Simple CSS-only tilt (no JS) */
.card-3d-simple:hover {
  transform: perspective(1000px) rotateX(5deg) rotateY(-5deg);
}
</style>

<script>
// 3D Tilt effect JavaScript
document.querySelectorAll('.card-3d').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    card.style.transform = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg)\`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
});
</script>

<!-- Usage Example -->
<div class="card-3d card-3d-glow">
  <div class="card-3d-inner">
    <h3 class="card-3d-float text-xl font-bold text-white">3D Card</h3>
    <p class="text-white/70 mt-2">Hover to see the tilt effect</p>
    <button class="card-3d-float-high mt-4 px-4 py-2 bg-white/20 rounded-lg">
      Floating Button
    </button>
  </div>
</div>`;

export const CARD_3D: CodeSnippet = {
  id: "3d-card",
  name: "3D Card",
  description: "Card com efeito 3D que inclina no hover",
  category: "mixed",
  tags: ["3d", "card", "tilt", "hover", "perspective", "interactive"],
  charCount: code.length,
  code,
};
