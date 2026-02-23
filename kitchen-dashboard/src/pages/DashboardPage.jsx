import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { kitchenAPI } from "../services/api";
import toast from "react-hot-toast";
import OrderCard from "../components/OrderCard";
import OrderDetailsModal from "../components/OrderDetailsModal";
import LoadingSpinner from "../components/LoadingSpinner";
import { LogOut, RefreshCw, Search, X, Bell } from "lucide-react";
import {
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from "../utils/notification";
import { io } from "socket.io-client";

const DashboardPage = () => {
  const [socketConnected, setSocketConnected] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [undoAction, setUndoAction] = useState(null);
  const previousOrderCount = useRef(0);
  const inactivityTimer = useRef(null);

  useEffect(() => {
    // Get user info
    const userData = localStorage.getItem("kitchenUser");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Request notification permission
    requestNotificationPermission();

    // Fetch orders
    fetchOrders();

    // Poll for new orders every 5 seconds
    const interval = setInterval(fetchOrders, 5000);

    // Setup inactivity logout
    setupInactivityLogout();

    return () => {
      clearInterval(interval);
      clearInactivityTimer();
    };
  }, []);

  // Socket.io connection for real-time updates
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const socket = io(API_URL.replace("/api", ""));

    // Connection established
    socket.on("connect", () => {
      console.log("✅ Connected to kitchen dashboard socket");
      setSocketConnected(true);
      toast.success("Connected to real-time updates");
    });

    // Connection lost
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket");
      setSocketConnected(false);
      toast.error("Lost connection to server");
    });

    // Listen for new orders
    socket.on("new_order", (data) => {
      console.log("📦 New order received:", data.order);

      // Play notification sound
      if (audioRef.current) {
        audioRef.current
          .play()
          .catch((err) => console.log("Sound play failed:", err));
      }

      // Show toast notification
      toast.success(`🎉 ${data.message}`, {
        duration: 5000,
      });

      // Add order to state
      setOrders((prevOrders) => [data.order, ...prevOrders]);
    });

    // Listen for order updates
    socket.on("order_updated", (data) => {
      console.log("🔄 Order updated:", data.order);

      // Show toast notification
      toast(data.message);

      // Update order in state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.order._id ? data.order : order,
        ),
      );
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery]);

  // Check for new orders and play sound
  useEffect(() => {
    if (
      previousOrderCount.current > 0 &&
      orders.length > previousOrderCount.current
    ) {
      const newOrdersCount = orders.length - previousOrderCount.current;

      // Play notification sound
      playNotificationSound();

      // Show browser notification
      showBrowserNotification(
        "New Order Received!",
        `${newOrdersCount} new ${newOrdersCount === 1 ? "order" : "orders"} received`,
      );

      // Visual flash effect
      document.body.classList.add("bg-yellow-100");
      setTimeout(() => {
        document.body.classList.remove("bg-yellow-100");
      }, 500);
    }
    previousOrderCount.current = orders.length;
  }, [orders]);

  const setupInactivityLogout = () => {
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearInactivityTimer();
      inactivityTimer.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIME);
    };

    // Reset timer on user activity
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();
  };

  const clearInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };

  const handleAutoLogout = () => {
    localStorage.removeItem("kitchenToken");
    localStorage.removeItem("kitchenUser");
    toast.error("Logged out due to inactivity");
    navigate("/");
  };

  const fetchOrders = async () => {
    try {
      const response = await kitchenAPI.getAllOrders();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.customer?.name.toLowerCase().includes(query) ||
        order.customer?.email.toLowerCase().includes(query) ||
        order.items.some((item) => item.name.toLowerCase().includes(query)),
    );
    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const oldOrder = orders.find((o) => o._id === orderId);
      const oldStatus = oldOrder.status;

      await kitchenAPI.updateOrderStatus(orderId, newStatus);
      toast.success("Order status updated!");

      // Show undo option
      setUndoAction({
        orderId,
        oldStatus,
        newStatus,
        orderNumber: oldOrder.orderNumber,
      });

      // Clear undo after 5 seconds
      setTimeout(() => {
        setUndoAction(null);
      }, 5000);

      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleUndo = async () => {
    if (!undoAction) return;

    try {
      await kitchenAPI.updateOrderStatus(
        undoAction.orderId,
        undoAction.oldStatus,
      );
      toast.success("Action undone!");
      setUndoAction(null);
      fetchOrders();
    } catch (error) {
      console.error("Error undoing action:", error);
      toast.error("Failed to undo action");
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("kitchenToken");
    localStorage.removeItem("kitchenUser");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleRefresh = () => {
    toast.success("Refreshing orders...");
    fetchOrders();
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Group filtered orders by status
  const receivedOrders = filteredOrders.filter(
    (order) => order.status === "received",
  );
  const preparingOrders = filteredOrders.filter(
    (order) => order.status === "preparing",
  );
  const readyOrders = filteredOrders.filter(
    (order) => order.status === "ready",
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hidden audio element for notifications */}

      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg ${
            socketConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              socketConnected ? "bg-green-500" : "bg-red-500"
            } ${socketConnected ? "animate-pulse" : ""}`}
          />
          <span className="text-sm font-medium">
            {socketConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Kitchen Dashboard
              </h1>
              {user && (
                <p className="text-sm text-gray-600">
                  Welcome back, <span className="font-medium">{user.name}</span>
                </p>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-grow md:mx-8 max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by order #, customer, item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw size={18} />
                <span className="hidden md:inline">Refresh</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Undo Toast */}
      {undoAction && (
        <div className="fixed top-20 right-4 z-50 bg-gray-800 text-white rounded-lg shadow-lg p-4 flex items-center space-x-3 animate-slide-in">
          <Bell className="text-yellow-400" size={20} />
          <div className="flex-grow">
            <p className="font-medium">
              Order #{undoAction.orderNumber} moved to {undoAction.newStatus}
            </p>
          </div>
          <button
            onClick={handleUndo}
            className="bg-yellow-500 text-gray-900 px-3 py-1 rounded font-medium hover:bg-yellow-400 transition"
          >
            Undo
          </button>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="container mx-auto px-4 pt-4">
          <p className="text-gray-600">
            Found {filteredOrders.length}{" "}
            {filteredOrders.length === 1 ? "order" : "orders"} for "
            {searchQuery}"
          </p>
        </div>
      )}

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Received Column */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">New Orders</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {receivedOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {receivedOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No new orders</p>
              ) : (
                receivedOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    onClick={() => handleOrderClick(order)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Preparing</h2>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                {preparingOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {preparingOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No orders in preparation
                </p>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    onClick={() => handleOrderClick(order)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Ready for Pickup
              </h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                {readyOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {readyOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No orders ready
                </p>
              ) : (
                readyOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    onClick={() => handleOrderClick(order)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeModal}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You'll need to login again to
              access the kitchen dashboard.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
