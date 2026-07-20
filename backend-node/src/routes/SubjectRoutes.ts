import { Router } from "express";
import { body } from "express-validator";
import {
  listSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/SubjectController";
import { protect, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

const subjectValidators = [
  body("course").isMongoId().withMessage("a valid course is required"),
  body("name").trim().notEmpty().withMessage("name is required"),
];

router.get("/", protect, asyncHandler(listSubjects));
router.get("/:id", protect, asyncHandler(getSubject));
router.post("/", protect, adminOnly, subjectValidators, asyncHandler(createSubject));
router.put("/:id", protect, adminOnly, asyncHandler(updateSubject));
router.delete("/:id", protect, adminOnly, asyncHandler(deleteSubject));

export default router;
