"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PreviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [html, setHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error("Project not found");
        }

        const data = await response.json();

        // Extrair HTML da home page ou primeira página
        const homePage = data.pages?.find((p: any) => p.isHome) || data.pages?.[0];
        const htmlContent = homePage?.htmlContent || data.htmlContent;

        if (htmlContent) {
          setHtml(htmlContent);
        } else {
          setError("No preview available");
        }
      } catch (err) {
        console.error("Error loading preview:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
          <p className="text-gray-600 text-sm">Carregando preview...</p>
        </div>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-2">Preview não disponível</p>
          <p className="text-gray-500 text-sm">{error || "Nenhum conteúdo para exibir"}</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-screen border-0"
      title="Project Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
