"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
  Zap,
  Bug,
  Megaphone,
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

interface ChangelogEntry {
  id: string;
  version: string | null;
  title: string;
  description: string;
  type: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

const TYPES = [
  { value: "feature", label: "Feature", icon: Sparkles, color: "bg-violet-500" },
  { value: "improvement", label: "Improvement", icon: Zap, color: "bg-blue-500" },
  { value: "fix", label: "Bug Fix", icon: Bug, color: "bg-green-500" },
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "bg-yellow-500" },
];

export default function AdminChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    version: "",
    description: "",
    type: "feature",
    imageUrl: "",
    isPublished: false,
    publishedAt: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch("/api/admin/changelog");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Failed to fetch changelog entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          publishedAt: new Date(formData.publishedAt).toISOString(),
        }),
      });

      if (response.ok) {
        const newEntry = await response.json();
        setEntries((prev) => [newEntry, ...prev]);
        setIsCreateOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create entry");
      }
    } catch (error) {
      console.error("Failed to create entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEntry) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/changelog/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          publishedAt: new Date(formData.publishedAt).toISOString(),
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setEditingEntry(null);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update entry");
      }
    } catch (error) {
      console.error("Failed to update entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/changelog/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== deleteId));
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const handleTogglePublished = async (entry: ChangelogEntry) => {
    try {
      const response = await fetch(`/api/admin/changelog/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !entry.isPublished }),
      });

      if (response.ok) {
        const updated = await response.json();
        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      }
    } catch (error) {
      console.error("Failed to toggle entry:", error);
    }
  };

  const openEdit = (entry: ChangelogEntry) => {
    setFormData({
      title: entry.title,
      version: entry.version || "",
      description: entry.description,
      type: entry.type,
      imageUrl: entry.imageUrl || "",
      isPublished: entry.isPublished,
      publishedAt: new Date(entry.publishedAt).toISOString().split("T")[0],
    });
    setEditingEntry(entry);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      version: "",
      description: "",
      type: "feature",
      imageUrl: "",
      isPublished: false,
      publishedAt: new Date().toISOString().split("T")[0],
    });
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeConfig = (type: string) => {
    return TYPES.find((t) => t.value === type) || TYPES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
          <h1 className="text-2xl font-bold text-white">Changelog</h1>
          <p className="text-zinc-400">
            Manage changelog entries and updates
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-zinc-700 bg-zinc-800 text-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-800 bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Title
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Version
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Date
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
            {filteredEntries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-zinc-500"
                >
                  No entries found
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => {
                const typeConfig = getTypeConfig(entry.type);
                const TypeIcon = typeConfig.icon;
                return (
                  <tr key={entry.id} className="hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-white">
                          {entry.title}
                        </span>
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {entry.description.substring(0, 80)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${typeConfig.color} text-white`}>
                        <TypeIcon className="mr-1 h-3 w-3" />
                        {typeConfig.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {entry.version || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {formatDate(entry.publishedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublished(entry)}
                        className="flex items-center gap-1"
                      >
                        {entry.isPublished ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-zinc-500" />
                        )}
                        <span
                          className={
                            entry.isPublished
                              ? "text-green-500 text-sm"
                              : "text-zinc-500 text-sm"
                          }
                        >
                          {entry.isPublished ? "Published" : "Draft"}
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
                          <DropdownMenuItem onClick={() => openEdit(entry)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || !!editingEntry}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingEntry(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Entry" : "Create Entry"}
            </DialogTitle>
            <DialogDescription>
              {editingEntry
                ? "Update the changelog entry"
                : "Add a new changelog entry"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="What's new in this update"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version (optional)</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder="v1.2.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Date</Label>
                <Input
                  id="publishedAt"
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData({ ...formData, publishedAt: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Markdown)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the changes in detail..."
                className="min-h-[200px] font-mono text-sm"
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
                setEditingEntry(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingEntry ? handleUpdate : handleCreate}
              disabled={isSaving || !formData.title || !formData.description}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingEntry ? (
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
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this changelog entry? This action
              cannot be undone.
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
