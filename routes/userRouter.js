import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  loginUser,
  loginWithGoogle,
  resetPassword,
  sendOTP,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/all", getAllUsers);
userRouter.delete("/:userId", deleteUser);
userRouter.get("/", getUser);

export default userRouter;
