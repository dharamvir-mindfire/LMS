import { useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import * as UserService from '../api/UserService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';

const ROLES: UserRole[] = ['admin', 'user'];

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    UserService.listUsers()
      .then(setUsers)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load users')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleRoleChange(user: User, role: UserRole) {
    setError('');
    try {
      await UserService.updateUserRole(user._id, role);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to update role'));
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Delete user "${user.name}"?`)) return;
    setError('');
    try {
      await UserService.deleteUser(user._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete user'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (u) => u.name },
            { key: 'email', header: 'Email', render: (u) => u.email },
            { key: 'questionsAnswered', header: 'Questions answered', render: (u) => u.questionsAnswered ?? 0 },
            {
              key: 'role',
              header: 'Role',
              render: (u) => (
                <select
                  className="select"
                  value={u.role}
                  onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (u) => (
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u)}>
                  Delete
                </button>
              ),
            },
          ]}
          rows={users}
          rowKey={(u) => u._id}
          emptyMessage="No users yet."
        />
      )}
    </div>
  );
}
