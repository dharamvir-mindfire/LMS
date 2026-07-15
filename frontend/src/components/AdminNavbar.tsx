import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link to="/admin" className="text-lg font-semibold text-white">
            LMS Admin
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/admin" className="text-gray-300 hover:text-white">
              Dashboard
            </Link>
            <Link to="/admin/users" className="text-gray-300 hover:text-white">
              Users
            </Link>
            <Link to="/admin/courses" className="text-gray-300 hover:text-white">
              Courses
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="text-gray-400 hover:text-white">
            View site
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-md bg-white px-3 py-1.5 text-gray-900 hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
