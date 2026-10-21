import { createDemoApi, verifyJwtToken, type AuthTokenPayload } from "@neighbourdoc/api";
import type { UserRole } from "@neighbourdoc/shared";

const globalForNeighbourDoc = globalThis as unknown as {
  __neighbourDocApi?: ReturnType<typeof createDemoApi>;
};

export const api = globalForNeighbourDoc.__neighbourDocApi ?? createDemoApi();
globalForNeighbourDoc.__neighbourDocApi = api;

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ ok: false, error: message }, { status });
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  // Cookie fallback (supports both neighbourdoc and neighbordoc)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:neighbourdoc|neighbordoc)_session=([^;]+)/);
    if (match?.[1]) return match[1];
  }

  return null;
}

export function authenticate(request: Request): {
  authenticated: boolean;
  user?: AuthTokenPayload;
  error?: string;
} {
  const token = getAuthToken(request);
  if (!token) {
    return { authenticated: false, error: "Missing authorization token." };
  }

  const result = verifyJwtToken(token);
  if (!result.valid || !result.payload) {
    return { authenticated: false, error: result.error ?? "Invalid or expired token." };
  }

  return { authenticated: true, user: result.payload };
}

export type AuthGuardResult =
  | { authorized: true; user: AuthTokenPayload; response?: undefined }
  | { authorized: false; response: Response; user?: undefined };

export function requireAuth(request: Request): AuthGuardResult {
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.user) {
    return {
      authorized: false,
      response: Response.json(
        { ok: false, error: auth.error ?? "Authentication required. Please sign in." },
        { status: 401 }
      )
    };
  }
  return { authorized: true, user: auth.user };
}

export function requireRole(
  request: Request,
  allowedRoles: UserRole[]
): AuthGuardResult {
  const auth = authenticate(request);
  if (!auth.authenticated || !auth.user) {
    return {
      authorized: false,
      response: Response.json(
        { ok: false, error: auth.error ?? "Authentication required. Please sign in." },
        { status: 401 }
      )
    };
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      authorized: false,
      response: Response.json(
        { ok: false, error: `Forbidden: role '${auth.user.role}' is not authorized for this resource.` },
        { status: 403 }
      )
    };
  }

  return { authorized: true, user: auth.user };
}
