"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Logo collapsed={false} />
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname === "/terms" && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/terms">Termos</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname === "/privacy" && "bg-accent text-accent-foreground"
              )}
            >
              <Link href="/privacy">Privacidade</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto max-w-4xl px-4 md:px-6 py-8 md:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 md:px-6 flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Buildix. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
