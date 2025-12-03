// Template definitions for Buildix
export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  html: string;
  tags: string[];
  isPremium: boolean;
}

export type TemplateCategory =
  | "landing"
  | "portfolio"
  | "business"
  | "saas"
  | "ecommerce"
  | "blog"
  | "agency"
  | "startup";

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "landing", label: "Landing Pages" },
  { value: "portfolio", label: "Portfolio" },
  { value: "business", label: "Business" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "blog", label: "Blog" },
  { value: "agency", label: "Agency" },
  { value: "startup", label: "Startup" },
];

// Template HTML snippets
const darkHeroTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dark Hero Landing</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-50">
  <header class="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-violet-600 rounded-lg"></div>
        <span class="font-bold text-xl">Brand</span>
      </div>
      <nav class="hidden md:flex items-center gap-8">
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">About</a>
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Contact</a>
      </nav>
      <div class="flex items-center gap-4">
        <button class="text-sm text-zinc-400 hover:text-white transition-colors">Sign In</button>
        <button class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-full transition-colors">Get Started</button>
      </div>
    </div>
  </header>

  <section class="min-h-screen flex flex-col items-center justify-center px-6 pt-24">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-4 py-1.5 rounded-full text-sm mb-8">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
        </svg>
        New Feature Available
      </div>

      <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
        Build Something Amazing Today
      </h1>

      <p class="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        Create stunning websites in minutes with our AI-powered platform. No coding required.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button class="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-full transition-colors">
          Start Building Free
        </button>
        <button class="px-8 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium rounded-full transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Watch Demo
        </button>
      </div>

      <p class="mt-8 text-sm text-zinc-500">No credit card required • Free forever</p>
    </div>
  </section>

  <section class="py-24 px-6 border-t border-zinc-800">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold mb-4">Everything You Need</h2>
        <p class="text-zinc-400 max-w-2xl mx-auto">Our platform provides all the tools you need to create beautiful websites.</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Lightning Fast</h3>
          <p class="text-zinc-400">Generate stunning designs in seconds with our AI-powered platform.</p>
        </div>

        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">Fully Customizable</h3>
          <p class="text-zinc-400">Edit every element with our visual editor or dive into the code.</p>
        </div>

        <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
          <div class="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
            <svg class="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-2">One-Click Export</h3>
          <p class="text-zinc-400">Download clean HTML or publish directly to your subdomain.</p>
        </div>
      </div>
    </div>
  </section>

  <footer class="border-t border-zinc-800 py-12 px-6">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-zinc-500">© 2024 Brand. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Privacy</a>
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Terms</a>
        <a href="#" class="text-sm text-zinc-400 hover:text-white transition-colors">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>`;

const saasTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SaaS Product</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-zinc-900">
  <header class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg"></div>
        <span class="font-bold text-xl">SaaSify</span>
      </div>
      <nav class="hidden md:flex items-center gap-8">
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Product</a>
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Features</a>
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</a>
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Docs</a>
      </nav>
      <div class="flex items-center gap-4">
        <button class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Log In</button>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">Start Free Trial</button>
      </div>
    </div>
  </header>

  <section class="pt-32 pb-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm mb-8">
        <span class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
        Now in Public Beta
      </div>

      <h1 class="text-5xl md:text-6xl font-bold tracking-tight mb-6">
        The platform for modern teams
      </h1>

      <p class="text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
        Streamline your workflow with powerful automation, real-time collaboration, and intelligent insights.
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button class="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          Get Started Free
        </button>
        <button class="w-full sm:w-auto px-8 py-3 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-medium rounded-lg transition-colors">
          Book a Demo
        </button>
      </div>
    </div>
  </section>

  <section class="py-20 px-6 bg-zinc-50">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <p class="text-sm text-zinc-500 uppercase tracking-wide mb-4">Trusted by leading companies</p>
        <div class="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50">
          <div class="text-2xl font-bold text-zinc-400">Stripe</div>
          <div class="text-2xl font-bold text-zinc-400">Notion</div>
          <div class="text-2xl font-bold text-zinc-400">Linear</div>
          <div class="text-2xl font-bold text-zinc-400">Vercel</div>
          <div class="text-2xl font-bold text-zinc-400">Figma</div>
        </div>
      </div>
    </div>
  </section>

  <section class="py-20 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
        <p class="text-zinc-600">Choose the plan that works for you</p>
      </div>

      <div class="grid md:grid-cols-3 gap-8">
        <div class="p-8 rounded-2xl border border-zinc-200">
          <h3 class="text-lg font-semibold mb-2">Starter</h3>
          <p class="text-zinc-600 text-sm mb-6">For individuals and small teams</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">$0</span>
            <span class="text-zinc-500">/month</span>
          </div>
          <button class="w-full py-2 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors">Get Started</button>
          <ul class="mt-6 space-y-3 text-sm text-zinc-600">
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Up to 5 projects</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Basic analytics</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Email support</li>
          </ul>
        </div>

        <div class="p-8 rounded-2xl border-2 border-blue-600 relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">Popular</div>
          <h3 class="text-lg font-semibold mb-2">Pro</h3>
          <p class="text-zinc-600 text-sm mb-6">For growing businesses</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">$29</span>
            <span class="text-zinc-500">/month</span>
          </div>
          <button class="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Start Free Trial</button>
          <ul class="mt-6 space-y-3 text-sm text-zinc-600">
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Unlimited projects</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Advanced analytics</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Priority support</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Team collaboration</li>
          </ul>
        </div>

        <div class="p-8 rounded-2xl border border-zinc-200">
          <h3 class="text-lg font-semibold mb-2">Enterprise</h3>
          <p class="text-zinc-600 text-sm mb-6">For large organizations</p>
          <div class="mb-6">
            <span class="text-4xl font-bold">Custom</span>
          </div>
          <button class="w-full py-2 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors">Contact Sales</button>
          <ul class="mt-6 space-y-3 text-sm text-zinc-600">
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Everything in Pro</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Custom integrations</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> Dedicated support</li>
            <li class="flex items-center gap-2"><span class="text-green-500">✓</span> SLA guarantee</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <footer class="border-t py-12 px-6">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-zinc-500">© 2024 SaaSify. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Privacy</a>
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Terms</a>
        <a href="#" class="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Contact</a>
      </div>
    </div>
  </footer>
</body>
</html>`;

const portfolioTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-zinc-950 text-zinc-50">
  <header class="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md">
    <div class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
      <span class="font-bold text-xl">John Doe</span>
      <nav class="hidden md:flex items-center gap-8">
        <a href="#work" class="text-sm text-zinc-400 hover:text-white transition-colors">Work</a>
        <a href="#about" class="text-sm text-zinc-400 hover:text-white transition-colors">About</a>
        <a href="#contact" class="text-sm text-zinc-400 hover:text-white transition-colors">Contact</a>
      </nav>
    </div>
  </header>

  <section class="min-h-screen flex items-center px-6 pt-24">
    <div class="max-w-6xl mx-auto w-full">
      <p class="text-orange-500 text-sm font-medium mb-4">Designer & Developer</p>
      <h1 class="text-5xl md:text-7xl font-bold leading-tight mb-8">
        I craft digital<br />experiences that<br />
        <span class="text-zinc-500">inspire.</span>
      </h1>
      <p class="text-xl text-zinc-400 max-w-xl mb-12">
        I'm a product designer with 8+ years of experience creating user-centered digital products.
      </p>
      <div class="flex items-center gap-6">
        <a href="#work" class="px-8 py-3 bg-white text-zinc-900 font-medium rounded-full hover:bg-zinc-200 transition-colors">View Work</a>
        <a href="#contact" class="text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
          Get in Touch
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
          </svg>
        </a>
      </div>
    </div>
  </section>

  <section id="work" class="py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold mb-16">Selected Work</h2>

      <div class="grid md:grid-cols-2 gap-8">
        <div class="group cursor-pointer">
          <div class="aspect-[4/3] bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Project Alpha</h3>
          <p class="text-zinc-400">Brand Identity • Web Design</p>
        </div>

        <div class="group cursor-pointer">
          <div class="aspect-[4/3] bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Project Beta</h3>
          <p class="text-zinc-400">Mobile App • UI/UX</p>
        </div>

        <div class="group cursor-pointer">
          <div class="aspect-[4/3] bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Project Gamma</h3>
          <p class="text-zinc-400">Dashboard • Product Design</p>
        </div>

        <div class="group cursor-pointer">
          <div class="aspect-[4/3] bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
            <div class="w-full h-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:scale-105 transition-transform duration-500"></div>
          </div>
          <h3 class="text-xl font-semibold mb-2">Project Delta</h3>
          <p class="text-zinc-400">E-commerce • Web Development</p>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="py-24 px-6 bg-zinc-900">
    <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div class="aspect-square bg-zinc-800 rounded-2xl"></div>
      <div>
        <h2 class="text-3xl font-bold mb-6">About Me</h2>
        <p class="text-zinc-400 mb-6 leading-relaxed">
          I'm a multidisciplinary designer and developer based in San Francisco. I specialize in creating beautiful, functional digital experiences that help businesses grow and connect with their audience.
        </p>
        <p class="text-zinc-400 mb-8 leading-relaxed">
          With over 8 years of experience, I've worked with startups and Fortune 500 companies alike, bringing ideas to life through thoughtful design and clean code.
        </p>
        <div class="flex items-center gap-6">
          <div>
            <p class="text-3xl font-bold">50+</p>
            <p class="text-zinc-400 text-sm">Projects</p>
          </div>
          <div>
            <p class="text-3xl font-bold">8+</p>
            <p class="text-zinc-400 text-sm">Years</p>
          </div>
          <div>
            <p class="text-3xl font-bold">30+</p>
            <p class="text-zinc-400 text-sm">Clients</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="contact" class="py-24 px-6">
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-6">Let's Work Together</h2>
      <p class="text-zinc-400 mb-12">
        Have a project in mind? I'd love to hear about it. Let's create something amazing together.
      </p>
      <a href="mailto:hello@johndoe.com" class="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-full transition-colors">
        Get in Touch
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
        </svg>
      </a>
    </div>
  </section>

  <footer class="border-t border-zinc-800 py-8 px-6">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-zinc-500">© 2024 John Doe. All rights reserved.</p>
      <div class="flex items-center gap-6">
        <a href="#" class="text-zinc-400 hover:text-white transition-colors">Twitter</a>
        <a href="#" class="text-zinc-400 hover:text-white transition-colors">LinkedIn</a>
        <a href="#" class="text-zinc-400 hover:text-white transition-colors">Dribbble</a>
      </div>
    </div>
  </footer>
</body>
</html>`;

export const TEMPLATES: Template[] = [
  {
    id: "dark-hero",
    name: "Dark Hero",
    description: "Modern dark landing page with hero section and features grid",
    category: "landing",
    thumbnail: "/templates/dark-hero.png",
    html: darkHeroTemplate,
    tags: ["dark", "hero", "modern", "startup"],
    isPremium: false,
  },
  {
    id: "saas-product",
    name: "SaaS Product",
    description: "Clean SaaS product page with pricing table",
    category: "saas",
    thumbnail: "/templates/saas-product.png",
    html: saasTemplate,
    tags: ["light", "saas", "pricing", "business"],
    isPremium: false,
  },
  {
    id: "portfolio-minimal",
    name: "Portfolio Minimal",
    description: "Minimalist portfolio for designers and developers",
    category: "portfolio",
    thumbnail: "/templates/portfolio.png",
    html: portfolioTemplate,
    tags: ["dark", "portfolio", "minimal", "creative"],
    isPremium: false,
  },
  {
    id: "startup-launch",
    name: "Startup Launch",
    description: "Coming soon page for product launches",
    category: "startup",
    thumbnail: "/templates/startup.png",
    html: darkHeroTemplate, // Reusing for demo
    tags: ["dark", "startup", "launch", "coming-soon"],
    isPremium: true,
  },
  {
    id: "agency-creative",
    name: "Creative Agency",
    description: "Bold agency website with portfolio showcase",
    category: "agency",
    thumbnail: "/templates/agency.png",
    html: portfolioTemplate, // Reusing for demo
    tags: ["dark", "agency", "creative", "bold"],
    isPremium: true,
  },
  {
    id: "ecommerce-store",
    name: "E-commerce Store",
    description: "Product showcase for online stores",
    category: "ecommerce",
    thumbnail: "/templates/ecommerce.png",
    html: saasTemplate, // Reusing for demo
    tags: ["light", "ecommerce", "store", "products"],
    isPremium: true,
  },
];

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(query: string): Template[] {
  const lowercaseQuery = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
}
