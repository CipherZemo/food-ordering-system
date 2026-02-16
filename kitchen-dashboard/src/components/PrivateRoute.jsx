import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('kitchenToken');
  const userData = localStorage.getItem('kitchenUser');

  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }

  // Check if user has kitchen or admin role
  const user = JSON.parse(userData);
  if (user.role !== 'kitchen' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;