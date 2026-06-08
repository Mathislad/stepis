import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runLoyaltyAgentCron } from "@/lib/loyalty-agent/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authStatus(request: NextRequest): "ok" | "missing-secret" | "unauthorized" {
  const expected = process.env.CRON_SECRET;
  if (!expected) return "missing-secret";
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  return safeEqual(token, expected) ? "ok" : "unauthorized";
}

export async function GET(request: NextRequest) {
  const auth = authStatus(request);
  if (auth === "missing-secret") {
    return NextResponse.json({ error: "Cron secret is not configured" }, { status: 503 });
  }
  if (auth !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runLoyaltyAgentCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/loyalty-agent]", e);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}
