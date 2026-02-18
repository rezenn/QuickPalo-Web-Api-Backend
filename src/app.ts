import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/user/auth.route";
import adminUserRoutes from "./routes/admin/auth.route";
import organizationDetailsRoutes from "./routes/organization/organization.route";
import chatRoutes from "./routes/chat/chat.route";
import cors from "cors";
import path from "path";

dotenv.config();
const app: Application = express();

let corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3003"],
  credentials: true,
};
app.use(
  "/uploads/profile",
  express.static(path.join(__dirname, "../uploads/profile")),
);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/auth", adminUserRoutes);
app.use("/api/organizations", organizationDetailsRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

export default app;
