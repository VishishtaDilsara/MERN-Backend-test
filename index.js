import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import Student from "./models/student.js";

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
  Student.find().then((data) => {
    res.json(data);
  });
});

app.post("/", (req, res) => {
  console.log(req.body);
  //save on students cluster

  const student = new Student({
    name: req.body.name,
    age: req.body.age,
    stream: req.body.stream,
    email: req.body.email,
  });

  student
    .save()
    .then(() => {
      res.json({
        message: "Student added successfully",
      });
    })
    .catch(() => {
      res.json({
        message: "Student not added",
      });
    });
});

app.delete("/", () => {
  console.log("This is a delete request");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

//mongodb+srv://admin:123@cluster0.svesegc.mongodb.net/?appName=Cluster0
