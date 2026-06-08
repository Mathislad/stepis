import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint « me notifier au lancement » pour les modules « Bientôt ».
 * V1 : journalise simplement (console.log). À brancher plus tard sur
 * Brevo / une table interest_signups.
 */
export async function POST(request: NextRequest) {
  const fd = await request.formData();
  const moduleKey = String(fd.get("module") ?? "");
  console.log(`[notify-interest] module=${moduleKey} at=${new Date().toISOString()}`);

  // DECISION: on redirige côté serveur vers la même page avec ?notified=1
  // plutôt qu'une réponse JSON, pour rester compatible formulaire natif.
  const referer = request.headers.get("referer") ?? "/";
  const url = new URL(referer);
  url.searchParams.set("notified", "1");
  return NextResponse.redirect(url, { status: 303 });
}
