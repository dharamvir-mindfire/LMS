import { useEffect, useState } from 'react';
import { listUsers, updateUserRole, deleteUser } from '../api/AdminService';
import type { User, UserRole } from '../types';

const ROLES: UserRole[] = ['student', 'instructor', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    load();
  }, []);

  function load() {
    listUsers().then(setUsers);
  }

  async function handleRoleChange(id: string, role: UserRole) {
    await updateUserRole(id, role);
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    await deleteUser(id);
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-gray-900 dark:text-white">{u.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
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
