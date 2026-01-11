"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/auth/UserMenu";
import { LanguageSelector } from "./language-selector";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const t = useTranslations("header");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      {/* Left side - Title or Search */}
      <div className="flex items-center gap-4">
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="w-[300px] pl-9"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <LanguageSelector />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
