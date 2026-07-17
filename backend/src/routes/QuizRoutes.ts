import { Router } from "express";
import { body } from "express-validator";
import {
  listQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startQuiz,
  submitQuiz,
} from "../controllers/QuizController";
import { protect, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

const quizValidators = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("subjects").isArray({ min: 1 }).withMessage("at least 1 subject is required"),
  body("subjects.*").isMongoId().withMessage("a valid subject is required"),
  body("questions").isArray({ min: 1 }).withMessage("at least 1 question is required"),
];

const submitValidators = [body("answers").isArray({ min: 1 }).withMessage("at least 1 answer is required")];

router.get("/", protect, asyncHandler(listQuizzes));
router.get("/:id", protect, asyncHandler(getQuiz));
router.post("/:id/start", protect, asyncHandler(startQuiz));
router.post("/:id/submit", protect, submitValidators, asyncHandler(submitQuiz));
router.post("/", protect, adminOnly, quizValidators, asyncHandler(createQuiz));
router.put("/:id", protect, adminOnly, asyncHandler(updateQuiz));
router.delete("/:id", protect, adminOnly, asyncHandler(deleteQuiz));

export default router;
