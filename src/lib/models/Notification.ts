import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    expenseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Budget" }],
    stage: { type: Number, required: true, min: 1, max: 4 },
    deadlineDate: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    sent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ deadlineDate: 1, stage: 1 }, { unique: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Notification: mongoose.Model<any> =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;
