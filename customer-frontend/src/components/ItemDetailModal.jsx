import { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertTriangle } from 'lucide-react';
import QuantityControl from './QuantityControl';

const ItemDetailModal = ({ item, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [totalPrice, setTotalPrice] = useState(item.price);

  useEffect(() => {
    if (isOpen) {
      // Initialize customizations with default values for required fields
      const initialCustomizations = {};
      item.customizationOptions?.forEach((option) => {
        if (option.required && option.choices.length > 0) {
          // Set first choice as default for required options
          const firstChoice = option.choices[0];
          initialCustomizations[option.name] = 
            typeof firstChoice === 'string' ? firstChoice : firstChoice.name;
        }
      });
      setCustomizations(initialCustomizations);
      setQuantity(1);
      setSpecialInstructions('');
    }
  }, [isOpen, item]);

  useEffect(() => {
    calculateTotalPrice();
  }, [customizations, quantity]);

  const calculateTotalPrice = () => {
    let price = item.price;

    item.customizationOptions?.forEach((option) => {
      const selectedValue = customizations[option.name];

      if (!selectedValue) return;

      // Handle multiple selections (checkboxes)
      if (Array.isArray(selectedValue)) {
        selectedValue.forEach((value) => {
          const choice = option.choices.find((c) =>
            typeof c === 'string' ? c === value : c.name === value
          );
          if (choice && typeof choice === 'object' && choice.price) {
            price += choice.price;
          }
        });
      } else {
        // Handle single selection (radio)
        const choice = option.choices.find((c) =>
          typeof c === 'string' ? c === selectedValue : c.name === selectedValue
        );
        if (choice && typeof choice === 'object' && choice.price) {
          price += choice.price;
        }
      }
    });

    setTotalPrice(price);
  };

  const handleSingleChoice = (optionName, choiceValue) => {
    setCustomizations({
      ...customizations,
      [optionName]: choiceValue,
    });
  };

  const handleMultipleChoice = (optionName, choiceValue) => {
    const currentSelections = customizations[optionName] || [];
    const isSelected = currentSelections.includes(choiceValue);

    setCustomizations({
      ...customizations,
      [optionName]: isSelected
        ? currentSelections.filter((v) => v !== choiceValue)
        : [...currentSelections, choiceValue],
    });
  };

  const handleAddToCart = () => {
    // Validate required fields
    const missingRequired = item.customizationOptions?.find(
      (option) => option.required && !customizations[option.name]
    );

    if (missingRequired) {
      alert(`Please select ${missingRequired.name}`);
      return;
    }

    onAddToCart(item, customizations, quantity, specialInstructions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-800">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="w-full h-64 rounded-lg overflow-hidden">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-700 leading-relaxed">{item.description}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-2xl font-bold text-orange-600">
                ₹{item.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">🕐 {item.preparationTime} min</span>
            </div>
          </div>

          {/* Allergen Warnings */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">Allergen Warning</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map((allergen, index) => (
                      <span
                        key={index}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {item.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Nutritional Information */}
          {item.nutritionalInfo && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Nutritional Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {item.nutritionalInfo.calories && (
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {item.nutritionalInfo.calories}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Calories</p>
                  </div>
                )}
                {item.nutritionalInfo.protein && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {item.nutritionalInfo.protein}g
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Protein</p>
                  </div>
                )}
                {item.nutritionalInfo.carbs && (
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {item.nutritionalInfo.carbs}g
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Carbs</p>
                  </div>
                )}
                {item.nutritionalInfo.fat && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {item.nutritionalInfo.fat}g
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Fat</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customization Options */}
          {item.customizationOptions && item.customizationOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Customize Your Order</h3>

              {item.customizationOptions.map((option, index) => {
                const isMultiSelect = option.name.toLowerCase().includes('topping') ||
                  option.name.toLowerCase().includes('extra');

                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">
                        {option.name}
                        {option.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h4>
                      {!option.required && (
                        <span className="text-xs text-gray-500">Optional</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {option.choices.map((choice, choiceIndex) => {
                        const choiceName = typeof choice === 'string' ? choice : choice.name;
                        const choicePrice = typeof choice === 'object' ? choice.price : 0;
                        const isSelected = isMultiSelect
                          ? (customizations[option.name] || []).includes(choiceName)
                          : customizations[option.name] === choiceName;

                        return (
                          <label
                            key={choiceIndex}
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type={isMultiSelect ? 'checkbox' : 'radio'}
                                name={option.name}
                                checked={isSelected}
                                onChange={() =>
                                  isMultiSelect
                                    ? handleMultipleChoice(option.name, choiceName)
                                    : handleSingleChoice(option.name, choiceName)
                                }
                                className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-gray-700">{choiceName}</span>
                            </div>
                            {choicePrice > 0 && (
                              <span className="text-sm text-gray-600">
                                +₹{choicePrice.toFixed(2)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Instructions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Special Instructions</h3>
            <p className="text-sm text-gray-600 mb-3">
              Have any special requests? Let us know! (Optional)
            </p>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., No onions, extra sauce, well done..."
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {specialInstructions.length}/200 characters
            </p>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between border-t pt-6">
            <span className="text-lg font-semibold text-gray-800">Quantity</span>
            <QuantityControl
              quantity={quantity}
              onIncrease={() => setQuantity(quantity + 1)}
              onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
              minQuantity={1}
            />
          </div>

          {/* Total Price */}
          <div className="flex items-center justify-between text-xl font-bold border-t pt-6">
            <span className="text-gray-800">Total</span>
            <span className="text-orange-600">
              ₹{(totalPrice * quantity).toFixed(2)}
            </span>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${
              item.isAvailable
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {item.isAvailable ? 'Add to Cart' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;