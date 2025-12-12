"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const changeLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Set the locale cookie
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      // Reload the page to apply the new locale
      window.location.reload();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2",
            isPending && "opacity-50 pointer-events-none"
          )}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[locale]} {localeNames[locale]}</span>
          <span className="sm:hidden">{localeFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => changeLocale(l)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              locale === l && "bg-accent"
            )}
          >
            <span className="flex items-center gap-2">
              <span>{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
            </span>
            {locale === l && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
