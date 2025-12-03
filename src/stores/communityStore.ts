import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  TemplateWithAuthor,
  TemplateDetail,
  TemplateCategory,
  TemplateSortOption,
  TemplateTypeFilter,
  CreatorProfile,
} from "@/types/community";

interface CommunityFilters {
  category?: TemplateCategory;
  search?: string;
  sort: TemplateSortOption;
  type: TemplateTypeFilter;
  tags: string[];
}

interface CommunityState {
  // Templates list
  templates: TemplateWithAuthor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: CommunityFilters;
  isLoading: boolean;
  error: string | null;

  // Current template detail
  currentTemplate: TemplateDetail | null;
  isLoadingTemplate: boolean;

  // Current creator
  currentCreator: CreatorProfile | null;
  creatorTemplates: TemplateWithAuthor[];
  isLoadingCreator: boolean;

  // Publish modal
  isPublishModalOpen: boolean;
  publishingProjectId: string | null;

  // Actions
  setTemplates: (templates: TemplateWithAuthor[]) => void;
  appendTemplates: (templates: TemplateWithAuthor[]) => void;
  setPagination: (pagination: CommunityState["pagination"]) => void;
  setFilters: (filters: Partial<CommunityFilters>) => void;
  resetFilters: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  setCurrentTemplate: (template: TemplateDetail | null) => void;
  setIsLoadingTemplate: (isLoading: boolean) => void;
  toggleLike: (slug: string, liked: boolean) => void;

  setCurrentCreator: (creator: CreatorProfile | null) => void;
  setCreatorTemplates: (templates: TemplateWithAuthor[]) => void;
  setIsLoadingCreator: (isLoading: boolean) => void;
  toggleFollow: (userId: string, following: boolean) => void;

  openPublishModal: (projectId: string) => void;
  closePublishModal: () => void;

  // Fetch actions
  fetchTemplates: (reset?: boolean) => Promise<void>;
  fetchTemplate: (slug: string) => Promise<void>;
  fetchCreator: (userId: string) => Promise<void>;
  likeTemplate: (slug: string) => Promise<void>;
  unlikeTemplate: (slug: string) => Promise<void>;
  followCreator: (userId: string) => Promise<void>;
  unfollowCreator: (userId: string) => Promise<void>;
  remixTemplate: (slug: string) => Promise<{ newProjectId: string; redirectUrl: string } | null>;
}

const defaultFilters: CommunityFilters = {
  sort: "recent",
  type: "all",
  tags: [],
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const useCommunityStore = create<CommunityState>()(
  immer((set, get) => ({
    templates: [],
    pagination: { ...defaultPagination },
    filters: { ...defaultFilters },
    isLoading: false,
    error: null,

    currentTemplate: null,
    isLoadingTemplate: false,

    currentCreator: null,
    creatorTemplates: [],
    isLoadingCreator: false,

    isPublishModalOpen: false,
    publishingProjectId: null,

    // State setters
    setTemplates: (templates) =>
      set((state) => {
        state.templates = templates;
      }),

    appendTemplates: (templates) =>
      set((state) => {
        state.templates.push(...templates);
      }),

    setPagination: (pagination) =>
      set((state) => {
        state.pagination = pagination;
      }),

    setFilters: (filters) =>
      set((state) => {
        Object.assign(state.filters, filters);
      }),

    resetFilters: () =>
      set((state) => {
        state.filters = { ...defaultFilters };
        state.pagination = { ...defaultPagination };
      }),

    setIsLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),

    setError: (error) =>
      set((state) => {
        state.error = error;
      }),

    setCurrentTemplate: (template) =>
      set((state) => {
        state.currentTemplate = template;
      }),

    setIsLoadingTemplate: (isLoading) =>
      set((state) => {
        state.isLoadingTemplate = isLoading;
      }),

    toggleLike: (slug, liked) =>
      set((state) => {
        // Update in templates list
        const template = state.templates.find((t) => t.slug === slug);
        if (template) {
          template.isLiked = liked;
          template.likeCount += liked ? 1 : -1;
        }
        // Update current template
        if (state.currentTemplate?.slug === slug) {
          state.currentTemplate.isLiked = liked;
          state.currentTemplate.likeCount += liked ? 1 : -1;
        }
      }),

    setCurrentCreator: (creator) =>
      set((state) => {
        state.currentCreator = creator;
      }),

    setCreatorTemplates: (templates) =>
      set((state) => {
        state.creatorTemplates = templates;
      }),

    setIsLoadingCreator: (isLoading) =>
      set((state) => {
        state.isLoadingCreator = isLoading;
      }),

    toggleFollow: (userId, following) =>
      set((state) => {
        if (state.currentCreator?.id === userId) {
          state.currentCreator.isFollowing = following;
          state.currentCreator.followerCount += following ? 1 : -1;
        }
        // Update author in current template
        if (state.currentTemplate?.project?.user?.id === userId) {
          state.currentTemplate.project.user.followerCount += following ? 1 : -1;
        }
      }),

    openPublishModal: (projectId) =>
      set((state) => {
        state.isPublishModalOpen = true;
        state.publishingProjectId = projectId;
      }),

    closePublishModal: () =>
      set((state) => {
        state.isPublishModalOpen = false;
        state.publishingProjectId = null;
      }),

    // Fetch actions
    fetchTemplates: async (reset = false) => {
      const { filters, pagination, isLoading } = get();
      if (isLoading) return;

      set((state) => {
        state.isLoading = true;
        state.error = null;
        if (reset) {
          state.templates = [];
          state.pagination.page = 1;
        }
      });

      try {
        const params = new URLSearchParams();
        params.set("page", reset ? "1" : String(pagination.page));
        params.set("limit", String(pagination.limit));
        params.set("sort", filters.sort);
        params.set("type", filters.type);
        if (filters.category) params.set("category", filters.category);
        if (filters.search) params.set("search", filters.search);
        if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));

        const response = await fetch(`/api/community/templates?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch templates");
        }

        set((state) => {
          if (reset) {
            state.templates = data.templates;
          } else {
            state.templates.push(...data.templates);
          }
          state.pagination = data.pagination;
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Failed to fetch templates";
          state.isLoading = false;
        });
      }
    },

    fetchTemplate: async (slug) => {
      set((state) => {
        state.isLoadingTemplate = true;
        state.currentTemplate = null;
      });

      try {
        const response = await fetch(`/api/community/templates/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch template");
        }

        set((state) => {
          state.currentTemplate = data;
          state.isLoadingTemplate = false;
        });
      } catch (error) {
        set((state) => {
          state.isLoadingTemplate = false;
        });
        throw error;
      }
    },

    fetchCreator: async (userId) => {
      set((state) => {
        state.isLoadingCreator = true;
        state.currentCreator = null;
        state.creatorTemplates = [];
      });

      try {
        const [profileRes, templatesRes] = await Promise.all([
          fetch(`/api/community/creators/${userId}`),
          fetch(`/api/community/creators/${userId}/templates`),
        ]);

        const profile = await profileRes.json();
        const templates = await templatesRes.json();

        if (!profileRes.ok) {
          throw new Error(profile.error || "Failed to fetch creator");
        }

        set((state) => {
          state.currentCreator = profile;
          state.creatorTemplates = templates.templates || [];
          state.isLoadingCreator = false;
        });
      } catch (error) {
        set((state) => {
          state.isLoadingCreator = false;
        });
        throw error;
      }
    },

    likeTemplate: async (slug) => {
      try {
        const response = await fetch(`/api/community/templates/${slug}/like`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to like template");
        }

        get().toggleLike(slug, true);
      } catch (error) {
        throw error;
      }
    },

    unlikeTemplate: async (slug) => {
      try {
        const response = await fetch(`/api/community/templates/${slug}/like`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to unlike template");
        }

        get().toggleLike(slug, false);
      } catch (error) {
        throw error;
      }
    },

    followCreator: async (userId) => {
      try {
        const response = await fetch(`/api/community/creators/${userId}/follow`, {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to follow creator");
        }

        get().toggleFollow(userId, true);
      } catch (error) {
        throw error;
      }
    },

    unfollowCreator: async (userId) => {
      try {
        const response = await fetch(`/api/community/creators/${userId}/follow`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to unfollow creator");
        }

        get().toggleFollow(userId, false);
      } catch (error) {
        throw error;
      }
    },

    remixTemplate: async (slug) => {
      try {
        const response = await fetch(`/api/community/templates/${slug}/remix`, {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to remix template");
        }

        // Update remix count locally
        set((state) => {
          const template = state.templates.find((t) => t.slug === slug);
          if (template) {
            template.remixCount += 1;
          }
          if (state.currentTemplate?.slug === slug) {
            state.currentTemplate.remixCount += 1;
          }
        });

        return {
          newProjectId: data.newProjectId,
          redirectUrl: data.redirectUrl,
        };
      } catch (error) {
        throw error;
      }
    },
  }))
);
