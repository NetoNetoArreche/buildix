import { CodeSnippet } from "../types";

const code = `/* Floating Elements Animation */
<style>
.floating {
  animation: float 6s ease-in-out infinite;
}

.floating-slow {
  animation: float 8s ease-in-out infinite;
}

.floating-fast {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(1deg);
  }
  50% {
    transform: translateY(-20px) rotate(0deg);
  }
  75% {
    transform: translateY(-10px) rotate(-1deg);
  }
}

/* Floating with horizontal movement */
.floating-drift {
  animation: float-drift 10s ease-in-out infinite;
}

@keyframes float-drift {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(10px, -15px);
  }
  50% {
    transform: translate(-5px, -25px);
  }
  75% {
    transform: translate(-10px, -10px);
  }
}

/* Floating bubbles effect */
.floating-bubble {
  animation: bubble-rise 8s ease-in-out infinite;
  opacity: 0.6;
}

@keyframes bubble-rise {
  0% {
    transform: translateY(100%) scale(0.5);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) scale(1);
    opacity: 0;
  }
}

/* Floating cards with shadow */
.floating-card {
  animation: float-shadow 6s ease-in-out infinite;
}

@keyframes float-shadow {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  50% {
    transform: translateY(-15px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  }
}

/* Delay classes for staggered animations */
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }
</style>

<!-- Usage Examples -->
<div class="floating-card p-6 bg-white rounded-xl">Floating Card</div>
<div class="floating delay-300">Element 1</div>
<div class="floating-slow delay-500">Element 2</div>`;

export const FLOATING_ELEMENTS: CodeSnippet = {
  id: "floating-elements",
  name: "Floating Elements",
  description: "Animacoes de elementos flutuantes com variantes",
  category: "css",
  tags: ["float", "animation", "hover", "movement", "bubble"],
  charCount: code.length,
  code,
};
