import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";

dotenv.config();

const app: Application = express();

app.use(bodyParser.json());

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
