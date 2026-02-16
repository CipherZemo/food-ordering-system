import { Clock, MapPin, FileText, ChevronRight } from 'lucide-react';
import TimeTracker from './TimeTracker';

const OrderCard = ({ order, onStatusUpdate, onClick }) => {
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

  const handleStatusChange = (e) => {
    e.stopPropagation(); // Prevent card click
    const nextStatus = getNextStatus(order.status);
    if (nextStatus) {
      onStatusUpdate(order._id, nextStatus);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(order);
    }
  };

  const statusButton = getStatusButton(order.status);

  // Get status-based time label
  const getTimeLabel = (status) => {
    const labels = {
      received: 'Waiting',
      preparing: 'Preparing',
      ready: 'Ready',
    };
    return labels[status] || 'Time';
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer"
    >
      {/* Order Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-800">#{order.orderNumber}</h3>
          <p className="text-xs text-gray-500">
            {new Date(order.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-orange-600">${order.totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {/* Time Tracker */}
      <div className="mb-3">
        <TimeTracker startTime={order.createdAt} label={getTimeLabel(order.status)} />
      </div>

      {/* Order Items */}
      <div className="mb-3 space-y-2">
        {order.items.slice(0, 2).map((item, index) => (
          <div key={index} className="text-sm">
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-800">
                {item.quantity}x {item.name}
              </span>
            </div>

            {/* Customizations */}
            {item.customizations && Object.keys(item.customizations).length > 0 && (
              <div className="ml-4 text-xs text-gray-600">
                {Object.entries(item.customizations)
                  .slice(0, 2)
                  .map(([key, value]) => (
                    <p key={key}>
                      • {key}: {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  ))}
              </div>
            )}

            {/* Special Instructions */}
            {item.specialInstructions && (
              <div className="ml-4 mt-1 flex items-start space-x-1">
                <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={12} />
                <p className="text-xs text-blue-700 font-medium line-clamp-1">
                  {item.specialInstructions}
                </p>
              </div>
            )}
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-gray-500 ml-4">+{order.items.length - 2} more items</p>
        )}
      </div>

      {/* Customer Info */}
      <div className="mb-3 pb-3 border-b text-sm">
        <div className="flex items-start space-x-2 text-gray-600">
          <MapPin className="flex-shrink-0 mt-0.5" size={14} />
          <div>
            <p className="font-medium text-gray-800 text-xs">{order.customer?.name}</p>
            <p className="text-xs line-clamp-1">
              {order.deliveryAddress.street}, {order.deliveryAddress.city}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {statusButton && (
        <button
          onClick={handleStatusChange}
          className={`w-full py-2 rounded-lg font-bold text-white transition flex items-center justify-center space-x-2 ${statusButton.color}`}
        >
          <span>{statusButton.text}</span>
          <ChevronRight size={18} />
        </button>
      )}

      {/* Click for Details Hint */}
      <p className="text-center text-xs text-gray-500 mt-2">Click card for full details</p>
    </div>
  );
};

export default OrderCard;