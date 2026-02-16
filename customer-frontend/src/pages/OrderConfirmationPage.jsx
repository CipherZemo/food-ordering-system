import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';
import { CheckCircle, Clock, MapPin, Package } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Order not found</h2>
        <Link to="/" className="text-orange-600 hover:text-orange-700">
          Return to Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-8 text-center">
        <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-4">
          Thank you for your order. We've received it and will start preparing your food.
        </p>
        <p className="text-sm text-gray-500">
          Order Number: <span className="font-bold text-gray-800">{order.orderNumber}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estimated Pickup Time */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Estimated Pickup Time</h2>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {new Date(order.estimatedPickupTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-gray-600 mt-2">
              {new Date(order.estimatedPickupTime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MapPin className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Delivery Address</h2>
            </div>
            <p className="text-gray-700">
              {order.deliveryAddress.street}<br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}<br />
              {order.deliveryAddress.country}
            </p>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Package className="text-orange-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">Order Items</h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-start space-x-4 border-b pb-4 last:border-b-0">
                  <img
                    src={item.menuItem.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-grow">
                    <h3 className="font-bold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    
                    {/* Customizations */}
                    {item.customizations && Object.keys(item.customizations).length > 0 && (
                      <div className="mt-1">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <p key={key} className="text-xs text-gray-500">
                            {key}: {Array.isArray(value) ? value.join(', ') : value}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Special Instructions */}
                    {item.specialInstructions && (
                      <p className="text-xs text-blue-600 mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-gray-800">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Status</span>
                <span className="font-medium text-orange-600 capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment</span>
                <span className="font-medium text-green-600 capitalize">{order.paymentStatus}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                to="/orders"
                className="block w-full bg-orange-600 text-white py-3 rounded-lg font-bold text-center hover:bg-orange-700 transition"
              >
                View All Orders
              </Link>
              <Link
                to="/"
                className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium text-center hover:bg-gray-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;