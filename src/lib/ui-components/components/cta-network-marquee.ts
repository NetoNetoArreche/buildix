import { UIComponent } from "../types";

export const CTA_NETWORK_MARQUEE: UIComponent = {
  id: "cta-network-marquee",
  name: "CTA Network Marquee",
  description: "Social proof section with animated image marquee, gradient background effects, and modern CTA button",
  category: "cta",
  tags: ["marquee", "social-proof", "animation", "community", "network"],
  charCount: 8500,
  code: `<section class="relative py-24 sm:py-32 overflow-hidden bg-slate-950">
    <style>
        @keyframes scroll-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
        }
        .animate-scroll-left {
            animation: scroll-left 60s linear infinite;
        }
        .animate-scroll-right {
            animation: scroll-right 70s linear infinite;
        }
        .group:hover .animate-scroll-left,
        .group:hover .animate-scroll-right {
            animation-play-state: paused;
        }
    </style>

    <!-- Background Glow Effects -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none opacity-50 mix-blend-screen"></div>
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none opacity-30"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">

        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 backdrop-blur-sm mb-6 shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-transform hover:scale-105 cursor-default">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span class="text-xs font-semibold text-violet-200 tracking-wide uppercase">Global Network</span>
        </div>

        <!-- Title -->
        <h2 class="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            Join <span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-white to-violet-300">50,000+ pioneers</span><br>
            shaping the future.
        </h2>

        <!-- Subtitle -->
        <p class="mt-4 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Connect with neuroscience researchers, peak performers, and cognitive enhancement enthusiasts pushing the boundaries of human potential.
        </p>

        <!-- CTA Button -->
        <div class="mt-10 flex justify-center gap-4">
            <a href="#" class="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-slate-950 px-8 font-medium text-white transition-all duration-300 hover:bg-slate-950 hover:w-auto hover:px-10 border border-slate-800 hover:border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                <span class="mr-2">Join Neural Network</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:translate-x-1">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                </svg>
                <div class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/20 to-emerald-600/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
            </a>
        </div>
    </div>

    <!-- Marquee Section -->
    <div class="relative w-full space-y-6 group">

        <!-- Gradient Masks -->
        <div class="absolute left-0 top-0 bottom-0 w-24 sm:w-48 z-20 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none"></div>
        <div class="absolute right-0 top-0 bottom-0 w-24 sm:w-48 z-20 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none"></div>

        <!-- Row 1: Scroll Left -->
        <div class="flex overflow-hidden">
            <div class="flex gap-4 animate-scroll-left min-w-full px-2">
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-40 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-64 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-44 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80" alt="Member">

                <!-- Duplicate for seamless loop -->
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-40 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-64 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-44 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80" alt="Member">
            </div>
        </div>

        <!-- Row 2: Scroll Right -->
        <div class="flex overflow-hidden">
            <div class="flex gap-4 animate-scroll-right min-w-full px-2">
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-64 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-40 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1501196354995-cbb51c65ddea?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80" alt="Member">

                <!-- Duplicate -->
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-64 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-40 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-56 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1501196354995-cbb51c65ddea?auto=format&fit=crop&w=400&q=80" alt="Member">
                <img class="h-32 w-48 object-cover rounded-xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:scale-105" src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80" alt="Member">
            </div>
        </div>

    </div>
</section>`,
};
