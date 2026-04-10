import { NextResponse } from "next/server";
import { runNotificationCheck } from "@/lib/notificationService";

/**
 * POST /api/test-notify
 *
 * Manual trigger for testing — invokes the same notification check
 * as the cron job. Does NOT require CRON_SECRET.
 */
export async function POST(): Promise<NextResponse> {
  const startedAt = new Date().toISOString();
  console.log(`[cron:test] Manual trigger at: ${startedAt}`);

  try {
    await runNotificationCheck();
    console.log("[cron:test] Completed.");
    return NextResponse.json({ success: true, ranAt: startedAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron:test] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
