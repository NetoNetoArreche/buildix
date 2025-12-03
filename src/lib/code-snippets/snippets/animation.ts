import { CodeSnippet } from "../types";

const scrollCode = `/* Animation on Scroll */
<style>
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-left {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal-left.visible {
  opacity: 1;
  transform: translateX(0);
}
.reveal-right {
  opacity: 0;
  transform: translateX(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal-right.visible {
  opacity: 1;
  transform: translateX(0);
}
.reveal-scale {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal-scale.visible {
  opacity: 1;
  transform: scale(1);
}
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el);
  });
});
</script>`;

const keyframeCode = `/* Animation Keyframes */
<style>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-fade-in { animation: fadeIn 0.6s ease forwards; }
.animate-slide-up { animation: slideUp 0.6s ease forwards; }
.animate-slide-down { animation: slideDown 0.6s ease forwards; }
.animate-scale-in { animation: scaleIn 0.6s ease forwards; }
.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-bounce { animation: bounce 1s ease-in-out infinite; }

/* Delay utilities */
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }
</style>`;

export const ANIMATION_SCROLL: CodeSnippet = {
  id: "animation-scroll",
  name: "Animation on Scroll",
  description: "IntersectionObserver with reveal animations",
  category: "mixed",
  tags: ["animation", "scroll", "reveal", "intersection", "observer"],
  charCount: scrollCode.length,
  code: scrollCode,
};

export const ANIMATION_KEYFRAME: CodeSnippet = {
  id: "animation-keyframe",
  name: "Animation Keyframes",
  description: "Reusable CSS keyframe animations",
  category: "css",
  tags: ["animation", "keyframe", "fade", "slide", "bounce", "pulse"],
  charCount: keyframeCode.length,
  code: keyframeCode,
};
