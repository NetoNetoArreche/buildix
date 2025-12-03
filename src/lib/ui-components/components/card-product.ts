import { UIComponent } from "../types";

const code = `<div class="max-w-sm mx-auto">
  <div class="group rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-violet-500/50 transition-colors">
    <!-- Image Area -->
    <div class="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center text-zinc-600">
        <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
      </div>
      <!-- Badge -->
      <div class="absolute top-4 left-4">
        <span class="px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded-full">New</span>
      </div>
      <!-- Quick Actions -->
      <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <button class="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
      </div>
    </div>
    <!-- Content -->
    <div class="p-5">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs text-zinc-500">Category</span>
      </div>
      <h3 class="text-lg font-semibold text-white mb-2">Product Name</h3>
      <p class="text-zinc-400 text-sm mb-4">Brief product description that explains the key features.</p>
      <div class="flex items-center justify-between">
        <div>
          <span class="text-2xl font-bold text-white">$99</span>
          <span class="text-zinc-500 line-through ml-2">$149</span>
        </div>
        <button class="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</div>`;

export const CARD_PRODUCT: UIComponent = {
  id: "card-product",
  name: "Product Card",
  description: "E-commerce product card with image and actions",
  category: "card",
  tags: ["card", "product", "ecommerce", "shop"],
  charCount: code.length,
  code,
};
