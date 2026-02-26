import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UtensilsCrossed,  } from "lucide-react";
import AdminNavbar from "../../components/admin/AdminNavbar";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Menu Management Card */}
          <button
            onClick={() => navigate("/admin/menu")}
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition text-left group"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-orange-100 p-4 rounded-lg group-hover:bg-orange-200 transition">
                <UtensilsCrossed size={32} className="text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Menu Management
              </h3>
            </div>
            <p className="text-gray-600">
              Add, edit, and manage menu items, categories, and availability
            </p>
          </button>

          {/* Dashboard Card (Future) */}
          <div className="bg-white rounded-lg shadow-md p-8 opacity-50 cursor-not-allowed">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <LayoutDashboard size={32} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-400">Analytics</h3>
            </div>
            <p className="text-gray-400">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
