import { UIComponent } from "./types";
import { HERO_GRADIENT } from "./components/hero-gradient";
import { HERO_SPLIT } from "./components/hero-split";
import { FEATURE_GRID_3 } from "./components/feature-grid-3";
import { FEATURE_BENTO } from "./components/feature-bento";
import { CTA_CENTERED } from "./components/cta-centered";
import { CTA_NETWORK_MARQUEE } from "./components/cta-network-marquee";
import { PRICING_3_TIER } from "./components/pricing-3-tier";
import { TESTIMONIAL_CARDS } from "./components/testimonial-cards";
import { NAVBAR_SIMPLE } from "./components/navbar-simple";
import { FOOTER_4_COL } from "./components/footer-4-col";
import { CARD_PRODUCT } from "./components/card-product";

export const UI_COMPONENTS: UIComponent[] = [
  HERO_GRADIENT,
  HERO_SPLIT,
  FEATURE_GRID_3,
  FEATURE_BENTO,
  CTA_CENTERED,
  CTA_NETWORK_MARQUEE,
  PRICING_3_TIER,
  TESTIMONIAL_CARDS,
  NAVBAR_SIMPLE,
  FOOTER_4_COL,
  CARD_PRODUCT,
];

export * from "./types";
