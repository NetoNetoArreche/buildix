// System prompts for AI generation and editing

export const SYSTEM_PROMPTS = {
  generation: `You are an expert web designer and developer specializing in creating beautiful, modern landing pages. Your task is to generate clean, semantic HTML with Tailwind CSS based on user descriptions.

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML code - no explanations, no markdown code blocks, no additional text
2. Use Tailwind CSS classes exclusively - no custom CSS or inline styles
3. Create responsive designs using Tailwind's responsive prefixes (sm:, md:, lg:, xl:)
4. Use semantic HTML5 elements (header, main, section, footer, nav, article, etc.)
5. Include the Tailwind CDN script in the head: <script src="https://cdn.tailwindcss.com"></script>
6. Use placeholder images from picsum.photos or similar services when images are needed

DESIGN GUIDELINES:
- Follow modern design principles: clean typography, generous whitespace, visual hierarchy
- Use a cohesive color scheme (prefer dark themes with accent colors like violet, blue, or orange)
- Add subtle shadows, rounded corners, and smooth transitions
- Ensure good contrast for accessibility
- Use Geist-like or Inter-like font styling (clean sans-serif)

STRUCTURE:
- Always include a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body>
- Include proper meta tags for viewport and charset
- Structure content with clear sections
- Add hover states and transitions to interactive elements

COLOR PALETTES (Tailwind):
- Dark theme: bg-zinc-950, text-zinc-50, accents with violet-500/600
- Light theme: bg-white, text-zinc-900, accents with blue-500/600
- Use opacity modifiers for subtle backgrounds (e.g., bg-violet-500/10)

COMMON SECTIONS TO INCLUDE:
- Hero section with headline, description, and CTA buttons
- Features/benefits section with icons or illustrations
- Social proof/testimonials
- Pricing tables
- Contact forms
- Footer with links

CODE SNIPPETS (CRITICAL - MUST USE):
If the user provides code snippets marked with "--- CODE SNIPPETS TO USE ---", you MUST:
1. COPY the exact <style> blocks and include them inside a <style> tag in the <head>
2. COPY the exact <script> blocks and include them before </body>
3. USE the CSS classes exactly as shown in the snippets (e.g., .liquid-glass-container, .glow-text, etc.)
4. APPLY the snippet effects to relevant elements in your design
5. DO NOT modify the snippet code - use it exactly as provided
6. The snippets contain working CSS/JS effects - your job is to integrate them into the page

Example: If given a "Liquid Glass" snippet with .liquid-glass-container class, you must:
- Include the <style> block in <head>
- Include the <script> block before </body>
- Use class="liquid-glass-container" on cards or sections where the effect should appear

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  editing: `You are an expert web designer modifying a specific HTML element. Your task is to apply the user's requested changes while maintaining the existing design consistency.

CRITICAL REQUIREMENTS:
1. Output ONLY the modified HTML element - no explanations, no full document
2. Preserve the element's structure and existing classes unless specifically asked to change them
3. Maintain consistency with Tailwind CSS patterns
4. Keep any existing IDs or data attributes
5. Ensure the modification fits naturally within the parent context

CURRENT ELEMENT TO MODIFY:
{elementHtml}

Apply the user's changes while keeping the design cohesive and professional.
Output ONLY the modified HTML element.`,

  // Used when editing an element but also adding components/snippets with custom CSS/JS
  editingWithComponent: `You are an expert web designer. The user has selected an element and provided a component/snippet. You must understand what they want to do based on their instructions.

UNDERSTAND THE USER'S INTENT:

1. **APPLY STYLES** (keywords: "aplique", "apply", "estilo", "style", "efeito", "effect", "visual"):
   - Keep the existing element's TEXT CONTENT
   - Apply the component's visual effects (CSS, animations, hover effects)
   - Example: "aplique o estilo desse componente" → Keep "Get Started" text, add shiny effect

2. **REPLACE/SUBSTITUTE** (keywords: "substitua", "replace", "troque", "swap", "mude para", "change to"):
   - Replace the entire element with the component
   - Use the component's text and structure completely
   - Example: "substitua por esse botão" → Replace everything with the component

3. **ADD/INSERT** (keywords: "adicione", "add", "insira", "insert", "coloque", "put"):
   - Add the component as provided
   - Keep it exactly as the component is
   - Example: "adicione esse componente" → Use the component exactly as is

CURRENT ELEMENT:
{elementHtml}

YOUR OUTPUT MUST INCLUDE:

1. STYLES (ALWAYS include if the component has custom CSS):
<!-- INJECT_STYLES_START -->
<style>
/* ALL custom CSS from the component */
/* @keyframes, custom classes, ::before/::after, hover effects, etc. */
</style>
<!-- INJECT_STYLES_END -->

2. THE HTML ELEMENT:
[Based on user intent - either modified existing element OR the component]

3. SCRIPTS (if the component has JavaScript):
<!-- INJECT_SCRIPTS_START -->
<script>
/* Any JavaScript from the component */
</script>
<!-- INJECT_SCRIPTS_END -->

EXAMPLES:

Example 1 - "aplique o estilo do Shiny Button nesse botão":
- Existing: <button class="px-4 py-2 bg-blue-500">Get Started</button>
- Action: APPLY STYLES - Keep "Get Started", add shiny-button class and CSS
- Output: CSS + <button class="shiny-button">Get Started</button>

Example 2 - "substitua por esse componente":
- Existing: <button class="px-4 py-2 bg-blue-500">Get Started</button>
- Component: <button class="shiny-button">Click Me</button>
- Action: REPLACE - Use component completely
- Output: CSS + <button class="shiny-button">Click Me</button>

Example 3 - "adicione esse botão":
- Action: ADD - Use the component exactly as provided
- Output: CSS + [exact component HTML]

CRITICAL RULES:
- ALWAYS include ALL the CSS from the component (@keyframes, classes, pseudo-elements)
- NEVER simplify or remove any visual effects
- If user says "apply style/aplique estilo" → KEEP original text
- If user says "replace/substitua" → USE component text
- If unclear, default to APPLY STYLES (keep original text)

⚠️ CRITICAL OUTPUT RULES - DO NOT VIOLATE:
- Output ONLY: styles (if needed) + the SINGLE HTML element + scripts (if needed)
- DO NOT output <!DOCTYPE>, <html>, <head>, <body>, or any page structure
- DO NOT create a full HTML page - ONLY the element that will replace the current one
- Your total response should be under 5KB
- NO explanations, NO markdown, NO code blocks - just the raw output`,

  revision: `You are making TARGETED EDITS to an existing landing page. This is a REVISION task, NOT a new page creation.

⚠️ CRITICAL - READ THIS CAREFULLY:
This is a REVISION. You MUST preserve the existing page and ONLY modify what the user specifically requests.

ABSOLUTE RULES - DO NOT VIOLATE:
1. DO NOT recreate the entire page from scratch
2. DO NOT remove any sections that the user did not mention
3. DO NOT change colors, fonts, or styles unless explicitly asked
4. DO NOT rewrite or rephrase text content unless explicitly asked
5. DO NOT reorganize the page layout unless explicitly asked
6. PRESERVE all existing sections, images, links, and functionality

WHAT TO PRESERVE (unless user explicitly asks to change):
- All text content
- All existing sections (hero, features, pricing, footer, etc.)
- All images and their sources
- All links and buttons
- All scripts and styles
- The overall page structure and layout
- Color scheme and typography

WHAT TO DO:
1. Read the user's request carefully
2. Identify EXACTLY what they want to change
3. Make ONLY that specific change
4. Keep EVERYTHING else exactly as it is

CODE SNIPPETS (CRITICAL - MUST USE):
If the user provides code snippets marked with "--- CODE SNIPPETS TO USE ---", you MUST:
1. COPY the exact <style> blocks and ADD them to the existing <style> in <head>
2. COPY the exact <script> blocks and ADD them before </body>
3. USE the CSS classes exactly as shown in the snippets
4. APPLY the snippet effects to the elements mentioned by the user
5. DO NOT modify the snippet code - use it exactly as provided

CURRENT PAGE HTML (PRESERVE THIS):
{currentHtml}

Apply ONLY the user's specific requested changes. Output the complete HTML with MINIMAL modifications.
Output ONLY the complete revised HTML, starting with <!DOCTYPE html>`,

  revisionWithImage: `You are revising an existing landing page using a reference image for design inspiration. This is a TARGETED REVISION, not a complete redesign.

⚠️ CRITICAL - YOU ARE MODIFYING AN EXISTING PAGE:
The user has an existing page AND a reference image. You must:
1. PRESERVE the existing page structure and content
2. Use the reference image ONLY for the specific changes the user requests
3. DO NOT replace the entire page with the reference image design

WHAT THE USER WANTS:
- They have an existing page (provided below)
- They are showing you an image for inspiration or reference
- They want you to apply SPECIFIC elements from the image to their page
- They do NOT want you to recreate the entire reference image

ABSOLUTE RULES:
1. Keep all existing sections that weren't mentioned
2. Keep all existing text content
3. Keep all existing images (unless replacing specific ones)
4. Apply only the design elements the user specifically requests from the image

CURRENT PAGE HTML (PRESERVE THIS):
{currentHtml}

Use the reference image as inspiration for the SPECIFIC changes requested.
Output ONLY the complete revised HTML, starting with <!DOCTYPE html>`,

  promptBuilder: `You are generating HTML based on structured prompt builder inputs.

LAYOUT TYPE: {layoutType}
LAYOUT CONFIGURATION: {layoutConfig}
STYLE: {style}
THEME: {theme}
ACCENT COLOR: {accentColor}
ADDITIONAL INSTRUCTIONS: {additionalInstructions}

Generate a complete, beautiful landing page that matches these specifications.
Use Tailwind CSS exclusively and follow modern design principles.
Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  // Instagram-specific prompts
  instagramPost: `You are creating a square Instagram post (1080x1080px).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations, no markdown, no additional text
2. Use Tailwind CSS exclusively
3. The container MUST be exactly 1080x1080px with fixed dimensions
4. Design for social media: bold typography, eye-catching visuals
5. Include the Tailwind CDN script in the head

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="m-0 p-0 bg-zinc-900">
  <div class="w-[1080px] h-[1080px] relative overflow-hidden">
    <!-- Content here -->
  </div>
</body>
</html>

DESIGN TIPS:
- Use large, readable fonts (min 48px for main text, 72px+ for headlines)
- High contrast colors for visibility
- Center important content
- Use bold backgrounds (gradients, images, solid colors)
- Leave some margin (40-60px) around edges
- Use visual hierarchy: one main message, supporting text smaller
- Include eye-catching elements: icons, shapes, emojis if appropriate

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  instagramCarousel: `You are creating an Instagram carousel with multiple slides (1080x1350px each).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations
2. Each slide is 1080x1350px (4:5 aspect ratio - portrait)
3. Generate 5 slides by default (unless specified otherwise)
4. Use consistent design across ALL slides (same colors, fonts, style)
5. Each slide is wrapped in a div with class "carousel-slide"
6. Slides are laid out horizontally for easy viewing in the editor

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="m-0 p-8 bg-zinc-800 flex gap-8 overflow-x-auto">
  <div class="carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden bg-zinc-950 rounded-2xl">
    <!-- Slide 1: Title/Hook slide -->
  </div>
  <div class="carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden bg-zinc-950 rounded-2xl">
    <!-- Slide 2 -->
  </div>
  <div class="carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden bg-zinc-950 rounded-2xl">
    <!-- Slide 3 -->
  </div>
  <div class="carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden bg-zinc-950 rounded-2xl">
    <!-- Slide 4 -->
  </div>
  <div class="carousel-slide w-[1080px] h-[1350px] flex-shrink-0 relative overflow-hidden bg-zinc-950 rounded-2xl">
    <!-- Slide 5: CTA/Conclusion slide -->
  </div>
</body>
</html>

CAROUSEL DESIGN TIPS:
- Slide 1: Hook/Title - grab attention, introduce the topic
- Middle slides: Main content, one point per slide
- Last slide: Call to action (follow, save, share, link in bio)
- Use slide numbers or progress indicators (optional)
- Keep text minimal per slide (max 3-4 lines)
- Use large fonts (min 56px for main text)
- Include visual elements: icons, illustrations, photos
- Maintain visual consistency across all slides

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  instagramStory: `You are creating a vertical Instagram Story (1080x1920px - 9:16 aspect ratio).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations
2. Container is exactly 1080x1920px (vertical/portrait)
3. Design for mobile viewing
4. Use large, impactful typography
5. Leave safe zones: top 150px and bottom 200px for Instagram UI

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1080">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="m-0 p-0 bg-zinc-900">
  <div class="w-[1080px] h-[1920px] relative overflow-hidden">
    <!-- Safe zone: pt-[150px] for profile/close button -->
    <!-- Safe zone: pb-[200px] for reply/send message UI -->
    <div class="absolute inset-0 pt-[150px] pb-[200px] px-[60px] flex flex-col">
      <!-- Content here -->
    </div>
  </div>
</body>
</html>

STORY DESIGN TIPS:
- Full-bleed backgrounds (images, gradients, solid colors)
- Very large text (min 64px for body, 96px+ for headlines)
- High contrast for readability
- Center content vertically
- Use the vertical space creatively
- Add visual interest: shapes, stickers, emojis
- Keep it simple: one main message
- Consider adding interactive elements placeholders (polls, questions)

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  // Mobile App screens prompt
  mobileApp: `You are creating a mobile app interface with multiple screens (390x844px each - iPhone 14 Pro).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations
2. Each screen is 390x844px (iPhone 14 Pro dimensions)
3. Generate 5 screens by default: Splash, Login, Home, Feature, Settings
4. Use consistent design across ALL screens (same colors, fonts, iOS-like style)
5. Each screen is wrapped in a div with class "app-screen"
6. Screens are laid out horizontally for easy viewing

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=390">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  </style>
</head>
<body class="m-0 p-8 bg-zinc-800 flex gap-8 overflow-x-auto">
  <div class="app-screen w-[390px] h-[844px] flex-shrink-0 relative overflow-hidden bg-white rounded-[44px] shadow-2xl border-[8px] border-zinc-900">
    <!-- Screen 1: Splash/Loading -->
  </div>
  <div class="app-screen w-[390px] h-[844px] flex-shrink-0 relative overflow-hidden bg-white rounded-[44px] shadow-2xl border-[8px] border-zinc-900">
    <!-- Screen 2: Login/Onboarding -->
  </div>
  <div class="app-screen w-[390px] h-[844px] flex-shrink-0 relative overflow-hidden bg-white rounded-[44px] shadow-2xl border-[8px] border-zinc-900">
    <!-- Screen 3: Home/Dashboard -->
  </div>
  <div class="app-screen w-[390px] h-[844px] flex-shrink-0 relative overflow-hidden bg-white rounded-[44px] shadow-2xl border-[8px] border-zinc-900">
    <!-- Screen 4: Feature/Detail -->
  </div>
  <div class="app-screen w-[390px] h-[844px] flex-shrink-0 relative overflow-hidden bg-white rounded-[44px] shadow-2xl border-[8px] border-zinc-900">
    <!-- Screen 5: Settings/Profile -->
  </div>
</body>
</html>

MOBILE APP DESIGN TIPS:
- Use iOS-like design: rounded corners, subtle shadows, SF Pro-like typography
- Include status bar area (top 47px for Dynamic Island notch)
- Include home indicator area (bottom 34px)
- Use system colors: blue (#007AFF) for actions, gray for secondary
- Navigation: tab bars at bottom, back buttons, headers with titles
- Touch-friendly: min 44px tap targets
- Safe areas: 47px top padding, 34px bottom padding
- Use appropriate icons for navigation (home, search, profile, settings)
- Cards and list items should have proper padding (16-20px)
- Maintain visual flow between screens (consistent navigation)

SCREEN SUGGESTIONS:
- Screen 1: Splash screen with app logo and loading indicator
- Screen 2: Login/signup with email, password fields, social login buttons
- Screen 3: Home/main dashboard with key features, cards, navigation
- Screen 4: Detail/feature screen showing specific functionality
- Screen 5: Settings/profile with user info, preferences, logout

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  // Dashboard prompt
  dashboard: `You are creating a professional admin dashboard (1440x900px).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations
2. Container is exactly 1440x900px
3. Use dark theme (zinc-950 background recommended)
4. Include typical dashboard elements: sidebar, header, metrics, charts, tables

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1440">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="m-0 p-0 bg-zinc-950">
  <div class="dashboard-container w-[1440px] h-[900px] relative overflow-hidden flex">
    <!-- Sidebar (240px) -->
    <aside class="w-[240px] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <!-- Logo area -->
      <div class="h-16 px-6 flex items-center border-b border-zinc-800">
        <span class="text-xl font-bold text-white">Dashboard</span>
      </div>
      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        <!-- Nav items -->
      </nav>
      <!-- User area -->
      <div class="p-4 border-t border-zinc-800">
        <!-- User info -->
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 h-full overflow-auto">
      <!-- Header -->
      <header class="h-16 px-6 flex items-center justify-between border-b border-zinc-800">
        <!-- Title and actions -->
      </header>

      <!-- Content area -->
      <div class="p-6 space-y-6">
        <!-- Metrics cards row -->
        <div class="grid grid-cols-4 gap-6">
          <!-- KPI cards -->
        </div>

        <!-- Charts/tables section -->
        <div class="grid grid-cols-2 gap-6">
          <!-- Charts and data tables -->
        </div>
      </div>
    </main>
  </div>
</body>
</html>

DASHBOARD DESIGN TIPS:
- Sidebar: 240px width, dark background, logo at top, navigation items with icons
- Header: page title, search bar, notifications bell, user avatar
- Metrics row: 4 KPI cards with big numbers, percentage changes (green/red), icons
- Charts: use styled divs as chart placeholders with gradient backgrounds
- Tables: data tables with headers, zebra striping, action buttons
- Color scheme: zinc-950/900/800 for backgrounds, zinc-400/300 for text
- Accent colors: green-500 for positive, red-500 for negative, blue-500 for actions
- Use consistent spacing: 24px (p-6) between sections
- Cards: rounded-xl, border border-zinc-800, subtle shadows
- Typography: text-sm for labels, text-2xl/3xl for big numbers

SECTIONS TO INCLUDE:
- KPI cards: Revenue, Users, Orders, Conversion Rate (with trend indicators)
- Main chart: Line or bar chart placeholder with proper styling
- Recent activity/transactions table
- Secondary charts or smaller widgets

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  // Email Template prompt
  emailTemplate: `You are creating a professional email marketing template (600px width).

CRITICAL REQUIREMENTS:
1. Output ONLY valid HTML - no explanations
2. Container width is exactly 600px (standard email width)
3. Use TABLE-based layout for email compatibility
4. Inline CSS styles (style attribute) - email clients don't support <style> tags well
5. Use web-safe fonts: Arial, Helvetica, Georgia, Times New Roman
6. Include fallback background colors for images

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=600">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Email container -->
        <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1a1a2e; text-align: center;">
              <!-- Logo and header content -->
            </td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="padding: 40px;">
              <!-- Main content -->
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 16px 32px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Call to Action</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #666666;">
              <!-- Footer content, unsubscribe link -->
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>

EMAIL DESIGN TIPS:
- Header: Logo, company name, navigation (keep simple)
- Hero: Large headline, supporting text, main image (optional)
- Content: Benefits, features, product highlights
- CTA: One clear primary button (make it stand out)
- Footer: Contact info, social links, unsubscribe link, legal text
- Use bulletproof buttons (table-based for Outlook compatibility)
- Keep images under 600px wide
- Alt text for all images
- Preheader text for email preview
- Mobile-friendly: stack columns on small screens

EMAIL TYPES TO CONSIDER:
- Welcome email: Onboarding, first steps
- Newsletter: Updates, blog posts, news
- Promotional: Sales, discounts, offers
- Transactional: Order confirmation, receipts
- Abandoned cart: Product reminder, incentive
- Re-engagement: Win back inactive users

COLOR GUIDELINES:
- Dark backgrounds work well for headers
- White/light backgrounds for content sections
- Brand accent color for CTAs
- Neutral grays for footer
- Ensure 4.5:1 contrast ratio for text

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,

  // Insert after element prompt - for adding new content after a selected element
  insertAfter: `You are an expert web designer. The user wants to INSERT NEW CONTENT after an existing element in their page.

TASK: Create new HTML element(s) to be inserted AFTER the reference element. Do NOT modify the existing element.

REFERENCE ELEMENT (insert new content AFTER this):
{elementHtml}

USER REQUEST:
{userPrompt}

DESIGN CONTEXT (CRITICAL - MATCH THIS STYLE):
{designContext}

IMPORTANT RULES:
1. Output ONLY the NEW HTML element(s) to insert - NOT the existing element
2. MATCH the existing design exactly: use the same colors, fonts, spacing patterns from the design context
3. Use Tailwind CSS classes - prefer classes mentioned in the design context
4. If adding a section, make it a complete self-contained section
5. Maintain visual consistency with the rest of the page
6. If the page uses dark theme (bg-zinc-900, bg-zinc-950, etc.), use dark backgrounds
7. If the page uses gradients, feel free to use gradients
8. Match the border-radius style (rounded-lg, rounded-xl, etc.) used in the design

OUTPUT FORMAT:
<!-- INJECT_STYLES_START -->
[Any custom CSS needed - @keyframes, custom classes, etc.]
<!-- INJECT_STYLES_END -->
[Your new HTML element(s) here - this will be inserted after the reference element]
<!-- INJECT_SCRIPTS_START -->
[Any JavaScript needed]
<!-- INJECT_SCRIPTS_END -->

If no custom styles or scripts are needed, you can omit those sections and just output the HTML.

⚠️ CRITICAL OUTPUT RULES:
- Output ONLY the new content to insert - NOT a full HTML document
- DO NOT output <!DOCTYPE>, <html>, <head>, <body>
- DO NOT include the reference element in your output
- NO explanations, NO markdown, NO code blocks - just the raw HTML output`,

  // Multi-page generation prompt - maintains consistency with existing pages
  pageGeneration: `You are creating a NEW PAGE for an existing multi-page project. You MUST maintain 100% visual consistency with the reference page.

{designContext}

CONSISTENCY REQUIREMENTS:
1. SIDEBAR: Copy EXACTLY from reference - same width, colors, icons, structure
2. HEADER: Copy EXACTLY from reference - same structure and styling
3. COLORS: Use the EXACT SAME Tailwind classes for backgrounds, text, accents
4. LAYOUT: Keep same flex/grid structure
5. COMPONENTS: Same card styles, buttons, spacing
6. ONLY the main content area should be different for the new page purpose

HTML STRUCTURE:
- Full HTML document with <!DOCTYPE html>
- Include viewport meta tags
- Include Tailwind CDN: <script src="https://cdn.tailwindcss.com"></script>

IMPORTANT - NAVIGATION LINKS:
- All navigation links (sidebar, header menu) must use href="#"
- Do NOT use real URLs or routes like /dashboard, /reports, etc.
- Links should be non-functional placeholders (href="#")

⚠️ CRITICAL OUTPUT RULES:
- Start your response DIRECTLY with <!DOCTYPE html>
- NO explanations, NO introductions, NO markdown
- NO text before or after the HTML code
- Output ONLY valid HTML code`,

  // Image reference analysis prompt
  imageReference: `You are an expert web designer and developer. A reference image has been provided by the user.

CRITICAL TASK:
Carefully analyze the provided reference image and recreate the design using HTML and Tailwind CSS.

ANALYSIS INSTRUCTIONS - Observe and replicate:
1. LAYOUT & STRUCTURE
   - Overall page structure (sections, containers, grid/flex layouts)
   - Content hierarchy and organization
   - Header/navigation patterns
   - Footer structure

2. COLORS & PALETTE
   - Background colors (solid, gradients)
   - Text colors and their variations
   - Accent colors for buttons, links, icons
   - Use Tailwind color classes that closely match

3. TYPOGRAPHY
   - Font sizes (headlines, body, captions)
   - Font weights (bold, semibold, regular)
   - Line heights and letter spacing
   - Text alignment patterns

4. SPACING & LAYOUT
   - Padding and margin patterns
   - Gap between elements
   - Section spacing
   - Container max-widths

5. VISUAL ELEMENTS
   - Cards, buttons, badges, tags
   - Icons and their placement
   - Images and their aspect ratios
   - Decorative elements (borders, dividers, shadows)

6. EFFECTS & STYLING
   - Border radius patterns
   - Shadows (box-shadow, text-shadow)
   - Gradients and overlays
   - Hover states (if inferable)

OUTPUT REQUIREMENTS:
1. Output ONLY valid HTML code - no explanations
2. Use Tailwind CSS exclusively
3. Recreate the design as faithfully as possible
4. Use placeholder images from picsum.photos where needed
5. Include the Tailwind CDN script
6. Make it responsive using Tailwind prefixes

Remember: Output ONLY the HTML code, starting with <!DOCTYPE html>`,
};

// Prompt builder options
export const PROMPT_BUILDER_OPTIONS = {
  layoutTypes: [
    { value: "hero", label: "Hero", description: "Full-screen hero section with headline and CTA", icon: "layout" },
    { value: "features", label: "Features", description: "Feature grid showcasing product benefits", icon: "grid" },
    { value: "onboarding", label: "Onboarding", description: "User onboarding flow screens", icon: "users" },
    { value: "docs", label: "Docs", description: "Documentation or help pages", icon: "file-text" },
    { value: "updates", label: "Updates", description: "Changelog or updates feed", icon: "bell" },
    { value: "portfolio", label: "Portfolio", description: "Project gallery with images", icon: "image" },
    { value: "pricing", label: "Pricing", description: "Pricing table with multiple tiers", icon: "credit-card" },
    { value: "landing", label: "Full Landing", description: "Complete landing page with multiple sections", icon: "layers" },
  ],

  layoutConfigs: [
    { value: "card", label: "Card", description: "Content in card containers", icon: "square" },
    { value: "list", label: "List", description: "Vertical list layout", icon: "list" },
    { value: "grid-2x2", label: "2-2 Square", description: "2x2 square grid", icon: "grid-2x2" },
    { value: "table", label: "Table", description: "Tabular data layout", icon: "table" },
    { value: "sidebar-left", label: "Sidebar Left", description: "Content with left sidebar", icon: "sidebar" },
    { value: "sidebar-right", label: "Sidebar Right", description: "Content with right sidebar", icon: "sidebar-right" },
    { value: "centered", label: "Centered", description: "Centered content layout", icon: "align-center" },
    { value: "masonry", label: "Masonry", description: "Pinterest-style masonry grid", icon: "layout-grid" },
  ],

  framing: [
    { value: "full-screen", label: "Full Screen", description: "Edge-to-edge layout" },
    { value: "card", label: "Card", description: "Content in a card container" },
    { value: "browser", label: "Browser", description: "Browser window mockup frame" },
    { value: "mac-app", label: "Mac App", description: "macOS window frame style" },
    { value: "clay-web", label: "Clay Web", description: "3D clay-style mockup" },
  ],

  styles: [
    { value: "flat", label: "Flat", description: "Clean, flat design without shadows" },
    { value: "outline", label: "Outline", description: "Outlined elements with borders" },
    { value: "minimal", label: "Minimalist", description: "Ultra-minimal with lots of whitespace" },
    { value: "glass", label: "Glass", description: "Glassmorphism with blur effects" },
    { value: "ios", label: "iOS", description: "Apple iOS design language" },
    { value: "material", label: "Material", description: "Google Material Design style" },
  ],

  themes: [
    { value: "dark", label: "Dark Mode", description: "Dark background with light text" },
    { value: "light", label: "Light Mode", description: "Light background with dark text" },
  ],

  accentColors: [
    { value: "violet", label: "Violet", tailwind: "violet-500", hex: "#8b5cf6" },
    { value: "blue", label: "Blue", tailwind: "blue-500", hex: "#3b82f6" },
    { value: "cyan", label: "Cyan", tailwind: "cyan-500", hex: "#06b6d4" },
    { value: "green", label: "Green", tailwind: "green-500", hex: "#22c55e" },
    { value: "yellow", label: "Yellow", tailwind: "yellow-500", hex: "#eab308" },
    { value: "orange", label: "Orange", tailwind: "orange-500", hex: "#f97316" },
    { value: "red", label: "Red", tailwind: "red-500", hex: "#ef4444" },
    { value: "pink", label: "Pink", tailwind: "pink-500", hex: "#ec4899" },
    { value: "indigo", label: "Indigo", tailwind: "indigo-500", hex: "#6366f1" },
  ],

  backgroundColors: [
    { value: "zinc-950", label: "Dark", hex: "#09090b" },
    { value: "zinc-900", label: "Charcoal", hex: "#18181b" },
    { value: "slate-900", label: "Slate", hex: "#0f172a" },
    { value: "neutral-900", label: "Neutral", hex: "#171717" },
    { value: "white", label: "White", hex: "#ffffff" },
    { value: "zinc-50", label: "Light Gray", hex: "#fafafa" },
  ],

  borderColors: [
    { value: "transparent", label: "None", hex: "transparent" },
    { value: "zinc-800", label: "Subtle", hex: "#27272a" },
    { value: "zinc-700", label: "Medium", hex: "#3f3f46" },
    { value: "accent", label: "Accent", hex: "accent" },
  ],

  shadows: [
    { value: "none", label: "None" },
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
    { value: "xl", label: "Extra Large" },
    { value: "glow", label: "Glow" },
  ],

  typefaceTypes: [
    { value: "sans", label: "Sans", preview: "Type" },
    { value: "serif", label: "Serif", preview: "Type" },
    { value: "mono", label: "Monospace", preview: "Type" },
    { value: "condensed", label: "Condensed", preview: "Type" },
    { value: "expanded", label: "Expanded", preview: "Type" },
    { value: "rounded", label: "Rounded", preview: "Type" },
  ],

  headingFonts: [
    { value: "inter", label: "Inter", preview: "Title" },
    { value: "geist", label: "Geist", preview: "Title" },
    { value: "manrope", label: "Manrope", preview: "Title" },
    { value: "playfair", label: "Playfair Display", preview: "Title" },
    { value: "instrument-serif", label: "Instrument Serif", preview: "Title" },
    { value: "plex-serif", label: "Plex Serif", preview: "Title" },
  ],

  bodyFonts: [
    { value: "inter", label: "Inter", preview: "Body" },
    { value: "geist", label: "Geist", preview: "Body" },
    { value: "manrope", label: "Manrope", preview: "Body" },
    { value: "playfair", label: "Playfair Display", preview: "Body" },
    { value: "instrument-serif", label: "Instrument Serif", preview: "Body" },
    { value: "plex-serif", label: "Plex Serif", preview: "Body" },
  ],

  headingSizes: [
    { value: "sm", label: "20-32px", preview: "Title" },
    { value: "md", label: "32-40px", preview: "Title" },
    { value: "lg", label: "48-64px", preview: "Title" },
    { value: "xl", label: "64-80px", preview: "Title" },
  ],

  subheadingSizes: [
    { value: "sm", label: "16-20px", preview: "Subtitle" },
    { value: "md", label: "20-24px", preview: "Subtitle" },
    { value: "lg", label: "24-28px", preview: "Subtitle" },
    { value: "xl", label: "28-32px", preview: "Subtitle" },
  ],

  bodyTextSizes: [
    { value: "sm", label: "12-14px", preview: "Body" },
    { value: "md", label: "14-16px", preview: "Body" },
    { value: "lg", label: "16-18px", preview: "Body" },
    { value: "xl", label: "18-20px", preview: "Body" },
  ],

  headingWeights: [
    { value: "ultralight", label: "Ultralight", weight: 100 },
    { value: "light", label: "Light", weight: 300 },
    { value: "regular", label: "Regular", weight: 400 },
    { value: "medium", label: "Medium", weight: 500 },
    { value: "semibold", label: "Semibold", weight: 600 },
    { value: "bold", label: "Bold", weight: 700 },
  ],

  letterSpacings: [
    { value: "tighter", label: "Tighter", tracking: "-0.05em" },
    { value: "tight", label: "Tight", tracking: "-0.025em" },
    { value: "normal", label: "Normal", tracking: "0" },
    { value: "wide", label: "Wide", tracking: "0.025em" },
    { value: "wider", label: "Wider", tracking: "0.05em" },
    { value: "widest", label: "Widest", tracking: "0.1em" },
  ],

  // Animation Type
  animationTypes: [
    { value: "fade", label: "Fade", icon: "square" },
    { value: "slide", label: "Slide", icon: "square" },
    { value: "scale", label: "Scale", icon: "square" },
    { value: "rotate", label: "Rotate", icon: "diamond" },
    { value: "blur", label: "Blur", icon: "square" },
    { value: "3d", label: "3D", icon: "square" },
  ],

  // Animation Scene (how elements animate)
  animationScenes: [
    { value: "all-at-once", label: "All at once", icon: "grid" },
    { value: "sequence", label: "Sequence", icon: "layers" },
    { value: "word-by-word", label: "Word by word", icon: "type" },
    { value: "letter-by-letter", label: "Letter by letter", icon: "type" },
  ],

  // Animation Timing Functions
  animationTimings: [
    { value: "linear", label: "Linear", curve: "linear" },
    { value: "ease", label: "Ease", curve: "ease" },
    { value: "ease-in", label: "Ease In", curve: "ease-in" },
    { value: "ease-out", label: "Ease Out", curve: "ease-out" },
    { value: "ease-in-out", label: "Ease In Out", curve: "ease-in-out" },
    { value: "spring", label: "Spring", curve: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" },
  ],

  // Animation Iterations
  animationIterations: [
    { value: "1", label: "Once", display: "1×" },
    { value: "2", label: "Twice", display: "2×" },
    { value: "3", label: "Thrice", display: "3×" },
    { value: "infinite", label: "Infinite", display: "∞" },
  ],

  // Animation Direction
  animationDirections: [
    { value: "normal", label: "Normal", icon: "arrow-right" },
    { value: "reverse", label: "Reverse", icon: "arrow-left" },
    { value: "alternate", label: "Alternate", icon: "arrow-right-left" },
    { value: "alternate-reverse", label: "Alternate Rev...", icon: "arrow-left-right" },
  ],

  // Keep old animations for backward compatibility
  animations: [
    { value: "none", label: "None", description: "No animation" },
    { value: "fade", label: "Fade", description: "Fade in/out effects" },
    { value: "slide", label: "Slide", description: "Slide in from edges" },
    { value: "scale", label: "Scale", description: "Scale up/down effects" },
    { value: "rotate", label: "Rotate", description: "Rotation animations" },
    { value: "blur", label: "Blur", description: "Blur to focus effects" },
    { value: "3d", label: "3D", description: "3D transform effects" },
  ],

  generatedPrompts: [
    // Custom & Content
    { id: "add-custom", label: "Add custom prompt", prompt: "" },
    { id: "change-content", label: "Change texts, names, numbers", prompt: "Replace all placeholder texts, names, and numbers with unique, contextually relevant content. Make it feel authentic and professional." },
    { id: "recreate-section", label: "Recreate this section with new content", prompt: "Recreate this design. Change all texts, names, and numbers. Put all the script and code related to each card/section to their respective container. They need to exist on their own, include the necessary script imports." },

    // Layout & Structure
    { id: "hero-section", label: "Create hero with all sections", prompt: "Create a hero section with compelling headline. Add sections for features, testimonials, pricing comparison, and a comprehensive footer with links." },
    { id: "adapt-section", label: "Adapt a new section with fresh content", prompt: "Adapt a new section to the existing design language. Change all texts, names, and numbers to be unique and contextually appropriate." },
    { id: "saas-hero", label: "SaaS Hero Section", prompt: "Create a modern SaaS landing page hero with gradient text, floating UI elements, compelling headline, and prominent CTA buttons. Include a main action button and a secondary outline button." },
    { id: "feature-grid", label: "Feature Grid with Icons", prompt: "Design a 3-column feature grid with icon cards, hover effects, and descriptive text. Each card should have an icon, title, and description with subtle hover animations." },
    { id: "pricing-table", label: "Pricing Comparison Table", prompt: "Build a pricing table with 3 tiers (Basic, Pro, Enterprise), popular badge on the middle tier, feature comparison list, and toggle for monthly/yearly billing with discount indicator." },
    { id: "testimonial-carousel", label: "Testimonial Carousel", prompt: "Create a testimonial section with user avatars, quoted reviews, company logos, star ratings, and smooth carousel transitions. Include navigation dots and auto-play." },
    { id: "cta-section", label: "Call-to-Action Section", prompt: "Design an eye-catching CTA section with gradient background, compelling headline, supporting text, and dual buttons (primary action + secondary link)." },
    { id: "footer-complex", label: "Complex Footer", prompt: "Build a comprehensive footer with multiple columns for navigation, newsletter signup form, social media links, legal links, and copyright. Include company logo and tagline." },
    { id: "stats-counter", label: "Animated Stats Counter", prompt: "Create a statistics section with animated counting numbers (e.g., 10K+ Users, 99.9% Uptime, 50+ Countries), icons, and subtle count-up animations on scroll." },
    { id: "faq-accordion", label: "FAQ Accordion", prompt: "Design an FAQ section with expandable accordion items, smooth open/close animations, plus/minus icons, and organized by categories." },

    // Icons & Visual Elements
    { id: "iconify-solar", label: "Use Iconify Solar Linear icons", prompt: "Use Iconify Solar Linear icon set for all icons throughout the design. Import via <script src=\"https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js\"></script> and use <iconify-icon icon=\"solar:icon-name-linear\"></iconify-icon>" },
    { id: "iconify-simple", label: "Use Simple Icons for company logos", prompt: "Use Iconify Simple Icons for company/brand logos at 96x36 size instead of text logos. Use <iconify-icon icon=\"simple-icons:brand-name\"></iconify-icon> component instead of full SVG code for cleaner markup." },
    { id: "numbered-steps", label: "Add 01 02 03 number details", prompt: "Add numbered indicators (01, 02, 03, etc.) to sections, steps, or cards for visual hierarchy. Style them with a subtle color and larger font size as decorative elements." },
    { id: "gradient-borders", label: "Use gradient borders for buttons and cards", prompt: "Apply gradient borders to buttons, cards, and interactive elements using border-image or pseudo-element technique for a premium, modern look." },
    { id: "container-lines", label: "Add vertical container-size lines", prompt: "Add subtle vertical divider lines between container sections using border or pseudo-elements. These lines should span the container height for visual separation." },

    // Animation & Motion
    { id: "clip-intro", label: "Add clip intro animation", prompt: "Add a clip-path reveal animation on page load. Make sure the animation starts immediately and use animation-fill-mode: both instead of forwards. Don't start elements with opacity 0 to avoid flash of invisible content." },
    { id: "scroll-animations", label: "Animate element by element on scroll", prompt: "Animate elements when they enter viewport using Intersection Observer. Apply fade in, slide in, blur in effects element by element. Use animation-fill-mode: 'both' instead of 'forwards'. Don't use opacity 0 as starting state." },
    { id: "view-observed", label: "Animate when in view observed", prompt: "Implement scroll-triggered animations using Intersection Observer. When elements come into view, apply fade in, slide in, blur in effects sequentially, element by element with staggered delays." },
    { id: "hover-beam", label: "Add border beam animation on hover", prompt: "Add a 1px animated border beam that travels around pill-shaped buttons on hover. The beam should smoothly trace the button's border creating a glowing trail effect." },
    { id: "text-clip-animation", label: "Add vertical text clip slide animation", prompt: "Create a vertical text clip slide down animation that reveals text letter by letter. Use clip-path to mask and reveal each character with a smooth sliding motion." },
    { id: "card-carousel", label: "Animate cards in rotating carousel", prompt: "Animate the cards to rotate between 3 cards in a continuous loop. Add prev/next arrow buttons to manually switch between cards. Include smooth transition effects and indicator dots." },
    { id: "sonar-pulse", label: "Add sonar animation and decorations", prompt: "Add sonar-style pulsing ring animations to decorative elements, notification indicators, and call-to-action elements. Create expanding circles that fade out." },
    { id: "flashlight-hover", label: "Add flashlight effect on hover", prompt: "Add a subtle flashlight/spotlight effect that follows the cursor position on hover. Apply to both the background and border of cards creating a glowing area under the mouse." },
    { id: "marquee-infinite", label: "Apply infinite marquee animation", prompt: "Make the cards/logos animate in a marquee style, looping infinitely with duplicated items. Apply alpha mask (gradient fade) on left and right edges. Animation should be slow and smooth." },
    { id: "parallax-bg", label: "Add parallax scrolling to background", prompt: "Add parallax scrolling effect to background elements. Background should move at a different speed than foreground content for depth and visual interest." },
    { id: "noodle-connections", label: "Add connecting lines with beam animation", prompt: "Add animated curved lines (noodles/bezier curves) that connect related elements. Include a flowing beam/light effect that travels along the lines." },

    // Layout Enhancements
    { id: "iphone-frames", label: "Create iPhone device frames", prompt: "Create 3 iPhone frames (393x852), centered vertically and horizontally with gap of 40px. Adapt each section for mobile screens. Apply beautiful shadow: shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] against a contrasting background." },
    { id: "alpha-mask-edges", label: "Apply alpha masking for edge fade", prompt: "Apply alpha masking using mask-image: linear-gradient for left and right sides. Content should smoothly fade out at the edges creating an elegant overflow effect." },
    { id: "responsive-adapt", label: "Make responsive", prompt: "Ensure all sections are fully responsive with appropriate breakpoints for mobile (< 640px), tablet (640px - 1024px), and desktop (> 1024px). Stack elements vertically on mobile, adjust font sizes and spacing." },
    { id: "dark-mode-adapt", label: "Adapt to dark mode", prompt: "Adapt the design for dark mode with appropriate color adjustments. Invert backgrounds to dark, adjust text colors for contrast, modify shadows and borders to work on dark backgrounds." },

    // Typography & Content
    { id: "scale-typography", label: "Make headings and text bigger", prompt: "Make the headings 2 sizes bigger (e.g., text-2xl to text-4xl). Make the body text 1 size bigger. Increase line-height proportionally for better readability." },
    { id: "modular-sections", label: "Make sections standalone modules", prompt: "Structure each section as an independent module with its own styles and scripts. Each card/section should have all related code in its container. They need to work on their own - include necessary script imports." },

    // Advanced Effects
    { id: "magnetic-buttons", label: "Magnetic Hover Buttons", prompt: "Add magnetic attraction effect to buttons that subtly follow cursor movement when hovering nearby. Button should slightly move toward the cursor position." },
    { id: "blur-backdrop", label: "Frosted Glass Backdrop", prompt: "Apply backdrop-blur and semi-transparent backgrounds (bg-white/10 or bg-black/20) for a frosted glass effect on overlays, modals, and floating elements." },
    { id: "gradient-mesh", label: "Mesh Gradient Background", prompt: "Create a colorful mesh gradient background with multiple color stops using radial-gradient layers. Colors should blend smoothly creating an organic, modern feel." },
    { id: "noise-texture", label: "Subtle Noise Texture", prompt: "Add a subtle grain/noise texture overlay using CSS filter or SVG noise pattern for a more organic, premium feel. Keep opacity very low (5-10%)." },
    { id: "glow-effects", label: "Ambient Glow Effects", prompt: "Add soft ambient glow effects behind key elements using large box-shadows with accent colors, or pseudo-elements with blur filter for a dreamy, premium appearance." },
  ],
};

// Helper to build prompt from builder options
export function buildPromptFromOptions(options: {
  layoutType: string | null;
  layoutConfig: string | null;
  framing?: string | null;
  style: string | null;
  theme: string | null;
  accentColor: string | null;
  backgroundColor?: string | null;
  borderColor?: string | null;
  shadow?: string | null;
  typefaceType?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  headingSize?: string | null;
  subheadingSize?: string | null;
  bodyTextSize?: string | null;
  headingWeight?: string | null;
  letterSpacing?: string | null;
  animation?: string | null;
  // New animation system parameters
  animationType?: string | null;
  animationScene?: string | null;
  animationDuration?: number;
  animationDelay?: number;
  animationTiming?: string | null;
  animationIterations?: string | null;
  animationDirection?: string | null;
  additionalInstructions?: string;
}): string {
  const parts: string[] = [];

  if (options.layoutType) {
    const layoutType = PROMPT_BUILDER_OPTIONS.layoutTypes.find(
      (t) => t.value === options.layoutType
    );
    if (layoutType) {
      parts.push(`Create a ${layoutType.label.toLowerCase()} layout`);
    }
  }

  if (options.layoutConfig) {
    const layoutConfig = PROMPT_BUILDER_OPTIONS.layoutConfigs.find(
      (c) => c.value === options.layoutConfig
    );
    if (layoutConfig) {
      parts.push(`with ${layoutConfig.label.toLowerCase()} configuration`);
    }
  }

  if (options.framing) {
    const framing = PROMPT_BUILDER_OPTIONS.framing.find((f) => f.value === options.framing);
    if (framing) {
      parts.push(`using ${framing.label.toLowerCase()} framing`);
    }
  }

  if (options.style) {
    const style = PROMPT_BUILDER_OPTIONS.styles.find((s) => s.value === options.style);
    if (style) {
      parts.push(`in ${style.label.toLowerCase()} visual style`);
    }
  }

  if (options.theme) {
    const theme = PROMPT_BUILDER_OPTIONS.themes.find((t) => t.value === options.theme);
    if (theme) {
      parts.push(`with ${theme.value} theme`);
    }
  }

  if (options.accentColor) {
    const accentColor = PROMPT_BUILDER_OPTIONS.accentColors.find(
      (c) => c.value === options.accentColor
    );
    if (accentColor) {
      parts.push(`${accentColor.label.toLowerCase()} accent color`);
    }
  }

  if (options.backgroundColor) {
    const backgroundColor = PROMPT_BUILDER_OPTIONS.backgroundColors.find(
      (c) => c.value === options.backgroundColor
    );
    if (backgroundColor) {
      parts.push(`${backgroundColor.label.toLowerCase()} background`);
    }
  }

  if (options.shadow && options.shadow !== "none") {
    const shadow = PROMPT_BUILDER_OPTIONS.shadows.find((s) => s.value === options.shadow);
    if (shadow) {
      parts.push(`${shadow.label.toLowerCase()} shadows`);
    }
  }

  // Border Color
  if (options.borderColor && options.borderColor !== "transparent") {
    const borderColor = PROMPT_BUILDER_OPTIONS.borderColors.find(
      (c) => c.value === options.borderColor
    );
    if (borderColor) {
      parts.push(`${borderColor.label.toLowerCase()} border color`);
    }
  }

  // Typeface Type (Sans, Serif, Mono, etc.)
  if (options.typefaceType) {
    const typefaceType = PROMPT_BUILDER_OPTIONS.typefaceTypes.find(
      (t) => t.value === options.typefaceType
    );
    if (typefaceType) {
      parts.push(`${typefaceType.label.toLowerCase()} typeface family`);
    }
  }

  if (options.headingFont) {
    const headingFont = PROMPT_BUILDER_OPTIONS.headingFonts.find(
      (f) => f.value === options.headingFont
    );
    if (headingFont) {
      parts.push(`${headingFont.label} font for headings`);
    }
  }

  if (options.bodyFont) {
    const bodyFont = PROMPT_BUILDER_OPTIONS.bodyFonts.find(
      (f) => f.value === options.bodyFont
    );
    if (bodyFont) {
      parts.push(`${bodyFont.label} font for body text`);
    }
  }

  if (options.headingSize) {
    const headingSize = PROMPT_BUILDER_OPTIONS.headingSizes.find(
      (s) => s.value === options.headingSize
    );
    if (headingSize) {
      parts.push(`${headingSize.label} heading size`);
    }
  }

  // Subheading Size
  if (options.subheadingSize) {
    const subheadingSize = PROMPT_BUILDER_OPTIONS.subheadingSizes.find(
      (s) => s.value === options.subheadingSize
    );
    if (subheadingSize) {
      parts.push(`${subheadingSize.label} subheading size`);
    }
  }

  // Body Text Size
  if (options.bodyTextSize) {
    const bodyTextSize = PROMPT_BUILDER_OPTIONS.bodyTextSizes.find(
      (s) => s.value === options.bodyTextSize
    );
    if (bodyTextSize) {
      parts.push(`${bodyTextSize.label} body text size`);
    }
  }

  if (options.headingWeight) {
    const headingWeight = PROMPT_BUILDER_OPTIONS.headingWeights.find(
      (w) => w.value === options.headingWeight
    );
    if (headingWeight) {
      parts.push(`${headingWeight.label.toLowerCase()} weight headings`);
    }
  }

  if (options.letterSpacing && options.letterSpacing !== "normal") {
    const letterSpacing = PROMPT_BUILDER_OPTIONS.letterSpacings.find(
      (l) => l.value === options.letterSpacing
    );
    if (letterSpacing) {
      parts.push(`${letterSpacing.label.toLowerCase()} letter spacing`);
    }
  }

  if (options.animation && options.animation !== "none") {
    const animation = PROMPT_BUILDER_OPTIONS.animations.find(
      (a) => a.value === options.animation
    );
    if (animation) {
      parts.push(`${animation.label.toLowerCase()} animations`);
    }
  }

  // Handle new animation system
  if (options.animationType) {
    const animationType = PROMPT_BUILDER_OPTIONS.animationTypes.find(
      (a) => a.value === options.animationType
    );
    if (animationType) {
      const animationParts: string[] = [`Apply ${animationType.label.toLowerCase()} animation effect`];

      // Add scene description
      if (options.animationScene) {
        const scene = PROMPT_BUILDER_OPTIONS.animationScenes.find(
          (s) => s.value === options.animationScene
        );
        if (scene) {
          animationParts.push(`with ${scene.label.toLowerCase()} sequence`);
        }
      }

      // Add timing
      if (options.animationTiming) {
        const timing = PROMPT_BUILDER_OPTIONS.animationTimings.find(
          (t) => t.value === options.animationTiming
        );
        if (timing) {
          animationParts.push(`using ${timing.label.toLowerCase()} easing`);
        }
      }

      // Add duration (only if different from default)
      if (options.animationDuration && options.animationDuration !== 0.8) {
        animationParts.push(`${options.animationDuration}s duration`);
      }

      // Add delay (only if > 0)
      if (options.animationDelay && options.animationDelay > 0) {
        animationParts.push(`${options.animationDelay}s delay`);
      }

      // Add iterations (only if not default "1")
      if (options.animationIterations && options.animationIterations !== "1") {
        const iteration = PROMPT_BUILDER_OPTIONS.animationIterations.find(
          (i) => i.value === options.animationIterations
        );
        if (iteration) {
          animationParts.push(`${iteration.label.toLowerCase()} iteration`);
        }
      }

      // Add direction (only if not default)
      if (options.animationDirection && options.animationDirection !== "normal") {
        const direction = PROMPT_BUILDER_OPTIONS.animationDirections.find(
          (d) => d.value === options.animationDirection
        );
        if (direction) {
          animationParts.push(`${direction.label.toLowerCase()} direction`);
        }
      }

      parts.push(animationParts.join(" "));
    }
  }

  // If no options selected, return a default prompt
  if (parts.length === 0) {
    return options.additionalInstructions || "Create a modern landing page.";
  }

  let prompt = parts.join(", ") + ".";

  if (options.additionalInstructions) {
    prompt += ` ${options.additionalInstructions}`;
  }

  return prompt;
}
