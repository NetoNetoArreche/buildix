import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication (only login and register)
  const publicRoutes = ["/login", "/register", "/coming-soon"];

  // API routes that don't require auth
  const publicApiRoutes = ["/api/auth", "/api/stripe/webhook", "/api/maintenance/status"];

  // Check if it's a public route
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPublicApi = publicApiRoutes.some((route) =>
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

  // Note: Maintenance mode check is handled in the root layout
  // because middleware runs on Edge runtime and can't access Prisma directly
  // The layout will redirect non-admin users to /coming-soon when maintenance is enabled

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
