import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";
import authRoutes from "./routes/auth.route";
import adminUserRoutes from "./routes/admin/auth.route";

dotenv.config();

const app: Application = express();

app.use(bodyParser.json());
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

console.log("MONGO_URI:", process.env.MONOGODB_URI);
startServer();
