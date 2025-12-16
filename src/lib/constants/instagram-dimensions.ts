// Instagram content dimensions
export const INSTAGRAM_DIMENSIONS = {
  post: {
    width: 1080,
    height: 1080,
    aspectRatio: "1:1",
    label: "Instagram Post",
    description: "Square post format",
  },
  carousel: {
    width: 1080,
    height: 1350,
    aspectRatio: "4:5",
    label: "Instagram Carousel",
    description: "Multiple slides format",
    maxSlides: 10,
    defaultSlides: 5,
  },
  story: {
    width: 1080,
    height: 1920,
    aspectRatio: "9:16",
    label: "Instagram Story",
    description: "Vertical story format",
  },
};

// Mobile App dimensions
export const MOBILE_DIMENSIONS = {
  app: {
    width: 390,
    height: 844,
    aspectRatio: "9:19.5",
    label: "Mobile App",
    description: "iPhone 14 Pro size",
    maxScreens: 10,
    defaultScreens: 5,
  },
};

// Dashboard dimensions
export const DASHBOARD_DIMENSIONS = {
  desktop: {
    width: 1440,
    height: 900,
    aspectRatio: "16:10",
    label: "Dashboard",
    description: "Desktop admin panel",
  },
};

// Email Template dimensions
export const EMAIL_DIMENSIONS = {
  template: {
    width: 600,
    height: 800,
    aspectRatio: "3:4",
    label: "Email Template",
    description: "Email marketing template",
  },
};

// Content type options for the selector
export const CONTENT_TYPE_OPTIONS = [
  {
    value: "landing",
    label: "Landing Page",
    description: "Full responsive landing page",
    icon: "Layout",
  },
  {
    value: "instagram-post",
    label: "Instagram Post",
    description: "1080x1080px square",
    icon: "Square",
    dimensions: INSTAGRAM_DIMENSIONS.post,
  },
  {
    value: "instagram-carousel",
    label: "Instagram Carousel",
    description: "1080x1350px slides",
    icon: "Layers",
    dimensions: INSTAGRAM_DIMENSIONS.carousel,
  },
  {
    value: "instagram-story",
    label: "Instagram Story",
    description: "1080x1920px vertical",
    icon: "Smartphone",
    dimensions: INSTAGRAM_DIMENSIONS.story,
  },
  {
    value: "mobile-app",
    label: "Mobile App",
    description: "390x844px screens",
    icon: "Smartphone",
    dimensions: MOBILE_DIMENSIONS.app,
  },
  {
    value: "dashboard",
    label: "Dashboard",
    description: "1440x900px admin panel",
    icon: "LayoutDashboard",
    dimensions: DASHBOARD_DIMENSIONS.desktop,
  },
  {
    value: "email-template",
    label: "Email Template",
    description: "600px email marketing",
    icon: "Mail",
    dimensions: EMAIL_DIMENSIONS.template,
  },
];

export type ContentType = "landing" | "instagram-post" | "instagram-carousel" | "instagram-story" | "mobile-app" | "dashboard" | "email-template";
