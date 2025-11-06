import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import studentRouter from "./routes/studentRouter.js";
import productRouter from "./routes/productRouter.js";
import userRouter from "./routes/userRouter.js";
import jwt from "jsonwebtoken";

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  const tokenString = req.header("Authorization");
  if (tokenString != null) {
    const token = tokenString.replace("Bearer ", "");
    jwt.verify(token, "cbc-batch-five#@2025", (err, decoded) => {
      if (decoded != null) {
        req.user = decoded;
        next();
      } else {
        res.status(403).json({ message: "Unauthorized access" });
      }
    });
  } else {
    next();
  }
});

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

app.use("/students", studentRouter);
app.use("/products", productRouter);
app.use("/users", userRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//mongodb+srv://admin:123@cluster0.svesegc.mongodb.net/?appName=Cluster0
