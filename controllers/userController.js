import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";
import OTP from "../models/otp.js";
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
  const userData = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashedPassword,
    role: req.body.role,
  });

  if (req.body.img) {
    userData.img = req.body.img;
  }

  const user = new User(userData);

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
  const user = await User.findOne({ email: email });
  if (user == null) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  //delete all old OTPs
  await OTP.deleteMany({ email: email });

  const message = {
    from: process.env.GOOGLE_EMAIL,
    to: email,
    subject: "Your OTP Code for Password Reset",
    html: `
    <div style="
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
    ">
      <div style="
        max-width: 500px;
        margin: auto;
        background: white;
        padding: 25px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        <h2 style="text-align: center; color: #0d6efd;">
          Password Reset Verification
        </h2>

        <p style="font-size: 15px; color: #333;">
          Hello,
        </p>

        <p style="font-size: 15px; color: #333;">
          We received a request to reset your account password.  
          Use the OTP code below to complete the verification.
        </p>

        <div style="
          text-align: center;
          margin: 30px 0;
        ">
          <span style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #0d6efd;
            padding: 10px 20px;
            border: 2px dashed #0d6efd;
            border-radius: 8px;
            display: inline-block;
          ">
            ${randomOTP}
          </span>
        </div>

        <p style="font-size: 14px; color: #555;">
          This OTP will expire in <strong>10 minutes</strong>.  
          If you did not request a password reset, please ignore this email.
        </p>

        <p style="font-size: 14px; color: #555;">
          Best regards,<br>
          <strong>Your Support Team</strong>
        </p>
      </div>
    </div>
  `,
  };

  const otp = new OTP({ email: email, otp: randomOTP });
  await otp.save();

  transport.sendMail(message, (error, info) => {
    if (error) {
      res.status(500).json({ message: "Error sending OTP", error: error });
      return;
    }
    res.json({ message: "OTP sent successfully", otp: randomOTP });
  });
}

export async function resetPassword(req, res) {
  const otp = req.body.otp;
  const email = req.body.email;
  const newPassword = req.body.newPassword;

  const response = await OTP.findOne({ email: email });
  if (response == null) {
    res.status(500).json({ message: "No OTP found. Please try again" });
    return;
  }
  if (otp == response.otp) {
    await OTP.deleteMany({ email: email });
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const response2 = await User.updateOne(
      { email: email },
      {
        password: hashedPassword,
      }
    );
    res.json({ message: "Password reset successful" });
  } else {
    res.status(403).json({ message: "Invalid OTP. Please try again" });
    return;
  }
}

export function getUser(req, res) {
  if (req.user == null) {
    res
      .status(403)
      .json({ message: "Unauthorized access. Please Login first." });
    return;
  }
  res.json({ ...req.user });
}

export async function getAllUsers(req, res) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error: error });
  }
}

export async function deleteUser(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Admin access required to delete users" });
    return;
  }
  try {
    await User.deleteOne({ _id: req.params.userId });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error: error });
  }
}

export async function updateUser(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({ message: "Admin access required to update users" });
    return;
  }
  try {
    await User.updateOne({ _id: req.params.userId }, req.body);
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error: error });
  }
} //TODO: implement update user function

export function isAdmin(req) {
  if (req.user == null) {
    return false;
  }

  if (req.user.role !== "admin") {
    return false;
  }
  return true;
}
