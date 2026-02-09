import { Plus } from 'lucide-react';

const MenuItem = ({ item, onAddToCart }) => {
  return (
    <div 
      onClick={() => onAddToCart(item)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    >
      {/* Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
          <span className="text-orange-600 font-bold text-lg">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {item.description}
        </p>

        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-block bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium">
            {item.category.replace('-', ' ')}
          </span>
          <span className="text-xs text-gray-500">
            🕐 {item.preparationTime} min
          </span>
        </div>

        {/* Availability */}
        {!item.isAvailable && (
          <p className="text-red-500 text-sm font-medium mb-2">
            Currently Unavailable
          </p>
        )}

        {/* View Details Badge */}
        <div className="flex items-center justify-center text-orange-600 text-sm font-medium">
          <Plus size={16} />
          <span>Click to view details & customize</span>
        </div>
      </div>
    </div>
  );
};

export default MenuItem;