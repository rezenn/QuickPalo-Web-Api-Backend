import dotenv from "dotenv";

dotenv.config();

export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT)
  : 5050;

export const MONGODB_URI: string =
  process.env.MONGODB_URI ||
  "mongodb+srv://rezenkhadgi_db_user:a5YPvdNcbTm8TcZa@cluster0.ehtsev5.mongodb.net/quickpalo_db";

export const JWT_SECRET: string =
  process.env.JWT_SECRET || "qu1ck_p4l0_org_secret_123";

export const FRONTEND_URL: string =
  process.env.FRONTEND_URL || "http://localhost:3000";
