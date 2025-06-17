import { Outlet, Navigate } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  console.log('ProtectedRoute token:', token); // Debug
  if (!token) {
    console.log('No token, redirecting to /login'); // Debug
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;