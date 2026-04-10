import { NextResponse } from "next/server";
import { VAPID_PUBLIC_KEY } from "@/lib/pushService";

export async function GET(): Promise<NextResponse> {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { success: false, message: "Push not configured" },
      { status: 503 },
    );
  }
  return NextResponse.json({
    success: true,
    data: { publicKey: VAPID_PUBLIC_KEY },
  });
}
