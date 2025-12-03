// Community / Templates Types

export type TemplateCategory =
  | "landing"
  | "portfolio"
  | "ecommerce"
  | "blog"
  | "agency"
  | "startup"
  | "saas"
  | "personal";

export type TemplateSortOption = "popular" | "recent" | "most_remixed";

export type TemplateTypeFilter = "all" | "community" | "official" | "pro";

// Published Project (Template)
export interface PublishedProject {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  tags: string[];
  thumbnail: string | null;
  isPro: boolean;
  isOfficial: boolean;
  allowRemix: boolean;
  isPublished: boolean;
  viewCount: number;
  likeCount: number;
  remixCount: number;
  publishedAt: Date;
  updatedAt: Date;
}

// Template with author info (for listing)
export interface TemplateWithAuthor extends PublishedProject {
  project: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
  isLiked?: boolean; // if current user liked
}

// Template detail with full content
export interface TemplateDetail extends TemplateWithAuthor {
  project: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string | null;
      displayName: string | null;
      avatar: string | null;
      bio: string | null;
      followerCount: number;
    } | null;
    pages: {
      id: string;
      name: string;
      slug: string;
      htmlContent: string;
      cssContent: string | null;
      isHome: boolean;
    }[];
  };
  comments: ProjectComment[];
}

// Project Comment
export interface ProjectComment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    avatar: string | null;
  };
}

// User Profile (Creator)
export interface CreatorProfile {
  id: string;
  name: string | null;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean; // if current user follows
  templateCount: number;
  totalLikes: number;
  totalRemixes: number;
}

// API Request/Response Types

export interface ListTemplatesParams {
  page?: number;
  limit?: number;
  category?: TemplateCategory;
  search?: string;
  sort?: TemplateSortOption;
  type?: TemplateTypeFilter;
  tags?: string[];
}

export interface ListTemplatesResponse {
  templates: TemplateWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublishProjectRequest {
  projectId: string;
  title: string;
  description?: string;
  category: TemplateCategory;
  tags?: string[];
  thumbnail?: string;
  allowRemix?: boolean;
}

export interface PublishProjectResponse {
  success: boolean;
  publishedProject: PublishedProject;
  publicUrl: string;
}

export interface RemixResponse {
  success: boolean;
  newProjectId: string;
  redirectUrl: string;
}

// Slug generation helper type
export interface SlugCheckResponse {
  available: boolean;
  suggestion?: string;
}
