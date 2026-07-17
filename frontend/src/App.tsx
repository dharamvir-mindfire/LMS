import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Courses } from './pages/Courses';
import { Subjects } from './pages/Subjects';
import { Questions } from './pages/Questions';
import { Quizzes } from './pages/Quizzes';
import { Users } from './pages/Users';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/quizzes" element={<Quizzes />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
