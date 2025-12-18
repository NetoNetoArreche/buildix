// Carousel Templates and Constants for Instagram Carousel Builder

export interface CarouselTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  slideCount: number;
  structure: {
    slideNumber: number;
    type: string;
    purpose: string;
    placeholder: string;
  }[];
}

export interface ViralHook {
  id: string;
  category: string;
  template: string;
  example: string;
}

export interface StylePreset {
  id: string;
  label: string;
  description: string;
  colors: {
    background: string;
    text: string;
    accent: string;
  };
  fontStyle: string;
}

export interface NichePalette {
  id: string;
  label: string;
  colors: string[];
  description: string;
}

// ===========================================
// CAROUSEL TEMPLATES
// ===========================================

export const CAROUSEL_TEMPLATES: CarouselTemplate[] = [
  {
    id: "educational",
    label: "Educacional",
    description: "Ensine algo valioso em passos claros",
    icon: "GraduationCap",
    slideCount: 5,
    structure: [
      { slideNumber: 1, type: "hook", purpose: "Gancho", placeholder: "Título impactante que gera curiosidade" },
      { slideNumber: 2, type: "content", purpose: "Dica 1", placeholder: "Primeiro ponto ou dica" },
      { slideNumber: 3, type: "content", purpose: "Dica 2", placeholder: "Segundo ponto ou dica" },
      { slideNumber: 4, type: "content", purpose: "Dica 3", placeholder: "Terceiro ponto ou dica" },
      { slideNumber: 5, type: "cta", purpose: "CTA", placeholder: "Chamada para ação (seguir, salvar, compartilhar)" },
    ],
  },
  {
    id: "sales",
    label: "Vendas",
    description: "Apresente seu produto/serviço de forma persuasiva",
    icon: "ShoppingCart",
    slideCount: 5,
    structure: [
      { slideNumber: 1, type: "hook", purpose: "Gancho", placeholder: "Problema ou dor do cliente" },
      { slideNumber: 2, type: "content", purpose: "Problema", placeholder: "Aprofunde na dor/frustração" },
      { slideNumber: 3, type: "content", purpose: "Solução", placeholder: "Apresente sua solução" },
      { slideNumber: 4, type: "content", purpose: "Prova", placeholder: "Depoimentos ou resultados" },
      { slideNumber: 5, type: "cta", purpose: "CTA", placeholder: "Oferta + chamada para ação" },
    ],
  },
  {
    id: "storytelling",
    label: "Storytelling",
    description: "Conte uma história envolvente",
    icon: "BookOpen",
    slideCount: 7,
    structure: [
      { slideNumber: 1, type: "hook", purpose: "Gancho", placeholder: "Início intrigante da história" },
      { slideNumber: 2, type: "content", purpose: "Contexto", placeholder: "Situação inicial" },
      { slideNumber: 3, type: "content", purpose: "Conflito", placeholder: "O problema/desafio" },
      { slideNumber: 4, type: "content", purpose: "Jornada", placeholder: "O que você fez" },
      { slideNumber: 5, type: "content", purpose: "Virada", placeholder: "O momento de transformação" },
      { slideNumber: 6, type: "content", purpose: "Lição", placeholder: "O aprendizado" },
      { slideNumber: 7, type: "cta", purpose: "CTA", placeholder: "Conexão com o público" },
    ],
  },
  {
    id: "comparison",
    label: "Comparativo",
    description: "Mostre antes/depois ou certo/errado",
    icon: "ArrowLeftRight",
    slideCount: 5,
    structure: [
      { slideNumber: 1, type: "hook", purpose: "Gancho", placeholder: "Provocação ou pergunta" },
      { slideNumber: 2, type: "content", purpose: "Errado", placeholder: "O que NÃO fazer / Antes" },
      { slideNumber: 3, type: "content", purpose: "Certo", placeholder: "O que FAZER / Depois" },
      { slideNumber: 4, type: "content", purpose: "Resultado", placeholder: "Os benefícios da mudança" },
      { slideNumber: 5, type: "cta", purpose: "CTA", placeholder: "Ação para o público" },
    ],
  },
  {
    id: "faq",
    label: "FAQ / Mitos",
    description: "Desmistifique crenças ou responda dúvidas",
    icon: "HelpCircle",
    slideCount: 6,
    structure: [
      { slideNumber: 1, type: "hook", purpose: "Gancho", placeholder: "Título que gera curiosidade" },
      { slideNumber: 2, type: "content", purpose: "Mito/Dúvida 1", placeholder: "Primeira crença errada + verdade" },
      { slideNumber: 3, type: "content", purpose: "Mito/Dúvida 2", placeholder: "Segunda crença errada + verdade" },
      { slideNumber: 4, type: "content", purpose: "Mito/Dúvida 3", placeholder: "Terceira crença errada + verdade" },
      { slideNumber: 5, type: "content", purpose: "Resumo", placeholder: "A verdade resumida" },
      { slideNumber: 6, type: "cta", purpose: "CTA", placeholder: "Chamada para ação" },
    ],
  },
];

// ===========================================
// VIRAL HOOKS LIBRARY
// ===========================================

export const VIRAL_HOOKS: ViralHook[] = [
  // Curiosidade
  { id: "curiosity-1", category: "curiosity", template: "O que [experts] não querem que você saiba sobre [tema]", example: "O que os dentistas não querem que você saiba sobre clareamento" },
  { id: "curiosity-2", category: "curiosity", template: "[Número] segredos de [profissão] que você precisa conhecer", example: "7 segredos de nutricionistas que você precisa conhecer" },
  { id: "curiosity-3", category: "curiosity", template: "Por que [coisa comum] está destruindo seu [resultado]", example: "Por que acordar cedo está destruindo sua produtividade" },

  // Números
  { id: "numbers-1", category: "numbers", template: "[X] passos para [resultado] em [tempo]", example: "5 passos para dobrar suas vendas em 30 dias" },
  { id: "numbers-2", category: "numbers", template: "[X]% das pessoas erram isso sobre [tema]", example: "90% das pessoas erram isso sobre investimentos" },
  { id: "numbers-3", category: "numbers", template: "De [situação ruim] para [resultado] em [tempo]", example: "De 0 a 10k seguidores em 3 meses" },
  { id: "numbers-4", category: "numbers", template: "[X] erros que estão te impedindo de [resultado]", example: "5 erros que estão te impedindo de emagrecer" },

  // Negação
  { id: "negation-1", category: "negation", template: "Pare de [erro comum] se quiser [resultado]", example: "Pare de postar todos os dias se quiser crescer no Instagram" },
  { id: "negation-2", category: "negation", template: "NUNCA faça isso se você quer [resultado]", example: "NUNCA faça isso se você quer ser promovido" },
  { id: "negation-3", category: "negation", template: "[Coisa que todos fazem] NÃO funciona. Veja o que funciona", example: "Fazer cardio em jejum NÃO funciona. Veja o que funciona" },

  // Urgência
  { id: "urgency-1", category: "urgency", template: "Você está cometendo esse erro agora mesmo", example: "Você está cometendo esse erro no Instagram agora mesmo" },
  { id: "urgency-2", category: "urgency", template: "Se você não fizer isso hoje, vai se arrepender", example: "Se você não começar a investir hoje, vai se arrepender" },
  { id: "urgency-3", category: "urgency", template: "Última chance de [benefício] antes de [consequência]", example: "Última chance de aprender inglês antes dos 30" },

  // Segredo/Revelação
  { id: "secret-1", category: "secret", template: "O método secreto de [autoridade] para [resultado]", example: "O método secreto de Elon Musk para alta produtividade" },
  { id: "secret-2", category: "secret", template: "Descobri isso depois de [X anos/tentativas]", example: "Descobri isso depois de 10 anos trabalhando com marketing" },
  { id: "secret-3", category: "secret", template: "A verdade que ninguém te conta sobre [tema]", example: "A verdade que ninguém te conta sobre empreender" },

  // Provocação
  { id: "provocation-1", category: "provocation", template: "Você realmente acha que [crença comum]?", example: "Você realmente acha que precisa trabalhar 12h por dia?" },
  { id: "provocation-2", category: "provocation", template: "Por que você ainda está [erro comum]?", example: "Por que você ainda está postando sem estratégia?" },
  { id: "provocation-3", category: "provocation", template: "Se você faz [coisa comum], precisa ver isso", example: "Se você faz dieta restritiva, precisa ver isso" },

  // Transformação
  { id: "transformation-1", category: "transformation", template: "Como eu fui de [situação ruim] para [resultado incrível]", example: "Como eu fui de R$0 a R$100k em 1 ano" },
  { id: "transformation-2", category: "transformation", template: "O que mudou tudo para mim em [área]", example: "O que mudou tudo para mim no marketing digital" },
  { id: "transformation-3", category: "transformation", template: "Antes eu achava que [crença]. Hoje eu sei que [verdade]", example: "Antes eu achava que precisa de dinheiro para investir. Hoje eu sei que..." },
];

// ===========================================
// STYLE PRESETS
// ===========================================

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "clean",
    label: "Clean",
    description: "Minimalista e elegante",
    colors: { background: "#ffffff", text: "#1a1a1a", accent: "#000000" },
    fontStyle: "sans-serif",
  },
  {
    id: "bold",
    label: "Bold",
    description: "Impactante e chamativo",
    colors: { background: "#000000", text: "#ffffff", accent: "#ff3366" },
    fontStyle: "bold sans-serif",
  },
  {
    id: "gradient",
    label: "Gradiente",
    description: "Moderno com cores vibrantes",
    colors: { background: "gradient", text: "#ffffff", accent: "#8b5cf6" },
    fontStyle: "sans-serif",
  },
  {
    id: "corporate",
    label: "Corporativo",
    description: "Profissional e confiável",
    colors: { background: "#f8fafc", text: "#1e293b", accent: "#3b82f6" },
    fontStyle: "serif",
  },
  {
    id: "playful",
    label: "Playful",
    description: "Divertido e descontraído",
    colors: { background: "#fef3c7", text: "#92400e", accent: "#f59e0b" },
    fontStyle: "rounded",
  },
  {
    id: "luxury",
    label: "Luxury",
    description: "Sofisticado e premium",
    colors: { background: "#18181b", text: "#fafafa", accent: "#d4af37" },
    fontStyle: "serif",
  },
  {
    id: "neon",
    label: "Neon",
    description: "Vibrante e futurista",
    colors: { background: "#0a0a0a", text: "#ffffff", accent: "#00ff88" },
    fontStyle: "sans-serif",
  },
  {
    id: "pastel",
    label: "Pastel",
    description: "Suave e acolhedor",
    colors: { background: "#fdf2f8", text: "#831843", accent: "#ec4899" },
    fontStyle: "rounded",
  },
];

// ===========================================
// NICHE COLOR PALETTES
// ===========================================

export const NICHE_PALETTES: NichePalette[] = [
  {
    id: "finance",
    label: "Finanças",
    colors: ["#1e40af", "#10b981", "#d4af37", "#1e293b"],
    description: "Azul, verde e dourado transmitem confiança e prosperidade",
  },
  {
    id: "health",
    label: "Saúde",
    colors: ["#22c55e", "#ffffff", "#0ea5e9", "#f0fdf4"],
    description: "Verde e azul claro transmitem bem-estar e frescor",
  },
  {
    id: "marketing",
    label: "Marketing",
    colors: ["#7c3aed", "#f97316", "#ec4899", "#18181b"],
    description: "Roxo e laranja transmitem criatividade e energia",
  },
  {
    id: "tech",
    label: "Tecnologia",
    colors: ["#1e293b", "#06b6d4", "#8b5cf6", "#0f172a"],
    description: "Azul escuro e ciano transmitem inovação",
  },
  {
    id: "lifestyle",
    label: "Lifestyle",
    colors: ["#fef3c7", "#d4a574", "#92400e", "#f5f5f4"],
    description: "Tons terrosos e neutros transmitem autenticidade",
  },
  {
    id: "fitness",
    label: "Fitness",
    colors: ["#000000", "#ef4444", "#f97316", "#18181b"],
    description: "Preto, vermelho e laranja transmitem energia e força",
  },
  {
    id: "beauty",
    label: "Beleza",
    colors: ["#fdf2f8", "#ec4899", "#d4af37", "#1f1f1f"],
    description: "Rosa e dourado transmitem elegância e feminilidade",
  },
  {
    id: "education",
    label: "Educação",
    colors: ["#1e40af", "#fbbf24", "#ffffff", "#1e293b"],
    description: "Azul e amarelo transmitem conhecimento e clareza",
  },
];

// ===========================================
// CONTENT SOURCE OPTIONS
// ===========================================

export const CONTENT_SOURCES = [
  {
    id: "manual",
    label: "Manual",
    description: "Digite seu conteúdo",
    icon: "Pencil",
  },
  {
    id: "url",
    label: "URL",
    description: "Extrair de um site",
    icon: "Link",
  },
  {
    id: "image",
    label: "Imagem",
    description: "Usar como referência",
    icon: "Image",
  },
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function getTemplateById(id: string): CarouselTemplate | undefined {
  return CAROUSEL_TEMPLATES.find(t => t.id === id);
}

export function getHooksByCategory(category: string): ViralHook[] {
  return VIRAL_HOOKS.filter(h => h.category === category);
}

export function getRandomHook(): ViralHook {
  return VIRAL_HOOKS[Math.floor(Math.random() * VIRAL_HOOKS.length)];
}

export function getRandomHookByCategory(category: string): ViralHook | undefined {
  const hooks = getHooksByCategory(category);
  if (hooks.length === 0) return undefined;
  return hooks[Math.floor(Math.random() * hooks.length)];
}

export function getPaletteById(id: string): NichePalette | undefined {
  return NICHE_PALETTES.find(p => p.id === id);
}

export function getStylePresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find(s => s.id === id);
}

// Hook categories for UI
export const HOOK_CATEGORIES = [
  { id: "curiosity", label: "Curiosidade", icon: "Search" },
  { id: "numbers", label: "Números", icon: "Hash" },
  { id: "negation", label: "Negação", icon: "X" },
  { id: "urgency", label: "Urgência", icon: "Clock" },
  { id: "secret", label: "Segredo", icon: "Lock" },
  { id: "provocation", label: "Provocação", icon: "Zap" },
  { id: "transformation", label: "Transformação", icon: "TrendingUp" },
];
