import app from "./app";
import { PORT } from "./configs";
import { connectDb } from "./database/mongodb";

async function startServer() {
  await connectDb();

  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}

startServer();
