import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminAPI';
import toast from 'react-hot-toast';
import { X, Plus, Trash2, Upload } from 'lucide-react';

const MenuItemModal = ({ isOpen, onClose, onSuccess, item, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    preparationTime: 15,
  });
  const [customizations, setCustomizations] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category: item.category || '',
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        preparationTime: item.preparationTime || 15,
      });
      setCustomizations(item.customizationOptions || []);
      if (item.image) {
        setImagePreview(`http://localhost:5000${item.image}`);
      }
    } else {
      resetForm();
    }
  }, [item]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isAvailable: true,
      preparationTime: 15,
    });
    setCustomizations([]);
    setImageFile(null);
    setImagePreview('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addCustomization = () => {
    setCustomizations([
      ...customizations,
      {
        name: '',
        type: 'single',
        required: false,
        choices: [''],
      },
    ]);
  };

  const updateCustomization = (index, field, value) => {
    const updated = [...customizations];
    updated[index][field] = value;
    setCustomizations(updated);
  };

  const addChoice = (index) => {
    const updated = [...customizations];
    updated[index].choices.push('');
    setCustomizations(updated);
  };

  const updateChoice = (custIndex, choiceIndex, value) => {
    const updated = [...customizations];
    updated[custIndex].choices[choiceIndex] = value;
    setCustomizations(updated);
  };

  const removeChoice = (custIndex, choiceIndex) => {
    const updated = [...customizations];
    updated[custIndex].choices.splice(choiceIndex, 1);
    setCustomizations(updated);
  };

  const removeCustomization = (index) => {
    const updated = [...customizations];
    updated.splice(index, 1);
    setCustomizations(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('isAvailable', formData.isAvailable);
      data.append('preparationTime', formData.preparationTime);
      data.append('customizationOptions', JSON.stringify(customizations));

      if (imageFile) {
        data.append('image', imageFile);
      }

      if (item?._id) {
        await adminService.updateMenuItem(item._id, data);
        toast.success('Item updated successfully');
      } else {
        await adminService.createMenuItem(data);
        toast.success('Item created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {item?._id ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                list="categories-list"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <datalist id="categories-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Prep Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preparation Time (minutes)
              </label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <div className="flex items-center space-x-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <label className="flex items-center space-x-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition">
                <Upload size={20} />
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-gray-700">
              Item is available
            </label>
          </div>

          {/* Customization Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Customization Options
              </h3>
              <button
                type="button"
                onClick={addCustomization}
                className="flex items-center space-x-1 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
              >
                <Plus size={18} />
                <span>Add Option</span>
              </button>
            </div>

            <div className="space-y-4">
              {customizations.map((custom, custIndex) => (
                <div key={custIndex} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="text"
                      value={custom.name}
                      onChange={(e) =>
                        updateCustomization(custIndex, 'name', e.target.value)
                      }
                      placeholder="Option name (e.g., Size, Toppings)"
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomization(custIndex)}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <select
                      value={custom.type}
                      onChange={(e) =>
                        updateCustomization(custIndex, 'type', e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                    </select>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={custom.required}
                        onChange={(e) =>
                          updateCustomization(custIndex, 'required', e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Required</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Choices:</label>
                    {custom.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={choice}
                          onChange={(e) =>
                            updateChoice(custIndex, choiceIndex, e.target.value)
                          }
                          placeholder="Choice (e.g., Small, Medium, Large)"
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeChoice(custIndex, choiceIndex)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addChoice(custIndex)}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      + Add Choice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium text-white transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {loading ? 'Saving...' : item?._id ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemModal;