import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers, listAllCourses } from '../api/AdminService';

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);

  useEffect(() => {
    listUsers().then((users) => setUserCount(users.length));
    listAllCourses().then((courses) => {
      setCourseCount(courses.length);
      setPublishedCount(courses.filter((c) => c.published).length);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin dashboard</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Overview of users and courses across the platform.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          to="/admin/users"
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Total users</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{userCount ?? '—'}</p>
        </Link>
        <Link
          to="/admin/courses"
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Total courses</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{courseCount ?? '—'}</p>
        </Link>
        <Link
          to="/admin/courses"
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Published courses</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{publishedCount ?? '—'}</p>
        </Link>
      </div>
    </div>
  );
}
