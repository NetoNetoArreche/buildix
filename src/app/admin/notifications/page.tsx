"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  Bell,
  Megaphone,
  History,
  MessageSquare,
  Settings,
  MoreHorizontal,
  Trash2,
  Eye,
  Plus,
  Send,
  Users,
  User,
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

type NotificationType = "changelog" | "admin_notice" | "feedback_reply" | "system";

interface NotificationUser {
  id: string;
  name: string | null;
  email: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isGlobal: boolean;
  userId: string | null;
  user: NotificationUser | null;
  readCount: number;
  createdAt: string;
}

interface Stats {
  total: number;
  changelog: number;
  admin_notice: number;
  feedback_reply: number;
  system: number;
}

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: React.ReactNode; color: string }> = {
  changelog: { label: "Changelog", icon: <History className="h-4 w-4" />, color: "text-blue-400" },
  admin_notice: { label: "Aviso Admin", icon: <Megaphone className="h-4 w-4" />, color: "text-yellow-400" },
  feedback_reply: { label: "Resposta Feedback", icon: <MessageSquare className="h-4 w-4" />, color: "text-green-400" },
  system: { label: "Sistema", icon: <Settings className="h-4 w-4" />, color: "text-zinc-400" },
};

const TYPES: { value: NotificationType; label: string }[] = [
  { value: "changelog", label: "Changelog" },
  { value: "admin_notice", label: "Aviso Admin" },
  { value: "feedback_reply", label: "Resposta Feedback" },
  { value: "system", label: "Sistema" },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewingNotification, setViewingNotification] = useState<Notification | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for create
  const [formData, setFormData] = useState({
    type: "admin_notice" as NotificationType,
    title: "",
    message: "",
    link: "",
    isGlobal: true,
  });

  useEffect(() => {
    fetchNotifications();
  }, [typeFilter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.message) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          link: formData.link || null,
        }),
      });

      if (response.ok) {
        const newNotification = await response.json();
        setNotifications((prev) => [
          { ...newNotification, readCount: 0, user: null },
          ...prev,
        ]);
        setIsCreateOpen(false);
        setFormData({
          type: "admin_notice",
          title: "",
          message: "",
          link: "",
          isGlobal: true,
        });
        if (stats) {
          setStats({
            ...stats,
            total: stats.total + 1,
            [formData.type]: stats[formData.type] + 1,
          });
        }
      }
    } catch (error) {
      console.error("Failed to create notification:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/notifications/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== deleteId));
        if (stats) {
          setStats({ ...stats, total: stats.total - 1 });
        }
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeleteId(null);
    }
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

  const filteredNotifications = notifications.filter((notification) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query)
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
          <h1 className="text-2xl font-bold text-white">Notificacoes</h1>
          <p className="text-zinc-400">Envie avisos e notificacoes para os usuarios</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Notificacao
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/20 p-2">
                <Bell className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-zinc-400">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <History className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.changelog}</p>
                <p className="text-sm text-zinc-400">Changelog</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <Megaphone className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.admin_notice}</p>
                <p className="text-sm text-zinc-400">Avisos</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.feedback_reply}</p>
                <p className="text-sm text-zinc-400">Respostas</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-500/20 p-2">
                <Settings className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.system}</p>
                <p className="text-sm text-zinc-400">Sistema</p>
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
            placeholder="Buscar notificacoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-zinc-700 bg-zinc-800 text-white"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notifications Table */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Bell className="h-12 w-12 mb-4 opacity-50" />
          <p>Nenhuma notificacao encontrada</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400">Tipo</TableHead>
                <TableHead className="text-zinc-400">Titulo</TableHead>
                <TableHead className="text-zinc-400">Destinatario</TableHead>
                <TableHead className="text-zinc-400">Leituras</TableHead>
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => {
                const typeConfig = TYPE_CONFIG[notification.type];

                return (
                  <TableRow
                    key={notification.id}
                    className="border-zinc-700 hover:bg-zinc-700/30 cursor-pointer"
                    onClick={() => setViewingNotification(notification)}
                  >
                    <TableCell>
                      <div className={`flex items-center gap-2 ${typeConfig.color}`}>
                        {typeConfig.icon}
                        <span className="text-sm">{typeConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-white text-sm line-clamp-1 max-w-[300px]">
                        {notification.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      {notification.isGlobal ? (
                        <div className="flex items-center gap-2 text-violet-400">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">Todos</span>
                        </div>
                      ) : notification.user ? (
                        <div className="flex items-center gap-2 text-zinc-300">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{notification.user.name || notification.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                        {notification.readCount} leituras
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {formatDate(notification.createdAt)}
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
                          <DropdownMenuItem onClick={() => setViewingNotification(notification)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(notification.id);
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Notificacao</DialogTitle>
            <DialogDescription>
              Envie uma notificacao para todos os usuarios ou um usuario especifico
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as NotificationType })}
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Nova funcionalidade disponivel!"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Descreva a notificacao..."
                rows={4}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">Link (opcional)</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="Ex: /changelog"
                className="border-zinc-700 bg-zinc-800 text-white"
              />
              <p className="text-xs text-zinc-500">
                Link para onde o usuario sera direcionado ao clicar
              </p>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label>Destinatario</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.isGlobal ? "default" : "outline"}
                  className={formData.isGlobal ? "bg-violet-600 hover:bg-violet-700" : "border-zinc-700"}
                  onClick={() => setFormData({ ...formData, isGlobal: true })}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Todos os Usuarios
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                A notificacao sera enviada para todos os usuarios do sistema
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving || !formData.title || !formData.message}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Notificacao
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={!!viewingNotification}
        onOpenChange={(open) => {
          if (!open) setViewingNotification(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Notificacao</DialogTitle>
          </DialogHeader>

          {viewingNotification && (
            <div className="space-y-4 py-4">
              {/* Type & Date */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${TYPE_CONFIG[viewingNotification.type].color}`}>
                  {TYPE_CONFIG[viewingNotification.type].icon}
                  <span className="font-medium">{TYPE_CONFIG[viewingNotification.type].label}</span>
                </div>
                <span className="text-sm text-zinc-400">{formatDate(viewingNotification.createdAt)}</span>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-zinc-400">Titulo</Label>
                <p className="text-white font-medium">{viewingNotification.title}</p>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <Label className="text-zinc-400">Mensagem</Label>
                <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                  <p className="text-zinc-300 whitespace-pre-wrap">{viewingNotification.message}</p>
                </div>
              </div>

              {/* Link */}
              {viewingNotification.link && (
                <div className="space-y-1">
                  <Label className="text-zinc-400">Link</Label>
                  <p className="text-violet-400">{viewingNotification.link}</p>
                </div>
              )}

              {/* Recipient */}
              <div className="space-y-1">
                <Label className="text-zinc-400">Destinatario</Label>
                {viewingNotification.isGlobal ? (
                  <div className="flex items-center gap-2 text-violet-400">
                    <Users className="h-4 w-4" />
                    <span>Todos os usuarios</span>
                  </div>
                ) : viewingNotification.user ? (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <User className="h-4 w-4" />
                    <span>{viewingNotification.user.name || viewingNotification.user.email}</span>
                  </div>
                ) : null}
              </div>

              {/* Read count */}
              <div className="space-y-1">
                <Label className="text-zinc-400">Leituras</Label>
                <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                  {viewingNotification.readCount} usuarios leram
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingNotification(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Notificacao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta notificacao? Esta acao nao pode ser desfeita.
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
