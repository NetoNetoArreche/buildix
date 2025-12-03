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
];

export type ContentType = "landing" | "instagram-post" | "instagram-carousel" | "instagram-story";
