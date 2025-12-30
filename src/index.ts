import express from "express";

const app = express();

app.get("/", (req, res) => {
  return res.status(200).json({ status: "healthy" });
});

app.listen(4000, () => {
  console.log("The server is runfning on port 4004");
});


