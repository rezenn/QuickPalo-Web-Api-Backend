import mongoose from "mongoose";
import { MONGODB_URI } from "../configs";

export const connectDb = async () => {
  try {
  } catch (e) {
    console.log("MongoDb error:", e);
    process.exit(1);
  }
};
