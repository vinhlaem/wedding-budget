import connectDB from "./database";
import Budget from "./models/Budget";
import NotificationModel from "./models/Notification";
import Subscription from "./models/Subscription";
import { sendPush } from "./pushService";
import type { PushPayload, SubscriptionData } from "./pushService";

// Stage number → daysRemaining threshold
const STAGES = [
  { stage: 4, label: "overdue", check: (d: number) => d < 0 },
  { stage: 3, label: "1day", check: (d: number) => d >= 0 && d < 2 },
  { stage: 2, label: "3days", check: (d: number) => d >= 2 && d < 4 },
  { stage: 1, label: "7days", check: (d: number) => d >= 4 && d <= 7 },
];

function stageForDays(daysRemaining: number): number {
  for (const s of STAGES) {
    if (s.check(daysRemaining)) return s.stage;
  }
  return 0;
}

interface BudgetDoc {
  _id: unknown;
  itemName: string;
  notifyStage: number;
  deadline: Date;
}

function buildMessage(items: BudgetDoc[], daysRemaining: number): string {
  const prefix =
    daysRemaining < 0
      ? "Đã quá hạn thanh toán"
      : daysRemaining === 0
        ? "Hôm nay đến hạn thanh toán"
        : daysRemaining === 1
          ? "Ngày mai đến hạn thanh toán"
          : `Còn ${daysRemaining} ngày đến hạn thanh toán`;

  if (items.length === 1) return `${prefix} ${items[0].itemName}`;
  if (items.length <= 3) {
    return `${prefix} ${items.length} khoản: ${items.map((i) => i.itemName).join(", ")}`;
  }
  return `${prefix} ${items.length} khoản. Mở app để xem chi tiết.`;
}

/**
 * Core notification check — queries pending expenses, groups by deadline,
 * determines notification stage, prevents duplicates, and sends push.
 *
 * Called by:
 *   - Vercel Cron → GET /api/cron/notify
 *   - Manual test → POST /api/test-notify
 */
export async function runNotificationCheck(): Promise<void> {
  await connectDB();

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const pendingItems = (await Budget.find({
    status: { $ne: "hoan-thanh" },
    deadline: { $ne: null },
  }).lean()) as unknown as BudgetDoc[];

  if (!pendingItems.length) {
    console.log("[cron] No pending items found.");
    return;
  }
  console.log(`[cron] Found ${pendingItems.length} pending items.`);

  // Group by deadline date string "YYYY-MM-DD" → stage → items
  const byDeadline: Record<
    string,
    Record<number, { items: BudgetDoc[]; daysRemaining: number }>
  > = {};

  for (const item of pendingItems) {
    const dl = new Date(item.deadline);
    const dlStr = dl.toISOString().split("T")[0];
    const daysRemaining = Math.floor(
      (dl.getTime() - today.getTime()) / 86_400_000,
    );
    const stage = stageForDays(daysRemaining);
    if (stage === 0) continue;
    if (item.notifyStage >= stage) continue;

    if (!byDeadline[dlStr]) byDeadline[dlStr] = {};
    if (!byDeadline[dlStr][stage]) {
      byDeadline[dlStr][stage] = { items: [], daysRemaining };
    }
    byDeadline[dlStr][stage].items.push(item);
  }

  const subscriptions =
    (await Subscription.find().lean()) as unknown as (SubscriptionData & {
      _id: unknown;
    })[];
  if (!subscriptions.length) {
    console.log("[cron] No subscriptions found.");
    return;
  }

  let sentCount = 0;

  for (const [dlStr, stages] of Object.entries(byDeadline)) {
    for (const [stageStr, { items, daysRemaining }] of Object.entries(stages)) {
      const stage = Number(stageStr);
      const message = buildMessage(items, daysRemaining);

      // Deduplicate: skip if already sent for this deadline + stage
      let notif = await NotificationModel.findOne({
        deadlineDate: dlStr,
        stage,
      });
      if (notif && notif.sent) continue;

      // Upsert notification record
      if (!notif) {
        notif = await NotificationModel.create({
          expenseIds: items.map((i) => i._id),
          stage,
          deadlineDate: dlStr,
          message,
          isRead: false,
          sent: false,
        });
      }

      const payload: PushPayload = {
        title: "Wedding Budget 💍",
        body: message,
        tag: `deadline-${dlStr}-${stage}`,
        data: {
          deadlineDate: dlStr,
          stage,
          notificationId: notif._id.toString(),
        },
      };

      let anySent = false;
      const deadEndpoints: string[] = [];

      for (const sub of subscriptions) {
        const result = await sendPush(sub, payload);
        if (result === "gone")
          deadEndpoints.push((sub as unknown as { _id: string })._id);
        else if (result) anySent = true;
      }

      // Remove stale subscriptions
      if (deadEndpoints.length) {
        await Subscription.deleteMany({ _id: { $in: deadEndpoints } });
      }

      // Mark notification as sent
      if (anySent) {
        await NotificationModel.updateOne({ _id: notif._id }, { sent: true });
        sentCount++;
      }

      // Update notifyStage on each item
      for (const item of items) {
        if (item.notifyStage < stage) {
          await Budget.updateOne(
            { _id: item._id },
            { notifyStage: stage, lastNotificationSent: new Date() },
          );
        }
      }
    }
  }

  console.log(`[cron] Sent ${sentCount} notifications.`);
}
