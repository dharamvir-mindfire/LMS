import { Router } from 'express';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enroll,
} from '../controllers/CourseController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listCourses);
router.get('/:id', requireAuth, getCourse);
router.post('/', requireAuth, requireRole('instructor', 'admin'), createCourse);
router.put('/:id', requireAuth, requireRole('instructor', 'admin'), updateCourse);
router.delete('/:id', requireAuth, requireRole('instructor', 'admin'), deleteCourse);
router.post('/:id/enroll', requireAuth, requireRole('student'), enroll);

export default router;
