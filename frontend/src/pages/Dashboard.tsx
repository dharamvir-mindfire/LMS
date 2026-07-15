import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome, {user?.name}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Role: {user?.role}</p>
    </div>
  );
}
