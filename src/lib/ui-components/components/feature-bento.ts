import { UIComponent } from "../types";

const code = `<section class="py-24 px-6 bg-zinc-950">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Designed for modern teams
      </h2>
      <p class="text-zinc-400 max-w-2xl mx-auto">
        Everything you need to collaborate and build amazing products.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <!-- Large card -->
      <div class="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-zinc-800">
        <div class="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white mb-3">Real-time Collaboration</h3>
        <p class="text-zinc-400 mb-6">Work together with your team in real-time. See changes instantly as they happen.</p>
        <div class="h-32 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-600">
          Preview area
        </div>
      </div>
      <!-- Small card -->
      <div class="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
        <div class="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Secure by Default</h3>
        <p class="text-zinc-400">Enterprise-grade security with end-to-end encryption.</p>
      </div>
      <!-- Small card -->
      <div class="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
        <div class="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-6">
          <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-3">Flexible Layouts</h3>
        <p class="text-zinc-400">Choose from dozens of pre-built layouts or create your own.</p>
      </div>
      <!-- Medium card -->
      <div class="md:col-span-2 p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
        <div class="flex items-start gap-6">
          <div class="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-3">Advanced Analytics</h3>
            <p class="text-zinc-400">Track your performance with detailed analytics and insights. Make data-driven decisions.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;

export const FEATURE_BENTO: UIComponent = {
  id: "feature-bento",
  name: "Feature Bento Grid",
  description: "Modern bento-style feature grid layout",
  category: "feature",
  tags: ["feature", "bento", "grid", "modern"],
  charCount: code.length,
  code,
};
