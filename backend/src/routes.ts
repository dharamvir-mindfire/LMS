import { Router } from "express";
import authRoutes from "./routes/AuthRoutes";
import userRoutes from "./routes/UserRoutes";
import courseRoutes from "./routes/CourseRoutes";
import subjectRoutes from "./routes/SubjectRoutes";
import questionRoutes from "./routes/QuestionRoutes";
import quizRoutes from "./routes/QuizRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/subjects", subjectRoutes);
router.use("/questions", questionRoutes);
router.use("/quizzes", quizRoutes);

export default router;
