"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCommunityStore } from "@/stores/communityStore";
import type { TemplateDetail } from "@/types/community";
import {
  Heart,
  Eye,
  GitFork,
  Crown,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Copy,
  Share2,
  UserPlus,
  UserMinus,
  Loader2,
  Send,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface TemplatePageProps {
  params: Promise<{ slug: string }>;
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const {
    currentTemplate,
    isLoadingTemplate,
    fetchTemplate,
    likeTemplate,
    unlikeTemplate,
    remixTemplate,
    followCreator,
    unfollowCreator,
  } = useCommunityStore();

  const [isLiking, setIsLiking] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [localComments, setLocalComments] = useState<TemplateDetail["comments"]>([]);
  const [activeTab, setActiveTab] = useState<"preview" | "pages">("preview");
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  // Local state for optimistic updates
  const [localLiked, setLocalLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localFollowing, setLocalFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState(0);

  // Fetch template on mount
  useEffect(() => {
    fetchTemplate(resolvedParams.slug).catch(console.error);
  }, [resolvedParams.slug, fetchTemplate]);

  // Sync local state when template loads
  useEffect(() => {
    if (currentTemplate) {
      setLocalLiked(currentTemplate.isLiked || false);
      setLocalLikeCount(currentTemplate.likeCount);
      setLocalComments(currentTemplate.comments || []);
      if (currentTemplate.project?.user) {
        setLocalFollowerCount(currentTemplate.project.user.followerCount);
      }
    }
  }, [currentTemplate]);

  const handleLike = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    try {
      if (localLiked) {
        await unlikeTemplate(resolvedParams.slug);
        setLocalLiked(false);
        setLocalLikeCount((prev) => prev - 1);
      } else {
        await likeTemplate(resolvedParams.slug);
        setLocalLiked(true);
        setLocalLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRemix = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (isRemixing || !currentTemplate?.allowRemix) return;

    setIsRemixing(true);
    try {
      const result = await remixTemplate(resolvedParams.slug);
      if (result) {
        router.push(result.redirectUrl);
      }
    } catch (error) {
      console.error("Failed to remix:", error);
      alert(error instanceof Error ? error.message : "Failed to remix template");
    } finally {
      setIsRemixing(false);
    }
  };

  const handleFollow = async () => {
    if (!session?.user || !currentTemplate?.project?.user) {
      router.push("/login");
      return;
    }
    if (isFollowing) return;

    const userId = currentTemplate.project.user.id;
    setIsFollowing(true);
    try {
      if (localFollowing) {
        await unfollowCreator(userId);
        setLocalFollowing(false);
        setLocalFollowerCount((prev) => prev - 1);
      } else {
        await followCreator(userId);
        setLocalFollowing(true);
        setLocalFollowerCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsFollowing(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!session?.user || !commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(
        `/api/community/templates/${resolvedParams.slug}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: commentContent.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add comment");
      }

      const { comment } = await response.json();
      setLocalComments((prev) => [comment, ...prev]);
      setCommentContent("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      alert(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (isLoadingTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-2xl font-bold mb-2">Template Not Found</h1>
        <p className="text-muted-foreground mb-4">
          This template may have been removed or unpublished.
        </p>
        <Button onClick={() => router.push("/community")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </Button>
      </div>
    );
  }

  const author = currentTemplate.project?.user;
  const authorName = author?.displayName || author?.name || "Anonymous";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const pages = currentTemplate.project?.pages || [];
  const selectedPage = pages[selectedPageIndex];

  // Handle back navigation with fallback
  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to community page if no history
      router.push("/community");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              {currentTemplate.isPro && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Crown className="mr-1 h-3 w-3" />
                  PRO
                </Badge>
              )}
              {currentTemplate.isOfficial && (
                <Badge className="bg-gradient-to-r from-blue-500 to-violet-500 text-white border-0">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Official
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyUrl}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant={localLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={localLiked ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${localLiked ? "fill-current" : ""}`} />
              {localLikeCount}
            </Button>
            {currentTemplate.allowRemix && (
              <Button onClick={handleRemix} disabled={isRemixing}>
                {isRemixing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <GitFork className="h-4 w-4 mr-2" />
                )}
                Remix
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview */}
            <div className="rounded-xl border bg-card overflow-hidden">
              {/* Tabs */}
              <div className="border-b p-2 flex gap-2">
                <Button
                  variant={activeTab === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("preview")}
                >
                  Preview
                </Button>
                {pages.length > 1 && (
                  <Button
                    variant={activeTab === "pages" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("pages")}
                  >
                    Pages ({pages.length})
                  </Button>
                )}
              </div>

              {/* Page Selector */}
              {activeTab === "pages" && pages.length > 1 && (
                <div className="border-b p-2 flex gap-2 overflow-x-auto">
                  {pages.map((page, index) => (
                    <Button
                      key={page.id}
                      variant={selectedPageIndex === index ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedPageIndex(index)}
                      className="shrink-0"
                    >
                      {page.name}
                      {page.isHome && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Home
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}

              {/* Preview Frame */}
              <div className="aspect-video bg-white relative overflow-hidden">
                {selectedPage ? (
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body { margin: 0; transform-origin: 0 0; transform: scale(0.5); width: 200%; height: 200%; }
                            ${selectedPage.cssContent || ""}
                          </style>
                        </head>
                        <body>${selectedPage.htmlContent}</body>
                      </html>
                    `}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{currentTemplate.viewCount} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{localLikeCount} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4" />
                <span>{currentTemplate.remixCount} remixes</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(currentTemplate.publishedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({localComments.length})
                </h2>
              </div>

              {/* Comment Form */}
              {session?.user ? (
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={2}
                    maxLength={1000}
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="shrink-0"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to leave a comment
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {localComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  localComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar || undefined} />
                        <AvatarFallback>
                          {(comment.user.displayName || comment.user.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.user.displayName || comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <h1 className="text-2xl font-bold">{currentTemplate.title}</h1>
              <Badge variant="secondary" className="capitalize">
                {currentTemplate.category}
              </Badge>
              {currentTemplate.description && (
                <p className="text-muted-foreground">
                  {currentTemplate.description}
                </p>
              )}
              {currentTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Author Card */}
            {author && (
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={author.avatar || undefined} />
                    <AvatarFallback className="text-lg">{authorInitial}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{authorName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {localFollowerCount} followers
                    </p>
                  </div>
                </div>

                {author.bio && (
                  <p className="text-sm text-muted-foreground">{author.bio}</p>
                )}

                {session?.user?.id !== author.id && (
                  <Button
                    variant={localFollowing ? "outline" : "default"}
                    className="w-full"
                    onClick={handleFollow}
                    disabled={isFollowing}
                  >
                    {isFollowing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : localFollowing ? (
                      <UserMinus className="h-4 w-4 mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {localFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="rounded-xl border bg-card p-6 space-y-3">
              {currentTemplate.allowRemix && (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRemix}
                  disabled={isRemixing}
                >
                  {isRemixing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <GitFork className="h-4 w-4 mr-2" />
                  )}
                  Remix This Template
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(`/preview/${currentTemplate.project?.id}`, "_blank")}
                disabled={!currentTemplate.project?.id}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Full Preview
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCopyUrl}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
