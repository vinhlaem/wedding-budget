import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Subscription from "@/lib/models/Subscription";

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const { endpoint } = body || {};

  if (!endpoint) {
    return NextResponse.json(
      { success: false, message: "Endpoint is required" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    await Subscription.deleteOne({ endpoint });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
