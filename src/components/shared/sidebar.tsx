"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  FolderOpen,
  Image,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Users,
  CreditCard,
  Layers,
  GraduationCap,
  History,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/uiStore";

const mainNavItems = [
  {
    titleKey: "create",
    href: "/",
    icon: Sparkles,
  },
  {
    titleKey: "projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    titleKey: "community",
    href: "/community",
    icon: Users,
  },
  {
    titleKey: "components",
    href: "/components",
    icon: Layers,
  },
  {
    titleKey: "assets",
    href: "/assets",
    icon: Image,
  },
];

const bottomNavItems = [
  {
    titleKey: "learn",
    href: "/learn",
    icon: GraduationCap,
  },
  {
    titleKey: "changelog",
    href: "/changelog",
    icon: History,
  },
  {
    titleKey: "feedback",
    href: "/feedback",
    icon: MessageSquare,
  },
  {
    titleKey: "pricing",
    href: "/pricing",
    icon: CreditCard,
  },
  {
    titleKey: "settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const t = useTranslations("nav");

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-3">
          <Logo collapsed={sidebarCollapsed} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* New Project Button */}
        <div className="p-3">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="buildix"
                  size="icon"
                  className="w-full"
                  asChild
                >
                  <Link href="/">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{t("newProject")}</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="buildix" className="w-full justify-start" asChild>
              <Link href="/">
                <Plus className="mr-2 h-4 w-4" />
                {t("newProject")}
              </Link>
            </Button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const title = t(item.titleKey);

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{title}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {title}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="mt-auto space-y-1 p-3">
          <Separator className="mb-3" />
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const title = t(item.titleKey);

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{title}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {title}
              </Link>
            );
          })}
        </div>
      </aside>
    </TooltipProvider>
  );
}
