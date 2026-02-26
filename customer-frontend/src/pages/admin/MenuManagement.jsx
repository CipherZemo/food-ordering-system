import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminAPI";
import toast from "react-hot-toast";
import { Plus,Search,Edit,Trash2,Power,PowerOff,ArrowLeft, Copy,X, } from "lucide-react";
import MenuItemModal from "../../components/admin/MenuItemModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminNavbar from "../../components/admin/AdminNavbar";

const MenuManagement = () => {
  // const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const fetchData = async () => {
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        adminService.getAllMenuItems(),
        adminService.getCategories(),
      ]);
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      );
    }

    setFilteredItems(filtered);
  };

  const handleToggleAvailability = async (id) => {
    try {
      await adminService.toggleAvailability(id);
      toast.success("Availability updated");
      fetchData();
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await adminService.deleteMenuItem(id);
      toast.success("Item deleted");
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDuplicate = (item) => {
    const duplicated = {
      ...item,
      name: `${item.name} (Copy)`,
      _id: null,
    };
    setEditingItem(duplicated);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!window.confirm(`Delete ${selectedItems.length} items?`)) return;

    try {
      await adminService.bulkDelete(selectedItems);
      toast.success(`${selectedItems.length} items deleted`);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error("Error bulk deleting items:", error);
      toast.error("Failed to delete items");
    }
  };

  const handleBulkToggle = async (isAvailable) => {
    if (selectedItems.length === 0) return;

    try {
      await adminService.bulkToggle(selectedItems, isAvailable);
      toast.success(`${selectedItems.length} items updated`);
      setSelectedItems([]);
      fetchData();
    } catch (error) {
      console.error("Error bulk updating items:", error);
      toast.error("Failed to update items");
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item._id));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <AdminNavbar />

      {/* Add New Item Button - Move below navbar */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-orange-800 font-medium">
                {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleBulkToggle(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Enable All
                </button>
                <button
                  onClick={() => handleBulkToggle(false)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  Disable All
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredItems.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => toggleSelectItem(item._id)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <img
                          src={`http://localhost:5000${item.image}`}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleAvailability(item._id)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                            item.isAvailable
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.isAvailable ? (
                            <>
                              <Power size={14} />
                              <span>Available</span>
                            </>
                          ) : (
                            <>
                              <PowerOff size={14} />
                              <span>Unavailable</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Duplicate"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id, item.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} items
        </div>
      </div>

      {/* Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditingItem(null);
          fetchData();
        }}
        item={editingItem}
        categories={categories}
      />
    </div>
  );
};

export default MenuManagement;
