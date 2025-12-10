import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
dotenv.config();

export function createUser(req, res) {
  if (req.body.role == "admin") {
    if (req.user != null) {
      if (req.user.role != "admin") {
        res
          .status(403)
          .json({ message: "Only admin can create another admin user" });
        return;
      }
    } else {
      res
        .status(403)
        .json({ message: "Unauthorized access. Please Login first." });
      return;
    }
  }
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role,
  });

  user
    .save()
    .then(() => {
      res.json({
        message: "User created successfully",
      });
    })
    .catch(() => {
      res.json({
        message: "User creation failed",
      });
    });
}

export function loginUser(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (user == null) {
      res.status(404).json({ message: "User not found" });
    } else {
      const isPasswordCorrect = bcrypt.compareSync(password, user.password);
      if (isPasswordCorrect) {
        const token = jwt.sign(
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            image: user.img,
          },
          process.env.JWT_KEY
        );

        res.json({
          message: "Login successful",
          token: token,
          role: user.role,
        });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    }
  });
}

export async function loginWithGoogle(req, res) {
  const token = req.body.accessToken;
  if (token == null) {
    res.status(403).json({ message: "Access token is required" });
    return;
  }
  const response = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(response.data);
  const user = await User.findOne({ email: response.data.email });
  if (user == null) {
    const fullName = response.data.name || "";
    const givenName =
      response.data.given_name || fullName.split(" ")[0] || "User";
    const familyName =
      response.data.family_name ||
      fullName.split(" ").slice(1).join(" ") ||
      "GoogleUser";

    const newUser = new User({
      email: response.data.email,
      firstName: givenName,
      lastName: familyName,
      password: "googleUser", // Only used for placeholder; never for login
      img:
        response.data.picture ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    });

    await newUser.save();

    const token = jwt.sign(
      {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        image: newUser.img,
      },
      process.env.JWT_KEY
    );

    res.json({
      message: "Login successful",
      token: token,
      role: newUser.role,
    });
  } else {
    const token = jwt.sign(
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        image: user.img,
      },
      process.env.JWT_KEY
    );

    res.json({
      message: "Login successful",
      token: token,
      role: user.role,
    });
  }
}

const transport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendOTP(req, res) {
  const randomOTP = Math.floor(100000 + Math.random() * 900000);
  const email = req.body.email;
  if (email == null) {
    res.status(403).json({ message: "Email is required" });
    return;
  }
  const message = {
    from: process.env.GOOGLE_EMAIL,
    to: email,
    subject: "Password Reset OTP",
    text: "This is your password reset OTP : " + randomOTP,
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      res.status(500).json({ message: "Error sending OTP", error: error });
      return;
    }
    res.json({ message: "OTP sent successfully", otp: randomOTP });
  });
}

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  if (req.user.role !== "admin") {
    return false;
  }
  return true;
}
