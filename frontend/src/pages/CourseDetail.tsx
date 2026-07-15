import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getCourse, enrollInCourse } from '../api/CourseService';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) getCourse(id).then(setCourse);
  }, [id]);

  async function handleEnroll() {
    if (!id) return;
    try {
      await enrollInCourse(id);
      setMessage('Enrolled successfully');
    } catch (err) {
      setMessage((isAxiosError(err) && err.response?.data?.message) || 'Enrollment failed');
    }
  }

  if (!course) return <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{course.title}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">{course.description}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Instructor: {course.instructor?.name}</p>

      {user?.role === 'student' && (
        <button
          onClick={handleEnroll}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Enroll
        </button>
      )}
      {message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>}

      <h2 className="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Lessons</h2>
      <ol className="mt-3 flex flex-col gap-2">
        {course.lessons?.map((l) => (
          <li
            key={l._id}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            {l.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
