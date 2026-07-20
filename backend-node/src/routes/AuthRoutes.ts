import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  login,
  me,
  sendOtp,
  verifyOtp,
  updateProfile,
  updatePassword,
} from "../controllers/AuthController";
import { protect } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

const registerValidators = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("email").isEmail().withMessage("a valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
];

const loginValidators = [
  body("email").isEmail().withMessage("a valid email is required"),
  body("password").notEmpty().withMessage("password is required"),
];

const sendOtpValidators = [body("email").isEmail().withMessage("a valid email is required")];

const verifyOtpValidators = [
  body("email").isEmail().withMessage("a valid email is required"),
  body("otp").trim().notEmpty().withMessage("otp is required"),
];

const updateProfileValidators = [body("name").trim().notEmpty().withMessage("name is required")];

const updatePasswordValidators = [
  body("newPassword").isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
  body("currentPassword").optional().isString(),
];

router.post("/register", registerValidators, asyncHandler(register));
router.post("/login", loginValidators, asyncHandler(login));
router.get("/me", protect, asyncHandler(me));
router.post("/send-otp", sendOtpValidators, asyncHandler(sendOtp));
router.post("/verify-otp", verifyOtpValidators, asyncHandler(verifyOtp));
router.patch("/profile", protect, updateProfileValidators, asyncHandler(updateProfile));
router.put("/password", protect, updatePasswordValidators, asyncHandler(updatePassword));

export default router;
