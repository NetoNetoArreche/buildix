"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch avatar from database
  useEffect(() => {
    const fetchAvatar = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/avatar");
          if (response.ok) {
            const data = await response.json();
            if (data.avatarUrl) {
              setAvatarUrl(data.avatarUrl);
            }
          }
        } catch (error) {
          console.error("Failed to fetch avatar:", error);
        }
      }
    };
    fetchAvatar();
  }, [session?.user]);

  const displayAvatar = avatarUrl || session?.user?.image || undefined;

  // Show loading state
  if (status === "loading") {
    return (
      <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
    );
  }

  // If not logged in, show login button
  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    );
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayAvatar} alt={session.user.name || "User"} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            My Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut({ callbackUrl: "/login", redirect: true });
          }}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
