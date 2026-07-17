import { Router } from "express";
import { body } from "express-validator";
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  answerQuestion,
} from "../controllers/QuestionController";
import { protect, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

const questionValidators = [
  body("subject").isMongoId().withMessage("a valid subject is required"),
  body("text").trim().notEmpty().withMessage("text is required"),
  body("options").isArray({ min: 2 }).withMessage("at least 2 options are required"),
  body("correctOptionIndex").isInt({ min: 0 }).withMessage("correctOptionIndex is required"),
];

const answerValidators = [body("selectedOptionIndex").isInt({ min: 0 }).withMessage("selectedOptionIndex is required")];

router.get("/", protect, asyncHandler(listQuestions));
router.get("/:id", protect, asyncHandler(getQuestion));
router.post("/:id/answer", protect, answerValidators, asyncHandler(answerQuestion));
router.post("/", protect, adminOnly, questionValidators, asyncHandler(createQuestion));
router.put("/:id", protect, adminOnly, asyncHandler(updateQuestion));
router.delete("/:id", protect, adminOnly, asyncHandler(deleteQuestion));

export default router;
