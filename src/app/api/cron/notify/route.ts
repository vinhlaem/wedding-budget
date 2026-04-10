import { NextRequest, NextResponse } from "next/server";
import { runNotificationCheck } from "@/lib/notificationService";

// NOTE: Vercel Cron Jobs run in UTC.
// Current schedule: "0 1 * * *" → 08:00 ICT (01:00 UTC), once per day.

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!cronSecret || !token || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  console.log(`[cron] Running at: ${startedAt}`);

  try {
    await runNotificationCheck();
    console.log("[cron] Completed successfully.");
    return NextResponse.json({ success: true, ranAt: startedAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
