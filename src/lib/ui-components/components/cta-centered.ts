import { UIComponent } from "../types";

const code = `<section class="py-24 px-6 bg-zinc-950">
  <div class="max-w-4xl mx-auto">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 p-12 md:p-16 text-center">
      <!-- Background decoration -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div class="absolute bottom-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>
      <!-- Content -->
      <div class="relative z-10">
        <h2 class="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to get started?
        </h2>
        <p class="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
          Join thousands of creators already building amazing websites with our platform.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-white/90 transition shadow-lg">
            Start for Free
          </button>
          <button class="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-full hover:bg-white/20 transition border border-white/20">
            Schedule Demo
          </button>
        </div>
        <p class="text-sm text-white/60 mt-6">
          No credit card required • 14-day free trial
        </p>
      </div>
    </div>
  </div>
</section>`;

export const CTA_CENTERED: UIComponent = {
  id: "cta-centered",
  name: "CTA Centered",
  description: "Centered call-to-action section with gradient background",
  category: "cta",
  tags: ["cta", "centered", "gradient", "buttons"],
  charCount: code.length,
  code,
};
