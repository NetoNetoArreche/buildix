import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/lib/figma/client";

/**
 * Returns HTML that closes the popup and notifies the parent window
 */
function getPopupCloseHtml(success: boolean, error?: string) {
  const message = success
    ? JSON.stringify({ type: "figma_auth_success" })
    : JSON.stringify({ type: "figma_auth_error", error: error || "unknown" });

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Conectando Figma...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { margin: 0 0 10px; font-weight: 500; }
    p { margin: 0; opacity: 0.7; font-size: 14px; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h2>${success ? "Figma conectado!" : "Erro na conexão"}</h2>
    <p>${success ? "Fechando esta janela..." : error || "Tente novamente"}</p>
  </div>
  <script>
    // Send message to parent window (opener)
    if (window.opener) {
      window.opener.postMessage(${message}, window.location.origin);
      // Close popup after a short delay
      setTimeout(() => window.close(), 1500);
    } else {
      // If not a popup, redirect to home
      setTimeout(() => {
        window.location.href = '/${success ? "?figma_connected=true" : "?figma_error=" + (error || "unknown")}';
      }, 2000);
    }
  </script>
</body>
</html>
  `;
}

/**
 * GET /api/figma/auth/callback
 * OAuth callback handler - exchanges code for tokens and saves to user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Check for OAuth errors
    if (error) {
      console.error("[Figma Callback] OAuth error:", error);
      return new NextResponse(getPopupCloseHtml(false, "access_denied"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (!code) {
      return new NextResponse(getPopupCloseHtml(false, "no_code"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Verify session
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(getPopupCloseHtml(false, "unauthorized"), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Verify state if provided
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, "base64url").toString());

        // Verify user ID matches
        if (stateData.userId !== session.user.id) {
          console.error("[Figma Callback] State user mismatch");
          return new NextResponse(getPopupCloseHtml(false, "state_mismatch"), {
            headers: { "Content-Type": "text/html" },
          });
        }

        // Verify timestamp is not too old (1 hour max)
        const stateAge = Date.now() - stateData.timestamp;
        if (stateAge > 3600000) {
          console.error("[Figma Callback] State expired");
          return new NextResponse(getPopupCloseHtml(false, "state_expired"), {
            headers: { "Content-Type": "text/html" },
          });
        }
      } catch {
        console.error("[Figma Callback] Invalid state format");
      }
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000);

    // Save tokens to user (user_id comes from token exchange response)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        figmaAccessToken: tokens.accessToken,
        figmaRefreshToken: tokens.refreshToken,
        figmaTokenExpiry: tokenExpiry,
        figmaUserId: tokens.userId || null,
      },
    });

    console.log(`[Figma Callback] Successfully connected Figma for user ${session.user.id}`);

    // Return HTML that closes popup and notifies parent
    return new NextResponse(getPopupCloseHtml(true), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("[Figma Callback] Error:", error);
    return new NextResponse(getPopupCloseHtml(false, "token_exchange_failed"), {
      headers: { "Content-Type": "text/html" },
    });
  }
}
