import { UIComponent } from "../types";

const code = `<section class="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center px-6">
  <div class="max-w-4xl mx-auto text-center text-white">
    <div class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-8">
      <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
      Now available for everyone
    </div>
    <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
      Build faster with AI
    </h1>
    <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
      Create stunning landing pages in minutes, not hours. Our AI-powered platform helps you design beautiful websites without any coding.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <button class="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-white/90 transition shadow-lg shadow-purple-500/25">
        Get Started Free
      </button>
      <button class="px-8 py-4 border-2 border-white/30 rounded-full hover:bg-white/10 transition flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        Watch Demo
      </button>
    </div>
  </div>
</section>`;

export const HERO_GRADIENT: UIComponent = {
  id: "hero-gradient",
  name: "Hero Gradient",
  description: "Hero section with gradient background and CTA buttons",
  category: "hero",
  tags: ["hero", "gradient", "cta", "landing"],
  charCount: code.length,
  code,
};
