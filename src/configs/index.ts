import dotenv from "dotenv";

dotenv.config();

export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT)
  : 5050;

export const MONGODB_URI: string =
  process.env.MONGODB_URI ||
  "mongodb+srv://rezenkhadgi_db_user:a5YPvdNcbTm8TcZa@cluster0.ehtsev5.mongodb.net/quickpalo";

export const JWT_SECERT: string =
  process.env.JET_SECERT || "qu1ck_p4l0_org_secret_123";
