"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Blocks,
  Code2,
  Image,
  FileCode,
  Users,
  Settings,
  ArrowLeft,
  Shield,
  GraduationCap,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "UI Components",
    href: "/admin/components",
    icon: Blocks,
  },
  {
    title: "Code Snippets",
    href: "/admin/snippets",
    icon: Code2,
  },
  {
    title: "Gallery Images",
    href: "/admin/gallery",
    icon: Image,
  },
  {
    title: "Templates",
    href: "/admin/templates",
    icon: FileCode,
  },
  {
    title: "Tutorials",
    href: "/admin/tutorials",
    icon: GraduationCap,
  },
  {
    title: "Changelog",
    href: "/admin/changelog",
    icon: History,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Back to App */}
      <div className="border-t border-zinc-800 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Buildix
        </Link>
      </div>
    </div>
  );
}
