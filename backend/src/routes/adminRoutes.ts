import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  deleteUser,
  listAllCourses,
  deleteCourse,
} from '../controllers/AdminController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/courses', listAllCourses);
router.delete('/courses/:id', deleteCourse);

export default router;
