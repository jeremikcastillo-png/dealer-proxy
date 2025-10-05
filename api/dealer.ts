import { z } from "zod";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const PROXY_API_KEY   = process.env.PROXY_API_KEY || "";
const FORWARD_API_KEY = process.env.FORWARD_API_KEY || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const PayloadSchema = z.object({
  action: z.string().min(1).optional()
}).passthrough();

function corsHeaders(origin?: string) {
  const allowAll = ALLOWED_ORIGINS.length === 0;
  const allowed = allowAll || (origin && ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, x-api-key"
  };
}

export default async function handler(req: any, res: any) {
  const origin = req.headers.origin as string | undefined;
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
    return res.status(200).json({ ok: true, msg: "Dealer Proxy running. Use POST." });
  }

  try {
    const clientKey = (req.headers["x-api-key"] as string) || "";
    if (PROXY_API_KEY && clientKey !== PROXY_API_KEY) {
      Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
      return res.status(401).json({ ok: false, error: "Unauthorized (proxy key)" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const payload = PayloadSchema.parse(body);

    if (FORWARD_API_KEY && !payload.api_key) {
      (payload as any).api_key = FORWARD_API_KEY;
    }

    const fRes = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await fRes.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
    res.status(fRes.status).json(json);

  } catch (err: any) {
    Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v as string));
    res.status(500).json({ ok: false, error: String(err) });
  }
}
