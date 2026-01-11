"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Plus,
  Bug,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Trash2,
  Clock,
  Filter,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { FeedbackModal } from "@/components/feedback";
import { cn } from "@/lib/utils";

type FeedbackCategory = "bug" | "feature" | "improvement" | "other";

// Simple date formatting function
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `ha ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
  if (diffHours < 24) return `ha ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays < 7) return `ha ${diffDays} dia${diffDays > 1 ? "s" : ""}`;
  if (diffDays < 30) return `ha ${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? "s" : ""}`;
  return `ha ${Math.floor(diffDays / 30)} mes${diffDays >= 60 ? "es" : ""}`;
}

type FeedbackStatus = "open" | "in_review" | "planned" | "completed" | "rejected";

interface Feedback {
  id: string;
  category: FeedbackCategory;
  title: string;
  description: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_CONFIG: Record<
  FeedbackCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  bug: {
    label: "Bug",
    icon: <Bug className="h-4 w-4" />,
    color: "text-red-500",
  },
  feature: {
    label: "Nova Funcionalidade",
    icon: <Sparkles className="h-4 w-4" />,
    color: "text-purple-500",
  },
  improvement: {
    label: "Melhoria",
    icon: <TrendingUp className="h-4 w-4" />,
    color: "text-blue-500",
  },
  other: {
    label: "Outro",
    icon: <MessageCircle className="h-4 w-4" />,
    color: "text-gray-500",
  },
};

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  open: { label: "Aberto", variant: "secondary" },
  in_review: { label: "Em Analise", variant: "default" },
  planned: { label: "Planejado", variant: "outline" },
  completed: { label: "Concluido", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
};

export default function FeedbackPage() {
  const { status: sessionStatus } = useSession();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchFeedbacks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch feedbacks");

      const data = await response.json();
      setFeedbacks(data.feedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchFeedbacks();
    }
  }, [sessionStatus, fetchFeedbacks]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/feedback/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setFeedbacks((prev) => prev.filter((f) => f.id !== deleteId));
    } catch (error) {
      console.error("Error deleting feedback:", error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Feedback & Sugestoes
          </h1>
          <p className="text-muted-foreground mt-1">
            Envie suas ideias, reporte bugs ou sugira melhorias
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Feedback
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros:</span>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="feature">Nova Funcionalidade</SelectItem>
            <SelectItem value="improvement">Melhoria</SelectItem>
            <SelectItem value="other">Outro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_review">Em Analise</SelectItem>
            <SelectItem value="planned">Planejado</SelectItem>
            <SelectItem value="completed">Concluido</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum feedback ainda</h3>
            <p className="text-muted-foreground text-center mb-4">
              Voce ainda nao enviou nenhum feedback. Compartilhe suas ideias conosco!
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Enviar Primeiro Feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const categoryConfig = CATEGORY_CONFIG[feedback.category];
            const statusConfig = STATUS_CONFIG[feedback.status];

            return (
              <Card key={feedback.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(categoryConfig.color)}>
                        {categoryConfig.icon}
                      </span>
                      <CardTitle className="text-base">{feedback.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(feedback.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {feedback.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(feedback.createdAt)}
                    </div>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{categoryConfig.label}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={fetchFeedbacks}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Feedback</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este feedback? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
