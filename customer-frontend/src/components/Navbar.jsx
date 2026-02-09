import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const Navbar = ({ cartItemCount }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="bg-orange-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold hover:text-orange-100 transition">
            🍕 FoodHub
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-orange-100 transition font-medium">
              Menu
            </Link>
            <Link to="/orders" className="hover:text-orange-100 transition font-medium">
              My Orders
            </Link>

            {/* Cart Icon with Badge */}
            <Link to="/cart" className="relative hover:text-orange-100 transition">
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="hover:text-orange-100 transition">
                  <User size={24} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="hover:text-orange-100 transition flex items-center space-x-1"
                >
                  <LogOut size={20} />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;