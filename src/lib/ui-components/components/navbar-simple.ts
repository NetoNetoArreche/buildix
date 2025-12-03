import { UIComponent } from "../types";

const code = `<nav class="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
  <div class="max-w-7xl mx-auto px-6">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="#" class="flex items-center gap-2">
        <div class="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="text-white font-semibold text-lg">Brand</span>
      </a>
      <!-- Navigation Links -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-zinc-400 hover:text-white transition">Features</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">Pricing</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">About</a>
        <a href="#" class="text-zinc-400 hover:text-white transition">Blog</a>
      </div>
      <!-- CTA Buttons -->
      <div class="flex items-center gap-4">
        <a href="#" class="hidden sm:block text-zinc-400 hover:text-white transition">Sign in</a>
        <button class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition">
          Get Started
        </button>
        <!-- Mobile Menu Button -->
        <button class="md:hidden p-2 text-zinc-400 hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</nav>`;

export const NAVBAR_SIMPLE: UIComponent = {
  id: "navbar-simple",
  name: "Navbar Simple",
  description: "Simple navigation bar with logo and links",
  category: "navbar",
  tags: ["navbar", "navigation", "header", "menu"],
  charCount: code.length,
  code,
};
