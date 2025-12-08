/**
 * Figma API Client
 * Wrapper for Figma REST API with OAuth support
 */

const FIGMA_API_BASE = "https://api.figma.com/v1";
const FIGMA_OAUTH_AUTH_URL = "https://www.figma.com/oauth";
const FIGMA_OAUTH_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
const FIGMA_OAUTH_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh";

export interface FigmaTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId?: string;
}

export interface FigmaFile {
  key: string;
  name: string;
  thumbnailUrl: string;
  lastModified: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteRenderBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  cornerRadius?: number;
  rectangleCornerRadii?: number[];
  opacity?: number;
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisSizingMode?: "FIXED" | "AUTO";
  counterAxisSizingMode?: "FIXED" | "AUTO";
  primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  layoutGrow?: number;
  constraints?: {
    vertical: "TOP" | "BOTTOM" | "CENTER" | "TOP_BOTTOM" | "SCALE";
    horizontal: "LEFT" | "RIGHT" | "CENTER" | "LEFT_RIGHT" | "SCALE";
  };
  // Text properties
  characters?: string;
  style?: FigmaTextStyle;
  // Image properties
  imageRef?: string;
}

export interface FigmaFill {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "IMAGE";
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a?: number };
  gradientStops?: Array<{
    position: number;
    color: { r: number; g: number; b: number; a?: number };
  }>;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  imageRef?: string;
  scaleMode?: "FILL" | "FIT" | "CROP" | "TILE";
}

export interface FigmaStroke {
  type: "SOLID" | "GRADIENT_LINEAR";
  visible?: boolean;
  opacity?: number;
  color?: { r: number; g: number; b: number; a?: number };
}

export interface FigmaEffect {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible?: boolean;
  radius: number;
  color?: { r: number; g: number; b: number; a?: number };
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaTextStyle {
  fontFamily?: string;
  fontPostScriptName?: string;
  fontWeight?: number;
  fontSize?: number;
  textAlignHorizontal?: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
  textDecoration?: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<string, unknown>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

/**
 * Get OAuth authorization URL
 */
export function getFigmaAuthUrl(state?: string): string {
  const clientId = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_FIGMA_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/figma/auth/callback`;

  if (!clientId) {
    throw new Error("FIGMA_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "file_content:read",
    response_type: "code",
    ...(state && { state }),
  });

  return `${FIGMA_OAUTH_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<FigmaTokens> {
  const clientId = process.env.FIGMA_CLIENT_ID || process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  const redirectUri = process.env.FIGMA_REDIRECT_URI || process.env.NEXT_PUBLIC_FIGMA_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/figma/auth/callback`;

  console.log("[Figma Token Exchange] Starting...");
  console.log("[Figma Token Exchange] Client ID:", clientId ? `${clientId.substring(0, 5)}...` : "NOT SET");
  console.log("[Figma Token Exchange] Client Secret:", clientSecret ? "SET" : "NOT SET");
  console.log("[Figma Token Exchange] Redirect URI:", redirectUri);

  if (!clientId || !clientSecret) {
    console.error("[Figma Token Exchange] Missing credentials!");
    throw new Error("Figma OAuth credentials not configured");
  }

  const response = await fetch(FIGMA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Figma Token Exchange] Failed! Status:", response.status);
    console.error("[Figma Token Exchange] Error:", error);
    throw new Error(`Failed to exchange code: ${error}`);
  }

  const data = await response.json();
  console.log("[Figma Token Exchange] Success! Got tokens.");

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    userId: data.user_id,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<FigmaTokens> {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Figma OAuth credentials not configured");
  }

  const response = await fetch(FIGMA_OAUTH_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: refreshToken, // Figma doesn't rotate refresh tokens
    expiresIn: data.expires_in,
  };
}

/**
 * Figma API Client class
 */
export class FigmaClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${FIGMA_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "X-Figma-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Figma API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<{ id: string; handle: string; email: string; img_url: string }> {
    return this.request("/me");
  }

  /**
   * Get file metadata
   */
  async getFile(fileKey: string, depth?: number): Promise<{
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    document: FigmaNode;
  }> {
    const params = depth ? `?depth=${depth}` : "";
    return this.request(`/files/${fileKey}${params}`);
  }

  /**
   * Get specific nodes from a file
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<{
    name: string;
    nodes: Record<string, { document: FigmaNode }>;
  }> {
    const ids = nodeIds.join(",");
    return this.request(`/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`);
  }

  /**
   * Get images for nodes
   */
  async getImages(fileKey: string, nodeIds: string[], format: "jpg" | "png" | "svg" = "png", scale = 2): Promise<{
    images: Record<string, string>;
  }> {
    const ids = nodeIds.join(",");
    return this.request(`/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`);
  }

  /**
   * Get file variables (Design Tokens)
   */
  async getLocalVariables(fileKey: string): Promise<{
    meta: {
      variables: Record<string, FigmaVariable>;
      variableCollections: Record<string, FigmaVariableCollection>;
    };
  }> {
    return this.request(`/files/${fileKey}/variables/local`);
  }

  /**
   * Get user's recent files
   */
  async getRecentFiles(): Promise<{
    files: FigmaFile[];
  }> {
    return this.request("/me/files");
  }

  /**
   * Get team projects
   */
  async getTeamProjects(teamId: string): Promise<{
    projects: Array<{ id: string; name: string }>;
  }> {
    return this.request(`/teams/${teamId}/projects`);
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string): Promise<{
    files: FigmaFile[];
  }> {
    return this.request(`/projects/${projectId}/files`);
  }
}

/**
 * Parse Figma URL to extract file key and node ID
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  try {
    const urlObj = new URL(url);

    // Check if it's a Figma URL
    if (!urlObj.hostname.includes("figma.com")) {
      return null;
    }

    // Extract file key from path
    // Formats:
    // - https://www.figma.com/file/FILE_KEY/Title
    // - https://www.figma.com/design/FILE_KEY/Title
    // - https://www.figma.com/file/FILE_KEY/Title?node-id=NODE_ID
    const pathMatch = urlObj.pathname.match(/\/(file|design)\/([a-zA-Z0-9]+)/);

    if (!pathMatch) {
      return null;
    }

    const fileKey = pathMatch[2];

    // Extract node ID from query params
    const nodeId = urlObj.searchParams.get("node-id")?.replace(/-/g, ":") || undefined;

    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

/**
 * Convert Figma color to CSS
 */
export function figmaColorToCss(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Convert Figma color to hex
 */
export function figmaColorToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, "0");
  const g = Math.round(color.g * 255).toString(16).padStart(2, "0");
  const b = Math.round(color.b * 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
