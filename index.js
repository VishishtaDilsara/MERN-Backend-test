import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

const app = express();

app.use(bodyParser.json());

mongoose
  .connect(
    "mongodb+srv://admin:123@cluster0.svesegc.mongodb.net/?appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to the Database");
  })
  .catch(() => {
    console.log("Database connection failed");
  });

app.get("/", (req, res) => {
  res.json({
    message: "This is a get request",
  });
  console.log(req.body.name);
});

app.delete("/", () => {
  console.log("This is a delete request");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//mongodb+srv://admin:123@cluster0.svesegc.mongodb.net/?appName=Cluster0
