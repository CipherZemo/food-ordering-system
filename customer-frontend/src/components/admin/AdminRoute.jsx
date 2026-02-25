import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { adminService } from '../../services/adminAPI';
import toast from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        await adminService.verifyAdmin();
        setIsAdmin(true);
      } catch (error) {
        setIsAdmin(false);
        console.error('Admin verification failed:', error);
        toast.error('Access denied. Admin privileges required.');
      } finally {
        setLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default AdminRoute;