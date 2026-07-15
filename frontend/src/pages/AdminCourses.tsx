import { useEffect, useState } from 'react';
import { listAllCourses, deleteCourse } from '../api/AdminService';
import type { Course } from '../types';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    listAllCourses().then(setCourses);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    await deleteCourse(id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Courses</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Instructor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {courses.map((c) => (
              <tr key={c._id}>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{c.title}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.instructor?.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.published
                        ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }
                  >
                    {c.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
