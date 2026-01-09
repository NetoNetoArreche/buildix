import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";
  const { pathname } = req.nextUrl;

  // Routes that bypass maintenance check completely
  const maintenanceBypassRoutes = ["/coming-soon", "/api/maintenance", "/api/auth", "/api/stripe"];

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/coming-soon"];

  // API routes that don't require auth
  const publicApiRoutes = ["/api/auth", "/api/stripe/webhook", "/api/maintenance/status"];

  // Check if it's a public route
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicApi = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route bypasses maintenance
  const bypassesMaintenance = maintenanceBypassRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check maintenance mode (skip for admin users and bypass routes)
  if (!isAdmin && !bypassesMaintenance) {
    try {
      const baseUrl = req.nextUrl.origin;
      const response = await fetch(`${baseUrl}/api/maintenance/status`, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.maintenanceMode) {
          return NextResponse.redirect(new URL("/coming-soon", req.url));
        }
      }
    } catch {
      // If API fails, continue normally
    }
  }

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute && !isPublicApi) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/register, redirect to home
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
