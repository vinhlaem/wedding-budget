import { NextResponse } from "next/server";
import connectDB from "@/lib/database";
import Notification from "@/lib/models/Notification";

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
