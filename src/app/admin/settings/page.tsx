"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Construction,
  Save,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface MaintenanceSettings {
  maintenanceMode: boolean;
  title: string;
  message: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    maintenanceMode: false,
    title: "BuildixLab",
    message: "Em breve estará disponível",
  });
  const [originalSettings, setOriginalSettings] =
    useState<MaintenanceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/maintenance");
        if (response.ok) {
          const data = await response.json();
          const loadedSettings = {
            maintenanceMode: data.maintenanceMode,
            title: data.title || "BuildixLab",
            message: data.message || "Em breve estará disponível",
          };
          setSettings(loadedSettings);
          setOriginalSettings(loadedSettings);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Erro ao carregar configurações");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const hasChanges =
    originalSettings &&
    (settings.maintenanceMode !== originalSettings.maintenanceMode ||
      settings.title !== originalSettings.title ||
      settings.message !== originalSettings.message);

  const handleToggleChange = (checked: boolean) => {
    // Se está ativando o modo manutenção, mostrar confirmação
    if (checked && !settings.maintenanceMode) {
      setShowConfirmDialog(true);
    } else {
      setSettings((prev) => ({ ...prev, maintenanceMode: checked }));
    }
  };

  const confirmActivation = () => {
    setSettings((prev) => ({ ...prev, maintenanceMode: true }));
    setShowConfirmDialog(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const data = await response.json();
      const savedSettings = {
        maintenanceMode: data.maintenanceMode,
        title: data.title,
        message: data.message,
      };
      setSettings(savedSettings);
      setOriginalSettings(savedSettings);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as configurações globais do site
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500">
          <CheckCircle className="h-5 w-5" />
          <span>Configurações salvas com sucesso!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Maintenance Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Modo Manutenção
          </CardTitle>
          <CardDescription>
            Ative o modo manutenção para exibir uma página &quot;Em breve&quot; para todos
            os visitantes. Administradores continuam com acesso normal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <div className="font-medium">Ativar Modo Manutenção</div>
              <div className="text-sm text-muted-foreground">
                {settings.maintenanceMode
                  ? "O site está em modo manutenção. Visitantes verão a página 'Em breve'."
                  : "O site está funcionando normalmente para todos os usuários."}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  settings.maintenanceMode
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-green-500/20 text-green-500"
                }`}
              >
                {settings.maintenanceMode ? "ATIVO" : "INATIVO"}
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={handleToggleChange}
              />
            </div>
          </div>

          {/* Customization */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={settings.title}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="BuildixLab"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Input
                value={settings.message}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Em breve estará disponível"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </label>
            <div className="p-8 rounded-lg bg-zinc-950 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {settings.title || "BuildixLab"}
              </h2>
              <p className="text-zinc-400">Em Construção</p>
              <p className="text-zinc-500 text-sm mt-1">
                {settings.message || "Em breve estará disponível"}
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {hasChanges
                ? "Você tem alterações não salvas"
                : "Todas as alterações foram salvas"}
            </div>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ativar Modo Manutenção?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao ativar o modo manutenção, todos os visitantes serão
              redirecionados para a página &quot;Em breve&quot;. Apenas administradores
              poderão acessar o site normalmente.
              <br />
              <br />
              <strong>Nota:</strong> Você precisará clicar em &quot;Salvar Alterações&quot;
              para que a mudança entre em vigor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivation}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Ativar Modo Manutenção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
