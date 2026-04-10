import { NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Notification from "@/lib/models/Notification";

export async function PATCH(): Promise<NextResponse> {
  try {
    await connectDB();
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
