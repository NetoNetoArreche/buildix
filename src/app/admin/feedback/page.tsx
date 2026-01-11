"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  MessageSquare,
  Bug,
  Sparkles,
  TrendingUp,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type FeedbackCategory = "bug" | "feature" | "improvement" | "other";
type FeedbackStatus = "open" | "in_review" | "planned" | "completed" | "rejected";

interface FeedbackUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Feedback {
  id: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: FeedbackUser;
}

interface Stats {
  total: number;
  open: number;
  in_review: number;
  planned: number;
  completed: number;
  rejected: number;
}

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug", icon: <Bug className="h-4 w-4" />, color: "text-red-400" },
  feature: { label: "Feature", icon: <Sparkles className="h-4 w-4" />, color: "text-purple-400" },
  improvement: { label: "Melhoria", icon: <TrendingUp className="h-4 w-4" />, color: "text-blue-400" },
  other: { label: "Outro", icon: <MessageCircle className="h-4 w-4" />, color: "text-zinc-400" },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; bgColor: string }> = {
  open: { label: "Aberto", color: "text-zinc-300", bgColor: "bg-zinc-700" },
  in_review: { label: "Em Analise", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  planned: { label: "Planejado", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  completed: { label: "Concluido", color: "text-green-400", bgColor: "bg-green-500/20" },
  rejected: { label: "Rejeitado", color: "text-red-400", bgColor: "bg-red-500/20" },
};

const STATUSES: { value: FeedbackStatus; label: string }[] = [
  { value: "open", label: "Aberto" },
  { value: "in_review", label: "Em Analise" },
  { value: "planned", label: "Planejado" },
  { value: "completed", label: "Concluido" },
  { value: "rejected", label: "Rejeitado" },
];

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for edit
  const [formData, setFormData] = useState({
    status: "open" as FeedbackStatus,
    adminNotes: "",
  });

  useEffect(() => {
    fetchFeedbacks();
  }, [categoryFilter, statusFilter]);

  const fetchFeedbacks = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setIsLoading(true);
    fetchFeedbacks();
  };

  const handleUpdate = async () => {
    if (!viewingFeedback) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/feedback/${viewingFeedback.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setFeedbacks((prev) =>
          prev.map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
        );
        setViewingFeedback(null);
      }
    } catch (error) {
      console.error("Failed to update feedback:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/feedback/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFeedbacks((prev) => prev.filter((f) => f.id !== deleteId));
        if (stats) {
          setStats({ ...stats, total: stats.total - 1 });
        }
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    } finally {
      setDeleteId(null);
    }
  };

  const openView = (feedback: Feedback) => {
    setFormData({
      status: feedback.status,
      adminNotes: feedback.adminNotes || "",
    });
    setViewingFeedback(feedback);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      feedback.title.toLowerCase().includes(query) ||
      feedback.description.toLowerCase().includes(query) ||
      feedback.user.email.toLowerCase().includes(query) ||
      feedback.user.name?.toLowerCase().includes(query)
    );
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
          <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
          <p className="text-zinc-400">Gerencie feedbacks e sugestoes dos usuarios</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <MessageSquare className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-zinc-400">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-500/20 p-2">
                <Clock className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.open}</p>
                <p className="text-sm text-zinc-400">Abertos</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.in_review}</p>
                <p className="text-sm text-zinc-400">Em Analise</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.planned}</p>
                <p className="text-sm text-zinc-400">Planejados</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-sm text-zinc-400">Concluidos</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/20 p-2">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                <p className="text-sm text-zinc-400">Rejeitados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar por titulo, descricao ou usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 border-zinc-700 bg-zinc-800 text-white"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="improvement">Melhoria</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feedbacks Table */}
      {filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
          <p>Nenhum feedback encontrado</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400">Usuario</TableHead>
                <TableHead className="text-zinc-400">Categoria</TableHead>
                <TableHead className="text-zinc-400">Titulo</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeedbacks.map((feedback) => {
                const categoryConfig = CATEGORY_CONFIG[feedback.category];
                const statusConfig = STATUS_CONFIG[feedback.status];

                return (
                  <TableRow
                    key={feedback.id}
                    className="border-zinc-700 hover:bg-zinc-700/30 cursor-pointer"
                    onClick={() => openView(feedback)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={feedback.user.avatar || undefined} />
                          <AvatarFallback className="bg-violet-600 text-white text-xs">
                            {getInitials(feedback.user.name, feedback.user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {feedback.user.name || "Sem nome"}
                          </p>
                          <p className="text-xs text-zinc-400">{feedback.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${categoryConfig.color}`}>
                        {categoryConfig.icon}
                        <span className="text-sm">{categoryConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-white text-sm line-clamp-1 max-w-[300px]">
                        {feedback.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(feedback.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openView(feedback)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(feedback.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View/Edit Dialog */}
      <Dialog
        open={!!viewingFeedback}
        onOpenChange={(open) => {
          if (!open) setViewingFeedback(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Feedback</DialogTitle>
            <DialogDescription>
              Visualize e atualize o status do feedback
            </DialogDescription>
          </DialogHeader>

          {viewingFeedback && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={viewingFeedback.user.avatar || undefined} />
                  <AvatarFallback className="bg-violet-600 text-white">
                    {getInitials(viewingFeedback.user.name, viewingFeedback.user.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">
                    {viewingFeedback.user.name || "Sem nome"}
                  </p>
                  <p className="text-sm text-zinc-400">{viewingFeedback.user.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-zinc-400">Enviado em</p>
                  <p className="text-sm text-zinc-300">{formatDate(viewingFeedback.createdAt)}</p>
                </div>
              </div>

              {/* Category & Title */}
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${CATEGORY_CONFIG[viewingFeedback.category].color}`}>
                  {CATEGORY_CONFIG[viewingFeedback.category].icon}
                  <span className="text-sm font-medium">
                    {CATEGORY_CONFIG[viewingFeedback.category].label}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{viewingFeedback.title}</h3>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Descricao</Label>
                <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-zinc-300 whitespace-pre-wrap">{viewingFeedback.description}</p>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as FeedbackStatus })}
                >
                  <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Notas do Admin (interno)</Label>
                <Textarea
                  id="adminNotes"
                  value={formData.adminNotes}
                  onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                  placeholder="Adicione notas internas sobre este feedback..."
                  rows={3}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingFeedback(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alteracoes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este feedback? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
