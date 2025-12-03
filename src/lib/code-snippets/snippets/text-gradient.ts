import { CodeSnippet } from "../types";

const code = `/* Text Gradient Effects - Modern Typography */
<style>
/* Basic gradient text */
.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Popular gradient presets */
.text-gradient-sunset {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-ocean {
  background: linear-gradient(135deg, #667eea 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-fire {
  background: linear-gradient(135deg, #f12711 0%, #f5af19 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-nature {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-aurora {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #d299c2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Animated gradient */
.text-gradient-animated {
  background: linear-gradient(
    270deg,
    #12c2e9,
    #c471ed,
    #f64f59,
    #12c2e9
  );
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Metallic gradient */
.text-gradient-metallic {
  background: linear-gradient(
    135deg,
    #d4af37 0%,
    #f9f295 25%,
    #d4af37 50%,
    #f9f295 75%,
    #d4af37 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Chrome/Silver effect */
.text-gradient-chrome {
  background: linear-gradient(
    135deg,
    #e8e8e8 0%,
    #ffffff 25%,
    #a0a0a0 50%,
    #ffffff 75%,
    #e8e8e8 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>

<!-- Usage Examples -->
<h1 class="text-gradient text-6xl font-bold">Gradient Text</h1>
<h2 class="text-gradient-sunset text-4xl">Sunset Vibes</h2>
<h2 class="text-gradient-animated text-4xl">Animated Colors</h2>
<h2 class="text-gradient-metallic text-4xl">Golden Metallic</h2>`;

export const TEXT_GRADIENT: CodeSnippet = {
  id: "text-gradient",
  name: "Text Gradient",
  description: "Textos com gradientes coloridos e animados",
  category: "css",
  tags: ["text", "gradient", "typography", "animation", "color"],
  charCount: code.length,
  code,
};
