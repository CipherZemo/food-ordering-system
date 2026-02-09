import { Plus, Minus } from 'lucide-react';

const QuantityControl = ({ quantity, onIncrease, onDecrease, minQuantity = 1 }) => {
  return (
    <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
      <button
        onClick={onDecrease}
        disabled={quantity <= minQuantity}
        className={`p-2 rounded-md transition ${
          quantity <= minQuantity
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-orange-600 hover:bg-orange-100'
        }`}
      >
        <Minus size={18} />
      </button>

      <span className="text-lg font-bold text-gray-800 w-8 text-center">
        {quantity}
      </span>

      <button
        onClick={onIncrease}
        className="p-2 rounded-md text-orange-600 hover:bg-orange-100 transition"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

export default QuantityControl;