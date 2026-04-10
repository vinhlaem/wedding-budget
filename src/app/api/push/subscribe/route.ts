import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Subscription from "@/lib/models/Subscription";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const { endpoint, keys } = body || {};

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { success: false, message: "Invalid subscription" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    await Subscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, new: true },
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
