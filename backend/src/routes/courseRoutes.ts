import { Router } from "express";
import { body } from "express-validator";
import { listCourses, getCourse, createCourse, updateCourse, deleteCourse } from "../controllers/CourseController";
import { protect, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

const courseValidators = [body("title").trim().notEmpty().withMessage("title is required")];

router.get("/", protect, asyncHandler(listCourses));
router.get("/:id", protect, asyncHandler(getCourse));
router.post("/", protect, adminOnly, courseValidators, asyncHandler(createCourse));
router.put("/:id", protect, adminOnly, courseValidators, asyncHandler(updateCourse));
router.delete("/:id", protect, adminOnly, asyncHandler(deleteCourse));

export default router;
