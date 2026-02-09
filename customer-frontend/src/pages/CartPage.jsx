import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, FileText } from 'lucide-react';
import QuantityControl from '../components/QuantityControl';

const CartPage = () => {
  const { items, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const handleQuantityIncrease = (cartItemId, currentQuantity) => {
    updateQuantity(cartItemId, currentQuantity + 1);
  };

  const handleQuantityDecrease = (cartItemId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(cartItemId, currentQuantity - 1);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
        >
          <Trash2 size={18} />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="bg-white rounded-lg shadow-md p-4 flex items-start space-x-4"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />

              {/* Details */}
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>

                {/* Customizations */}
                {item.customizations && Object.keys(item.customizations).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(item.customizations).map(([key, value]) => (
                      <p key={key} className="text-sm text-gray-600">
                        <span className="font-medium">{key}:</span>{' '}
                        {Array.isArray(value) ? value.join(', ') : value}
                      </p>
                    ))}
                  </div>
                )}

                {/* Special Instructions */}
                {item.specialInstructions && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    <div className="flex items-start space-x-2">
                      <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <p className="text-xs font-semibold text-blue-800">Special Instructions:</p>
                        <p className="text-sm text-blue-700">{item.specialInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-gray-600 text-sm mt-2">
                  ${item.finalPrice.toFixed(2)} each
                </p>
                <p className="text-orange-600 font-medium mt-1">
                  Subtotal: ${(item.finalPrice * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col items-end space-y-3">
                <QuantityControl
                  quantity={item.quantity}
                  onIncrease={() => handleQuantityIncrease(item.cartItemId, item.quantity)}
                  onDecrease={() => handleQuantityDecrease(item.cartItemId, item.quantity)}
                />

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-800">
                <span>Total</span>
                <span>${(cartTotal * 1.1).toFixed(2)}</span>
              </div>
            </div>

            <button
              className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition"
              onClick={() => alert('Checkout will be implemented in later steps!')}
            >
              Proceed to Checkout
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;