import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-orange-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/admin/dashboard" className="text-2xl font-bold hover:text-orange-100 transition">
            🍕 FoodHub Admin
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/admin/dashboard"
              className={`flex items-center space-x-2 hover:text-orange-100 transition font-medium ${
                isActive('/admin/dashboard') ? 'text-orange-100' : ''
              }`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/menu"
              className={`flex items-center space-x-2 hover:text-orange-100 transition font-medium ${
                isActive('/admin/menu') ? 'text-orange-100' : ''
              }`}
            >
              <UtensilsCrossed size={20} />
              <span>Menu Management</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg transition font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu (Simple) */}
          <div className="md:hidden">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-700 hover:bg-orange-800 rounded-lg transition"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;