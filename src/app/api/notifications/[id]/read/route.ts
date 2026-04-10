import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Notification from "@/lib/models/Notification";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await connectDB();
    await Notification.updateOne({ _id: id }, { isRead: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
