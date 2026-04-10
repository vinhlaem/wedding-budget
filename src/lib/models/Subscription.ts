import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Subscription: mongoose.Model<any> =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
