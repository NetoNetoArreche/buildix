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
  Copy,
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

interface CodeSnippet {
  id: string;
  name: string;
  description: string | null;
  category: string;
  code: string;
  tags: string[];
  charCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = ["css", "js", "html", "mixed"];

export default function AdminSnippetsPage() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewSnippet, setPreviewSnippet] = useState<CodeSnippet | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "css",
    code: "",
    tags: "",
  });

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      const response = await fetch("/api/admin/snippets");
      if (response.ok) {
        const data = await response.json();
        setSnippets(data.snippets);
      }
    } catch (error) {
      console.error("Failed to fetch snippets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const newSnippet = await response.json();
        setSnippets((prev) => [newSnippet, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to create snippet:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingSnippet) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/snippets/${editingSnippet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSnippets((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        setEditingSnippet(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to update snippet:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/snippets/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSnippets((prev) => prev.filter((s) => s.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete snippet:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (snippet: CodeSnippet) => {
    try {
      const response = await fetch(`/api/admin/snippets/${snippet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !snippet.isActive }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSnippets((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
      }
    } catch (error) {
      console.error("Failed to toggle snippet:", error);
    }
  };

  const openEdit = (snippet: CodeSnippet) => {
    setFormData({
      name: snippet.name,
      description: snippet.description || "",
      category: snippet.category,
      code: snippet.code,
      tags: snippet.tags.join(", "),
    });
    setEditingSnippet(snippet);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "css",
      code: "",
      tags: "",
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleSeedSnippets = async () => {
    if (!confirm("Import all static code snippets to the database? Existing snippets will be skipped.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/snippets/seed", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Imported: ${data.summary.created} created, ${data.summary.skipped} skipped`);
        fetchSnippets();
      }
    } catch (error) {
      console.error("Failed to seed snippets:", error);
    }
  };

  const filteredSnippets = snippets.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "css":
        return "bg-blue-600";
      case "js":
        return "bg-yellow-600";
      case "html":
        return "bg-orange-600";
      case "mixed":
        return "bg-purple-600";
      default:
        return "bg-zinc-600";
    }
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
          <h1 className="text-2xl font-bold text-white">Code Snippets</h1>
          <p className="text-zinc-400">
            Manage code snippets available in the editor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSeedSnippets}
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Import Static Snippets
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Snippet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search snippets..."
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
              <SelectItem key={cat} value={cat}>
                {cat.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Snippets Table */}
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
            {filteredSnippets.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No snippets found
                </td>
              </tr>
            ) : (
              filteredSnippets.map((snippet) => (
                <tr key={snippet.id} className="hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {snippet.name}
                      </span>
                    </div>
                    {snippet.description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">
                        {snippet.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${getCategoryColor(snippet.category)} text-white`}>
                      {snippet.category.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {snippet.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                          {tag}
                        </Badge>
                      ))}
                      {snippet.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                          +{snippet.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(snippet)}
                      className="flex items-center gap-1"
                    >
                      {snippet.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-zinc-500" />
                      )}
                      <span
                        className={
                          snippet.isActive ? "text-green-500 text-sm" : "text-zinc-500 text-sm"
                        }
                      >
                        {snippet.isActive ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {snippet.charCount.toLocaleString()}
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
                        <DropdownMenuItem onClick={() => setPreviewSnippet(snippet)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyToClipboard(snippet.code)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(snippet)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => setDeleteId(snippet.id)}
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
        open={isCreateOpen || !!editingSnippet}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingSnippet(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSnippet ? "Edit Snippet" : "Create Snippet"}
            </DialogTitle>
            <DialogDescription>
              {editingSnippet
                ? "Update the code snippet details"
                : "Add a new code snippet to the library"}
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
                  placeholder="Snippet name"
                />
              </div>
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
                      <SelectItem key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                placeholder="Brief description of the snippet"
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
                placeholder="animation, utility, layout"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Textarea
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="/* Your code here */"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingSnippet(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingSnippet ? handleUpdate : handleCreate}
              disabled={isSaving || !formData.name || !formData.code}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingSnippet ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewSnippet} onOpenChange={() => setPreviewSnippet(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewSnippet?.name}
              <Badge className={`${getCategoryColor(previewSnippet?.category || "")} text-white`}>
                {previewSnippet?.category?.toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>{previewSnippet?.description}</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(previewSnippet?.code || "")}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <pre className="bg-zinc-950 p-4 rounded-lg overflow-auto max-h-[500px] text-sm">
              <code className="text-zinc-300">{previewSnippet?.code}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snippet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this snippet? This action cannot be undone.
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
