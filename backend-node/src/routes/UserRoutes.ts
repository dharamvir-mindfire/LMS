import { Router } from "express";
import { body } from "express-validator";
import { listUsers, updateUserRole, deleteUser } from "../controllers/UserController";
import { protect, adminOnly } from "../middleware/auth";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();

router.use(protect, adminOnly);

const updateRoleValidators = [body("role").isIn(["admin", "user"]).withMessage("a valid role is required")];

router.get("/", asyncHandler(listUsers));
router.patch("/:id/role", updateRoleValidators, asyncHandler(updateUserRole));
router.delete("/:id", asyncHandler(deleteUser));

export default router;
