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
  Crown,
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

interface UIComponent {
  id: string;
  name: string;
  description: string | null;
  category: string;
  code: string;
  tags: string[];
  charCount: number;
  isPro: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ComponentCategory {
  id: string;
  slug: string;
  name: string;
  isDefault: boolean;
}

export default function AdminComponentsPage() {
  const [components, setComponents] = useState<UIComponent[]>([]);
  const [categories, setCategories] = useState<ComponentCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<UIComponent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewComponent, setPreviewComponent] = useState<UIComponent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "hero",
    code: "",
    tags: "",
    isPro: false,
  });

  useEffect(() => {
    fetchComponents();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/component-categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchComponents = async () => {
    try {
      const response = await fetch("/api/admin/components");
      if (response.ok) {
        const data = await response.json();
        setComponents(data.components);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const newComponent = await response.json();
        setComponents((prev) => [newComponent, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create component:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingComponent) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/components/${editingComponent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setComponents((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
        setEditingComponent(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to update component:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/components/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComponents((prev) => prev.filter((c) => c.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete component:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (component: UIComponent) => {
    try {
      const response = await fetch(`/api/admin/components/${component.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !component.isActive }),
      });

      if (response.ok) {
        const updated = await response.json();
        setComponents((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      }
    } catch (error) {
      console.error("Failed to toggle component:", error);
    }
  };

  const openEdit = (component: UIComponent) => {
    setFormData({
      name: component.name,
      description: component.description || "",
      category: component.category,
      code: component.code,
      tags: component.tags.join(", "),
      isPro: component.isPro,
    });
    setEditingComponent(component);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "hero",
      code: "",
      tags: "",
      isPro: false,
    });
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      const response = await fetch("/api/admin/component-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories((prev) => [...prev, newCategory]);
        setFormData({ ...formData, category: newCategory.slug });
        setIsAddingCategory(false);
        setNewCategoryName("");
      } else if (response.status === 409) {
        // Category already exists
        const data = await response.json();
        setFormData({ ...formData, category: data.category.slug });
        setIsAddingCategory(false);
        setNewCategoryName("");
      } else {
        console.error("Failed to create category");
      }
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const filteredComponents = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-2xl font-bold text-white">UI Components</h1>
          <p className="text-zinc-400">
            Manage UI components available in the editor
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search components..."
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
            {categories.map((cat) => (
              <SelectItem key={cat.slug} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Components Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Tags
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Chars
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredComponents.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No components found
                </td>
              </tr>
            ) : (
              filteredComponents.map((component) => (
                <tr key={component.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {component.name}
                      </span>
                      {component.isPro && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    {component.description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {component.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                      {component.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {component.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                          {tag}
                        </Badge>
                      ))}
                      {component.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                          +{component.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(component)}
                      className="flex items-center gap-1"
                    >
                      {component.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-zinc-500" />
                      )}
                      <span
                        className={
                          component.isActive ? "text-green-500 text-sm" : "text-zinc-500 text-sm"
                        }
                      >
                        {component.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {component.charCount.toLocaleString()}
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
                        <DropdownMenuItem onClick={() => setPreviewComponent(component)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(component)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => setDeleteId(component.id)}
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
        open={isCreateOpen || !!editingComponent}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingComponent(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? "Edit Component" : "Create Component"}
            </DialogTitle>
            <DialogDescription>
              {editingComponent
                ? "Update the component details"
                : "Add a new UI component to the library"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Component name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                      autoFocus
                      disabled={isSavingCategory}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      disabled={!newCategoryName.trim() || isSavingCategory}
                    >
                      {isSavingCategory ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName("");
                      }}
                      disabled={isSavingCategory}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setIsAddingCategory(true);
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="__add_new__" className="text-violet-500 font-medium">
                        + Add new category...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                placeholder="Brief description of the component"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="modern, dark, gradient"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">HTML Code</Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="<section>...</section>"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isPro"
                checked={formData.isPro}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPro: checked })
                }
              />
              <Label htmlFor="isPro">Pro Component (premium users only)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingComponent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingComponent ? handleUpdate : handleCreate}
              disabled={isSaving || !formData.name || !formData.code}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingComponent ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewComponent} onOpenChange={() => setPreviewComponent(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewComponent?.name}</DialogTitle>
            <DialogDescription>{previewComponent?.description}</DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>body { margin: 0; }</style>
                  </head>
                  <body>${previewComponent?.code || ""}</body>
                </html>
              `}
              className="w-full h-[500px]"
              sandbox="allow-scripts"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this component? This action cannot be undone.
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
