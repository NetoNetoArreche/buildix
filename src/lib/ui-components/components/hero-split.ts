import { UIComponent } from "../types";

const code = `<section class="min-h-screen bg-zinc-950 flex items-center">
  <div class="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-block px-4 py-1.5 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-6">
        New Release v2.0
      </span>
      <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
        The future of web design is here
      </h1>
      <p class="text-lg text-zinc-400 mb-8 leading-relaxed">
        Transform your ideas into stunning websites with our intuitive drag-and-drop builder. No coding required.
      </p>
      <div class="flex flex-wrap gap-4">
        <button class="px-6 py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition">
          Start Building
        </button>
        <button class="px-6 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 transition">
          View Examples
        </button>
      </div>
      <div class="flex items-center gap-6 mt-10 pt-10 border-t border-zinc-800">
        <div>
          <div class="text-2xl font-bold text-white">10K+</div>
          <div class="text-sm text-zinc-500">Active Users</div>
        </div>
        <div class="w-px h-10 bg-zinc-800"></div>
        <div>
          <div class="text-2xl font-bold text-white">50K+</div>
          <div class="text-sm text-zinc-500">Sites Created</div>
        </div>
        <div class="w-px h-10 bg-zinc-800"></div>
        <div>
          <div class="text-2xl font-bold text-white">4.9</div>
          <div class="text-sm text-zinc-500">User Rating</div>
        </div>
      </div>
    </div>
    <div class="relative">
      <div class="aspect-square rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-zinc-800 flex items-center justify-center">
        <div class="text-zinc-600 text-center">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <p>Your image here</p>
        </div>
      </div>
      <div class="absolute -bottom-4 -right-4 w-24 h-24 bg-violet-600 rounded-2xl blur-3xl opacity-50"></div>
    </div>
  </div>
</section>`;

export const HERO_SPLIT: UIComponent = {
  id: "hero-split",
  name: "Hero Split",
  description: "Hero section with content on left and image on right",
  category: "hero",
  tags: ["hero", "split", "image", "stats"],
  charCount: code.length,
  code,
};
