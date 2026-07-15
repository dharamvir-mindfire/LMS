import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listCourses, createCourse } from '../api/CourseService';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    load();
  }, []);

  function load() {
    listCourses().then(setCourses);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createCourse(title, description);
    setTitle('');
    setDescription('');
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Courses</h1>

      {user?.role === 'instructor' && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
            <input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Create course
          </button>
        </form>
      )}

      <ul className="mt-6 flex flex-col gap-3">
        {courses.map((c) => (
          <li
            key={c._id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <Link to={`/courses/${c._id}`} className="font-medium text-gray-900 hover:underline dark:text-white">
              {c.title}
            </Link>
            <span className="text-sm text-gray-500 dark:text-gray-400">by {c.instructor?.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
