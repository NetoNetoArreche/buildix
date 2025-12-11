"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Tutorial {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  videoUrl: string | null;
  thumbnail: string | null;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { value: "getting-started", label: "Getting Started" },
  { value: "prompts", label: "Prompts" },
  { value: "advanced", label: "Advanced" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "integrations", label: "Integrations" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminTutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    content: "",
    videoUrl: "",
    thumbnail: "",
    category: "getting-started",
    order: 0,
    isPublished: false,
  });

  useEffect(() => {
    fetchTutorials();
  }, []);

  const fetchTutorials = async () => {
    try {
      const response = await fetch("/api/admin/tutorials");
      if (response.ok) {
        const data = await response.json();
        setTutorials(data.tutorials);
      }
    } catch (error) {
      console.error("Failed to fetch tutorials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/tutorials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newTutorial = await response.json();
        setTutorials((prev) => [newTutorial, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create tutorial");
      }
    } catch (error) {
      console.error("Failed to create tutorial:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTutorial) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/tutorials/${editingTutorial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setTutorials((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        setEditingTutorial(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update tutorial");
      }
    } catch (error) {
      console.error("Failed to update tutorial:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/tutorials/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTutorials((prev) => prev.filter((t) => t.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete tutorial:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleTogglePublished = async (tutorial: Tutorial) => {
    try {
      const response = await fetch(`/api/admin/tutorials/${tutorial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !tutorial.isPublished }),
      });

      if (response.ok) {
        const updated = await response.json();
        setTutorials((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      }
    } catch (error) {
      console.error("Failed to toggle tutorial:", error);
    }
  };

  const openEdit = (tutorial: Tutorial) => {
    setFormData({
      title: tutorial.title,
      slug: tutorial.slug,
      description: tutorial.description || "",
      content: tutorial.content,
      videoUrl: tutorial.videoUrl || "",
      thumbnail: tutorial.thumbnail || "",
      category: tutorial.category,
      order: tutorial.order,
      isPublished: tutorial.isPublished,
    });
    setEditingTutorial(tutorial);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      content: "",
      videoUrl: "",
      thumbnail: "",
      category: "getting-started",
      order: 0,
      isPublished: false,
    });
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingTutorial ? formData.slug : slugify(title),
    });
  };

  const filteredTutorials = tutorials.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tutorials</h1>
          <p className="text-zinc-400">
            Manage tutorials for the Learn page
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Tutorial
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search tutorials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-zinc-700 bg-zinc-800 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tutorials Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Order
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Video
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredTutorials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No tutorials found
                </td>
              </tr>
            ) : (
              filteredTutorials.map((tutorial) => (
                <tr key={tutorial.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-white">
                        {tutorial.title}
                      </span>
                      <p className="text-xs text-zinc-500">/{tutorial.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className="bg-zinc-700 text-zinc-300"
                    >
                      {getCategoryLabel(tutorial.category)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {tutorial.order}
                  </td>
                  <td className="px-4 py-3">
                    {tutorial.videoUrl ? (
                      <Video className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePublished(tutorial)}
                      className="flex items-center gap-1"
                    >
                      {tutorial.isPublished ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-zinc-500" />
                      )}
                      <span
                        className={
                          tutorial.isPublished
                            ? "text-green-500 text-sm"
                            : "text-zinc-500 text-sm"
                        }
                      >
                        {tutorial.isPublished ? "Published" : "Draft"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            window.open(`/learn/${tutorial.slug}`, "_blank")
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(tutorial)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => setDeleteId(tutorial.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingTutorial}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTutorial(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTutorial ? "Edit Tutorial" : "Create Tutorial"}
            </DialogTitle>
            <DialogDescription>
              {editingTutorial
                ? "Update the tutorial details"
                : "Add a new tutorial to the Learn page"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Tutorial title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="tutorial-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of the tutorial"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL (YouTube/Vimeo embed)</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                <Input
                  id="thumbnail"
                  value={formData.thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="# Tutorial content in Markdown..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
              <Label htmlFor="isPublished">Published</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingTutorial(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingTutorial ? handleUpdate : handleCreate}
              disabled={isSaving || !formData.title || !formData.slug || !formData.content}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingTutorial ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tutorial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tutorial? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
