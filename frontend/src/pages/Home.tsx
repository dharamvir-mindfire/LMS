import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
        Learning Management System
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        Browse courses, enroll, and track your progress.
      </p>
      <Link
        to="/courses"
        className="mt-8 inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
      >
        View courses
      </Link>
    </div>
  );
}
