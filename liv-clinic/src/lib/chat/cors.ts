import { NextRequest, NextResponse } from 'next/server';

// CORS for the visitor chat API so the LIV mobile app (native + web) can call /api/chat/*.
// Visitor endpoints are protected by session_token + rate limiting and carry no cookies,
// so a permissive default origin is safe. Lock down per-deploy via CHAT_CORS_ALLOWED_ORIGINS.

type RouteHandler = (req: NextRequest, ...rest: unknown[]) => Promise<Response> | Response;

function allowedOrigins(): string[] {
  return (process.env.CHAT_CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  // Deny-by-default: only echo the origin when it is explicitly allow-listed (no wildcard).
  // Same-origin (admin on livps.co.kr) and native apps need no ACAO and are unaffected.
  const list = allowedOrigins();
  if (origin && list.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

// Preflight handler — wire as `export function OPTIONS(req) { return corsPreflight(req); }`.
export function corsPreflight(req: NextRequest): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}

// Wraps a route handler so its actual response carries CORS headers (not just the preflight).
export function withCorsHandler(handler: RouteHandler): RouteHandler {
  return async (req, ...rest) => {
    const res = await handler(req, ...rest);
    const headers = corsHeaders(req.headers.get('origin'));
    for (const [key, value] of Object.entries(headers)) {
      res.headers.set(key, value);
    }
    return res;
  };
}
