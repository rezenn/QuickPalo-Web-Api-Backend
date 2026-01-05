import mongoose from "mongoose";
import { MONGODB_URI } from "../configs";

export const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDb");
  } catch (e) {
    console.log("MongoDb error:", e);
    process.exit(1);
  }
};
