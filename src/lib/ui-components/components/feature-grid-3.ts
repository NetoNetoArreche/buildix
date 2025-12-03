import { UIComponent } from "../types";

const code = `<section class="py-24 px-6 bg-zinc-950">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="inline-block px-4 py-1.5 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4">
        Features
      </span>
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Everything you need to build
      </h2>
      <p class="text-zinc-400 max-w-2xl mx-auto">
        Powerful features to help you create stunning websites faster than ever before.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors">
        <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
        <p class="text-zinc-400">Build and deploy websites in minutes with our optimized workflow.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors">
        <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">Fully Customizable</h3>
        <p class="text-zinc-400">Customize every aspect of your design with our intuitive editor.</p>
      </div>
      <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 transition-colors">
        <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-white mb-2">One-Click Export</h3>
        <p class="text-zinc-400">Export your projects as clean HTML or publish directly online.</p>
      </div>
    </div>
  </div>
</section>`;

export const FEATURE_GRID_3: UIComponent = {
  id: "feature-grid-3",
  name: "Feature Grid 3 Columns",
  description: "Feature section with 3 columns and icons",
  category: "feature",
  tags: ["feature", "grid", "icons", "cards"],
  charCount: code.length,
  code,
};
