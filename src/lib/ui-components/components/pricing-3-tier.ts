import { UIComponent } from "../types";

const code = `<section class="py-24 px-6 bg-zinc-950">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <span class="inline-block px-4 py-1.5 bg-violet-500/10 text-violet-400 rounded-full text-sm font-medium mb-4">
        Pricing
      </span>
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Simple, transparent pricing
      </h2>
      <p class="text-zinc-400 max-w-2xl mx-auto">
        Choose the plan that works best for you. All plans include a 14-day free trial.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      <!-- Starter -->
      <div class="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 class="text-lg font-semibold text-white mb-2">Starter</h3>
        <p class="text-zinc-400 text-sm mb-6">Perfect for side projects</p>
        <div class="mb-6">
          <span class="text-4xl font-bold text-white">$0</span>
          <span class="text-zinc-400">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Up to 3 projects
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Basic analytics
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Community support
          </li>
        </ul>
        <button class="w-full py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition">
          Get Started
        </button>
      </div>
      <!-- Pro - Featured -->
      <div class="p-8 rounded-2xl bg-gradient-to-b from-violet-600/20 to-transparent border border-violet-500/30 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 text-white text-sm font-medium rounded-full">
          Most Popular
        </div>
        <h3 class="text-lg font-semibold text-white mb-2">Pro</h3>
        <p class="text-zinc-400 text-sm mb-6">For growing businesses</p>
        <div class="mb-6">
          <span class="text-4xl font-bold text-white">$29</span>
          <span class="text-zinc-400">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Unlimited projects
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Advanced analytics
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Priority support
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Custom domain
          </li>
        </ul>
        <button class="w-full py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition">
          Get Started
        </button>
      </div>
      <!-- Enterprise -->
      <div class="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 class="text-lg font-semibold text-white mb-2">Enterprise</h3>
        <p class="text-zinc-400 text-sm mb-6">For large organizations</p>
        <div class="mb-6">
          <span class="text-4xl font-bold text-white">$99</span>
          <span class="text-zinc-400">/month</span>
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Everything in Pro
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            SSO & SAML
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Dedicated support
          </li>
          <li class="flex items-center gap-3 text-zinc-300">
            <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Custom contracts
          </li>
        </ul>
        <button class="w-full py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition">
          Contact Sales
        </button>
      </div>
    </div>
  </div>
</section>`;

export const PRICING_3_TIER: UIComponent = {
  id: "pricing-3-tier",
  name: "Pricing 3-Tier",
  description: "Pricing section with 3 plans and featured option",
  category: "pricing",
  tags: ["pricing", "plans", "tiers", "saas"],
  charCount: code.length,
  code,
};
