import mongoose from "mongoose";

const MONGO_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  bufferCommands: false,
};

interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongoCache | undefined;
}

const cached: MongoCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};
if (!global._mongooseCache) global._mongooseCache = cached;

export default async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI environment variable is not set");

    cached.promise = mongoose
      .connect(uri, MONGO_OPTIONS)
      .then((m) => {
        console.log("[MongoDB] connection established");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("[MongoDB] connection failed:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
