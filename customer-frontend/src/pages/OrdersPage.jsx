import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { orderAPI } from "../services/api";
import { useCart } from "../context/CartContext";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";
import { Package, Clock, RefreshCw } from "lucide-react";

const OrdersPage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchOrders();

    const interval = setInterval(() => {
      fetchOrders();
    }, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval); // Cleanup interval when user leaves page
    
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (order) => {
    // Add all items from the order to cart
    let itemsAdded = 0;

    order.items.forEach((item) => {
      // Get the menu item details from the populated data
      const menuItem = item.menuItem;

      if (menuItem && menuItem.isAvailable) {
        addToCart(
          menuItem,
          item.customizations || {},
          item.quantity,
          item.specialInstructions || "",
        );
        itemsAdded++;
      }
    });

    if (itemsAdded > 0) {
      toast.success(
        `${itemsAdded} item${itemsAdded > 1 ? "s" : ""} added to cart!`,
      );
      navigate("/cart");
    } else {
      toast.error("Items from this order are no longer available");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      received: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No orders yet
          </h2>
          <p className="text-gray-600 mb-6">Start ordering delicious food!</p>
          <button
            onClick={() => navigate("/")}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
          >
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      Order #{order.orderNumber}
                    </h3>
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status,
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Reorder Button */}
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    <RefreshCw size={18} />
                    <span>Reorder</span>
                  </button>

                  {/* Expand/Collapse view details button Button */}
                  <button
                    onClick={() => toggleOrderDetails(order._id)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    {expandedOrderId === order._id
                      ? "Hide Details"
                      : "View Details"}
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="mb-4">
                <p className="text-gray-700 font-medium mb-2">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "item" : "items"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <span key={index} className="text-sm text-gray-600">
                      {item.quantity}x {item.name}
                      {index < Math.min(order.items.length, 3) - 1 && ","}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm text-gray-500">
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Estimated Pickup Time */}
              {order.estimatedPickupTime && order.status !== "completed" && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <Clock size={16} />
                  <span>
                    Estimated pickup:{" "}
                    {new Date(order.estimatedPickupTime).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Expanded Details */}
              {expandedOrderId === order._id && (
                <div className="border-t mt-4 pt-4 space-y-4 animate-fadeIn">
                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Delivery Address
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {order.deliveryAddress.street}
                        <br />
                        {order.deliveryAddress.city},{" "}
                        {order.deliveryAddress.state}{" "}
                        {order.deliveryAddress.zipCode}
                        <br />
                        {order.deliveryAddress.country}
                      </p>
                    </div>
                  )}

                  {/* All Items with Details */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start bg-gray-50 rounded-lg p-3"
                        >
                          <div className="flex-grow">
                            <p className="font-medium text-gray-800">
                              {item.quantity}x {item.name}
                            </p>
                            {item.customizations &&
                              Object.keys(item.customizations).length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {Object.entries(item.customizations)
                                    .map(
                                      ([key, value]) =>
                                        `${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
                                    )
                                    .join(" • ")}
                                </p>
                              )}
                            {item.specialInstructions && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium text-gray-800">
                              ₹{item.subtotal.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ₹{item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">
                      Payment Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <span className="text-gray-800 font-medium capitalize">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span
                          className={`font-medium ${order.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      </div>
                      {order.razorpayPaymentId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment ID:</span>
                          <span className="text-gray-500 text-xs">
                            {order.razorpayPaymentId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
