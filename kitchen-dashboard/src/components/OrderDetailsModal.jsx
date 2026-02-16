import { X, Clock, MapPin, FileText, User, DollarSign } from 'lucide-react';
import TimeTracker from './TimeTracker';

const OrderDetailsModal = ({ order, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen || !order) return null;

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      received: 'preparing',
      preparing: 'ready',
      ready: 'completed',
    };
    return statusFlow[currentStatus];
  };

  const getStatusButton = (status) => {
    const buttons = {
      received: { text: 'Start Preparing', color: 'bg-blue-600 hover:bg-blue-700' },
      preparing: { text: 'Mark Ready', color: 'bg-orange-600 hover:bg-orange-700' },
      ready: { text: 'Complete Order', color: 'bg-green-600 hover:bg-green-700' },
    };
    return buttons[status] || null;
  };

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus) {
      onStatusUpdate(order._id, nextStatus);
      onClose();
    }
  };

  const statusButton = getStatusButton(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Order #{order.orderNumber}
            </h2>
            <TimeTracker startTime={order.createdAt} label="Total time" />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="text-blue-600" size={20} />
                <h3 className="font-bold text-blue-900">Order Time</h3>
              </div>
              <p className="text-blue-800">
                {new Date(order.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {order.estimatedPickupTime && (
                <p className="text-sm text-blue-700 mt-1">
                  Pickup: {new Date(order.estimatedPickupTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="text-green-600" size={20} />
                <h3 className="font-bold text-green-900">Total Amount</h3>
              </div>
              <p className="text-3xl font-bold text-green-800">
                ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <User className="text-gray-600" size={20} />
              <h3 className="font-bold text-gray-800">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-800">{order.customer?.name}</p>
                <p className="text-sm text-gray-600">{order.customer?.email}</p>
                {order.customer?.phone && (
                  <p className="text-sm text-gray-600">{order.customer.phone}</p>
                )}
              </div>
              <div>
                <div className="flex items-start space-x-2">
                  <MapPin className="text-gray-600 flex-shrink-0 mt-0.5" size={16} />
                  <div className="text-sm text-gray-700">
                    <p>{order.deliveryAddress.street}</p>
                    <p>
                      {order.deliveryAddress.city}, {order.deliveryAddress.state}{' '}
                      {order.deliveryAddress.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-lg">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-800 text-lg">
                        {item.quantity}x {item.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Customizations */}
                  {item.customizations && Object.keys(item.customizations).length > 0 && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="font-semibold text-orange-900 text-sm mb-2">
                        Customizations:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(item.customizations).map(([key, value]) => (
                          <p key={key} className="text-sm text-orange-800">
                            <span className="font-medium">{key}:</span>{' '}
                            {Array.isArray(value) ? value.join(', ') : value}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <div className="mt-3 bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="font-semibold text-blue-900 text-sm">
                            Special Instructions:
                          </p>
                          <p className="text-blue-800 font-medium">
                            {item.specialInstructions}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 border-t pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Close
            </button>
            {statusButton && (
              <button
                onClick={handleStatusChange}
                className={`flex-1 px-6 py-3 rounded-lg font-bold text-white transition ${statusButton.color}`}
              >
                {statusButton.text}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;