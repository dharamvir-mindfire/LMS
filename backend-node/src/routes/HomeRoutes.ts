import { Router } from "express";
import { getHomeStats } from "../controllers/HomeController";
import { protect } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

router.get("/stats", protect, asyncHandler(getHomeStats));

export default router;
