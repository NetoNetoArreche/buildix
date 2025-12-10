"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectPreviewIframe } from "@/components/ui/project-preview-iframe";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  pages: { id: string; htmlContent?: string }[];
}

export default function ProjectsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renameProject, setRenameProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewProject = () => {
    router.push("/editor/new");
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteProjectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteProjectId));
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
      setDeleteProjectId(null);
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${project.name} (Copy)`,
          description: project.description,
          sourceProjectId: project.id, // Copy all pages from source project
        }),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects((prev) => [newProject, ...prev]);
      }
    } catch (error) {
      console.error("Failed to duplicate project:", error);
    }
  };

  const handleRenameProject = async () => {
    if (!renameProject || !newProjectName.trim()) return;

    setIsRenaming(true);
    try {
      const response = await fetch(`/api/projects/${renameProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === updatedProject.id ? { ...p, name: updatedProject.name } : p))
        );
      }
    } catch (error) {
      console.error("Failed to rename project:", error);
    } finally {
      setIsRenaming(false);
      setRenameProject(null);
      setNewProjectName("");
    }
  };

  const openRenameDialog = (project: Project) => {
    setRenameProject(project);
    setNewProjectName(project.name);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and organize your landing pages
          </p>
        </div>
        <Button variant="buildix" onClick={handleNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-medium">No projects found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Create your first project to get started"}
          </p>
          {!searchQuery && (
            <Button variant="buildix" onClick={handleNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              formatDate={formatDate}
              onDelete={() => setDeleteProjectId(project.id)}
              onDuplicate={() => handleDuplicateProject(project)}
              onRename={() => openRenameDialog(project)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              formatDate={formatDate}
              onDelete={() => setDeleteProjectId(project.id)}
              onDuplicate={() => handleDuplicateProject(project)}
              onRename={() => openRenameDialog(project)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone
              and will permanently delete all pages and chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <AlertDialog open={!!renameProject} onOpenChange={() => setRenameProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Project</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for your project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name"
            className="mt-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isRenaming) {
                handleRenameProject();
              }
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRenaming}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenameProject}
              disabled={isRenaming || !newProjectName.trim()}
            >
              {isRenaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  formatDate: (date: string) => string;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: () => void;
}

function ProjectCard({ project, formatDate, onDelete, onDuplicate, onRename }: ProjectCardProps) {
  // Get HTML content from first page for live preview
  const pageHtml = project.pages?.[0]?.htmlContent;

  return (
    <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:border-[hsl(var(--buildix-primary))]/50 hover:shadow-md">
      <a href={`/editor/${project.id}`} className="block">
        <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden relative">
          {/* Dynamic preview (always visible if HTML exists) */}
          {pageHtml ? (
            <div className="absolute inset-0 bg-white">
              <ProjectPreviewIframe
                html={pageHtml}
                className="w-full h-full"
              />
            </div>
          ) : project.thumbnail ? (
            <img
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
      </a>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <a href={`/editor/${project.id}`}>
              <h3 className="font-medium truncate hover:text-[hsl(var(--buildix-primary))]">
                {project.name}
              </h3>
            </a>
            <p className="text-sm text-muted-foreground truncate">
              {project.pages?.length || 0} page{(project.pages?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <ProjectMenu
            project={project}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onRename={onRename}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            Draft
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(project.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectListItem({ project, formatDate, onDelete, onDuplicate, onRename }: ProjectCardProps) {
  // Get HTML content from first page for live preview
  const pageHtml = project.pages?.[0]?.htmlContent;

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:border-[hsl(var(--buildix-primary))]/50">
      <a href={`/editor/${project.id}`} className="h-16 w-24 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
        {/* Dynamic preview (always visible if HTML exists) */}
        {pageHtml ? (
          <div className="absolute inset-0 bg-white">
            <ProjectPreviewIframe
              html={pageHtml}
              className="w-full h-full"
            />
          </div>
        ) : project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
        )}
      </a>
      <div className="min-w-0 flex-1">
        <a href={`/editor/${project.id}`}>
          <h3 className="font-medium truncate hover:text-[hsl(var(--buildix-primary))]">
            {project.name}
          </h3>
        </a>
        <p className="text-sm text-muted-foreground truncate">
          {project.description || "No description"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {project.pages?.length || 0} page{(project.pages?.length || 0) !== 1 ? "s" : ""}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
          Draft
        </span>
        <span className="text-sm text-muted-foreground">{formatDate(project.updatedAt)}</span>
        <ProjectMenu
          project={project}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onRename={onRename}
        />
      </div>
    </div>
  );
}

interface ProjectMenuProps {
  project: Project;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: () => void;
}

function ProjectMenu({ project, onDelete, onDuplicate, onRename }: ProjectMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/editor/${project.id}`)}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
