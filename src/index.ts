import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";
import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin/auth.route";
import cors from "cors";
import path from "path";
// import cookieParser from "cookie-parser";

dotenv.config();
const app: Application = express();

let corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3003"],
  // origin: true,
  credentials: true,
};
app.use(
  "/uploads/profile",
  express.static(path.join(__dirname, "../uploads/profile")),
);

app.use(cors(corsOptions));
app.use(bodyParser.json());
// app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminUserRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running");
});

async function startServer() {
  await connectDb();

  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}

startServer();
