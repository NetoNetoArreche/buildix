// Static code snippets for seeding the database

export interface StaticCodeSnippet {
  name: string;
  description: string;
  category: "css" | "js" | "html" | "mixed";
  code: string;
  tags: string[];
}

export const staticCodeSnippets: StaticCodeSnippet[] = [
  // CSS Snippets
  {
    name: "Glassmorphism Card",
    description: "Modern glass effect with blur and transparency",
    category: "css",
    code: `.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}`,
    tags: ["glass", "blur", "card", "modern"],
  },
  {
    name: "Gradient Text",
    description: "Apply gradient colors to text",
    category: "css",
    code: `.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`,
    tags: ["gradient", "text", "colorful"],
  },
  {
    name: "Smooth Hover Scale",
    description: "Subtle scale animation on hover",
    category: "css",
    code: `.hover-scale {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}`,
    tags: ["hover", "animation", "scale", "transition"],
  },
  {
    name: "CSS Grid Auto-fit",
    description: "Responsive grid that auto-adjusts columns",
    category: "css",
    code: `.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}`,
    tags: ["grid", "responsive", "layout", "auto-fit"],
  },
  {
    name: "Flexbox Center",
    description: "Perfect centering with flexbox",
    category: "css",
    code: `.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}`,
    tags: ["flexbox", "center", "layout"],
  },
  {
    name: "Custom Scrollbar",
    description: "Styled scrollbar for webkit browsers",
    category: "css",
    code: `.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #1a1a2e;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a4a6a;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #6a6a8a;
}`,
    tags: ["scrollbar", "custom", "webkit"],
  },
  {
    name: "Text Truncate",
    description: "Truncate text with ellipsis",
    category: "css",
    code: `.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}`,
    tags: ["text", "truncate", "ellipsis", "clamp"],
  },
  {
    name: "Pulse Animation",
    description: "Pulsating animation effect",
    category: "css",
    code: `@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}`,
    tags: ["animation", "pulse", "keyframes"],
  },
  {
    name: "Skeleton Loading",
    description: "Shimmer effect for loading states",
    category: "css",
    code: `.skeleton {
  background: linear-gradient(
    90deg,
    #1a1a2e 0%,
    #2a2a4e 50%,
    #1a1a2e 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}`,
    tags: ["skeleton", "loading", "shimmer", "animation"],
  },
  {
    name: "Neon Glow Effect",
    description: "Neon text with glow shadow",
    category: "css",
    code: `.neon-glow {
  color: #fff;
  text-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #0ff,
    0 0 30px #0ff,
    0 0 40px #0ff;
}

.neon-box {
  box-shadow:
    0 0 5px #0ff,
    0 0 10px #0ff,
    0 0 20px #0ff,
    inset 0 0 5px #0ff;
  border: 2px solid #0ff;
}`,
    tags: ["neon", "glow", "shadow", "effect"],
  },

  // JavaScript Snippets
  {
    name: "Debounce Function",
    description: "Delay function execution until after wait time",
    category: "js",
    code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage:
// const debouncedSearch = debounce((query) => search(query), 300);`,
    tags: ["debounce", "performance", "utility"],
  },
  {
    name: "Throttle Function",
    description: "Limit function execution rate",
    category: "js",
    code: `function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage:
// const throttledScroll = throttle(handleScroll, 100);`,
    tags: ["throttle", "performance", "utility"],
  },
  {
    name: "Copy to Clipboard",
    description: "Copy text to clipboard with fallback",
    category: "js",
    code: `async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}`,
    tags: ["clipboard", "copy", "utility"],
  },
  {
    name: "Local Storage Helper",
    description: "Safe localStorage get/set with JSON support",
    category: "js",
    code: `const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};`,
    tags: ["localStorage", "storage", "utility"],
  },
  {
    name: "Format Date",
    description: "Format date to readable string",
    category: "js",
    code: `function formatDate(date, locale = 'en-US') {
  const d = new Date(date);

  return {
    full: d.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    short: d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    relative: getRelativeTime(d)
  };
}

function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return \`\${days} day\${days > 1 ? 's' : ''} ago\`;
  if (hours > 0) return \`\${hours} hour\${hours > 1 ? 's' : ''} ago\`;
  if (minutes > 0) return \`\${minutes} minute\${minutes > 1 ? 's' : ''} ago\`;
  return 'Just now';
}`,
    tags: ["date", "format", "utility", "time"],
  },
  {
    name: "Smooth Scroll",
    description: "Smooth scroll to element",
    category: "js",
    code: `function smoothScrollTo(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: 'smooth'
  });
}

// Usage with offset for fixed header:
// smoothScrollTo('section-id', 80);`,
    tags: ["scroll", "smooth", "navigation"],
  },
  {
    name: "Generate UUID",
    description: "Generate unique identifier",
    category: "js",
    code: `function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Or using crypto API (more secure):
function cryptoUUID() {
  return crypto.randomUUID();
}`,
    tags: ["uuid", "id", "unique", "utility"],
  },
  {
    name: "Intersection Observer",
    description: "Detect when element enters viewport",
    category: "js",
    code: `function onVisible(element, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        if (options.once) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, {
    threshold: options.threshold || 0.1,
    rootMargin: options.rootMargin || '0px'
  });

  observer.observe(element);
  return observer;
}

// Usage:
// onVisible(element, (el) => el.classList.add('visible'), { once: true });`,
    tags: ["intersection", "observer", "viewport", "animation"],
  },

  // HTML Snippets
  {
    name: "Responsive Image",
    description: "Picture element with multiple sources",
    category: "html",
    code: `<picture>
  <source
    media="(min-width: 1024px)"
    srcset="image-large.webp"
    type="image/webp"
  >
  <source
    media="(min-width: 768px)"
    srcset="image-medium.webp"
    type="image/webp"
  >
  <source
    srcset="image-small.webp"
    type="image/webp"
  >
  <img
    src="image-fallback.jpg"
    alt="Description"
    loading="lazy"
    decoding="async"
    class="w-full h-auto"
  >
</picture>`,
    tags: ["image", "responsive", "webp", "picture"],
  },
  {
    name: "SEO Meta Tags",
    description: "Essential meta tags for SEO",
    category: "html",
    code: `<!-- Primary Meta Tags -->
<title>Page Title - Site Name</title>
<meta name="title" content="Page Title - Site Name">
<meta name="description" content="Brief description of the page content (150-160 characters)">
<meta name="keywords" content="keyword1, keyword2, keyword3">
<meta name="author" content="Author Name">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://example.com/page">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Brief description">
<meta property="og:image" content="https://example.com/og-image.jpg">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://example.com/page">
<meta property="twitter:title" content="Page Title">
<meta property="twitter:description" content="Brief description">
<meta property="twitter:image" content="https://example.com/twitter-image.jpg">`,
    tags: ["seo", "meta", "opengraph", "twitter"],
  },
  {
    name: "Accessible Button",
    description: "Button with proper accessibility attributes",
    category: "html",
    code: `<button
  type="button"
  class="btn-primary"
  aria-label="Descriptive action label"
  aria-pressed="false"
  aria-expanded="false"
  aria-controls="target-element-id"
>
  <span class="btn-icon" aria-hidden="true">
    <!-- Icon SVG here -->
  </span>
  <span class="btn-text">Button Text</span>
</button>`,
    tags: ["button", "accessibility", "a11y", "aria"],
  },
  {
    name: "Video with Poster",
    description: "HTML5 video element with controls",
    category: "html",
    code: `<video
  class="w-full rounded-lg"
  poster="video-thumbnail.jpg"
  controls
  preload="metadata"
  playsinline
>
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
  <track
    kind="captions"
    src="captions.vtt"
    srclang="en"
    label="English"
    default
  >
  Your browser does not support the video tag.
</video>`,
    tags: ["video", "media", "responsive", "accessibility"],
  },

  // Mixed Snippets
  {
    name: "Dark Mode Toggle",
    description: "Complete dark mode implementation",
    category: "mixed",
    code: `<!-- HTML -->
<button id="theme-toggle" aria-label="Toggle dark mode">
  <svg class="sun-icon" viewBox="0 0 24 24">...</svg>
  <svg class="moon-icon" viewBox="0 0 24 24">...</svg>
</button>

/* CSS */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a2e;
}

[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --text-primary: #ffffff;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* JavaScript */
const toggle = document.getElementById('theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// Initialize
const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme ? savedTheme === 'dark' : prefersDark.matches);

toggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(!isDark);
});`,
    tags: ["dark-mode", "theme", "toggle", "css-variables"],
  },
  {
    name: "Modal Component",
    description: "Accessible modal dialog",
    category: "mixed",
    code: `<!-- HTML -->
<dialog id="modal" class="modal" aria-labelledby="modal-title">
  <div class="modal-content">
    <header class="modal-header">
      <h2 id="modal-title">Modal Title</h2>
      <button class="modal-close" aria-label="Close modal">&times;</button>
    </header>
    <div class="modal-body">
      <!-- Content here -->
    </div>
    <footer class="modal-footer">
      <button class="btn-secondary" data-close>Cancel</button>
      <button class="btn-primary">Confirm</button>
    </footer>
  </div>
</dialog>

/* CSS */
.modal {
  border: none;
  border-radius: 12px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  padding: 24px;
}

/* JavaScript */
const modal = document.getElementById('modal');
const openBtn = document.querySelector('[data-modal="open"]');
const closeBtns = modal.querySelectorAll('[data-close], .modal-close');

openBtn.addEventListener('click', () => modal.showModal());
closeBtns.forEach(btn => {
  btn.addEventListener('click', () => modal.close());
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});`,
    tags: ["modal", "dialog", "popup", "accessibility"],
  },
  {
    name: "Toast Notification",
    description: "Toast notification system",
    category: "mixed",
    code: `<!-- HTML -->
<div id="toast-container" class="toast-container"></div>

/* CSS */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 9999;
}

.toast {
  padding: 16px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast.success { background: #10b981; }
.toast.error { background: #ef4444; }
.toast.warning { background: #f59e0b; }
.toast.info { background: #3b82f6; }

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; }
}

/* JavaScript */
function toast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = \`toast \${type}\`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

// Usage:
// toast('Success!', 'success');
// toast('Error occurred', 'error');`,
    tags: ["toast", "notification", "alert", "feedback"],
  },
  {
    name: "Infinite Scroll",
    description: "Load more content on scroll",
    category: "mixed",
    code: `<!-- HTML -->
<div id="content-container">
  <!-- Items will be loaded here -->
</div>
<div id="loading-indicator" class="hidden">
  <div class="spinner"></div>
</div>

/* CSS */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hidden { display: none; }

/* JavaScript */
let page = 1;
let loading = false;
let hasMore = true;

const container = document.getElementById('content-container');
const indicator = document.getElementById('loading-indicator');

async function loadMore() {
  if (loading || !hasMore) return;

  loading = true;
  indicator.classList.remove('hidden');

  try {
    const response = await fetch(\`/api/items?page=\${page}\`);
    const data = await response.json();

    data.items.forEach(item => {
      container.innerHTML += \`<div class="item">\${item.content}</div>\`;
    });

    hasMore = data.hasMore;
    page++;
  } finally {
    loading = false;
    indicator.classList.add('hidden');
  }
}

// Intersection Observer approach
const sentinel = document.createElement('div');
container.after(sentinel);

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) loadMore();
}, { rootMargin: '100px' });

observer.observe(sentinel);`,
    tags: ["infinite-scroll", "pagination", "lazy-load"],
  },
];
