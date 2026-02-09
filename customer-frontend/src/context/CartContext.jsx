import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Action types
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  LOAD_CART: 'LOAD_CART',
};

// Helper function to generate unique cart item ID based on customizations and instructions
const generateCartItemId = (menuItemId, customizations, specialInstructions) => {
  const customizationString = JSON.stringify(customizations || {});
  const instructionsString = specialInstructions || '';
  const combinedString = `${customizationString}-${instructionsString}`;
  return `${menuItemId}-${btoa(combinedString)}`; // Base64 encode for unique ID
};

// Calculate item price with customizations
const calculateItemPrice = (basePrice, customizationOptions, selectedCustomizations) => {
  let totalPrice = basePrice;

  if (!customizationOptions || !selectedCustomizations) {
    return totalPrice;
  }

  customizationOptions.forEach((option) => {
    const selectedValue = selectedCustomizations[option.name];
    
    if (!selectedValue) return;

    // Handle array selections (multiple choices like toppings)
    if (Array.isArray(selectedValue)) {
      selectedValue.forEach((value) => {
        const choice = option.choices.find((c) => 
          typeof c === 'string' ? c === value : c.name === value
        );
        if (choice && typeof choice === 'object' && choice.price) {
          totalPrice += choice.price;
        }
      });
    } else {
      // Handle single selection (like size)
      const choice = option.choices.find((c) => 
        typeof c === 'string' ? c === selectedValue : c.name === selectedValue
      );
      if (choice && typeof choice === 'object' && choice.price) {
        totalPrice += choice.price;
      }
    }
  });

  return totalPrice;
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { menuItem, customizations, quantity, specialInstructions } = action.payload;
      const cartItemId = generateCartItemId(menuItem._id, customizations, specialInstructions);

      const existingItemIndex = state.items.findIndex(
        (item) => item.cartItemId === cartItemId
      );

      const finalPrice = calculateItemPrice(
        menuItem.price,
        menuItem.customizationOptions,
        customizations
      );

      if (existingItemIndex > -1) {
        // Item with same customizations AND instructions exists, increase quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return {
          ...state,
          items: updatedItems,
        };
      } else {
        // New item configuration
        const newItem = {
          cartItemId,
          ...menuItem,
          customizations: customizations || {},
          specialInstructions: specialInstructions || '',
          quantity,
          finalPrice,
        };
        return {
          ...state,
          items: [...state.items, newItem],
        };
      }
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter((item) => item.cartItemId !== action.payload),
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const updatedItems = state.items.map((item) =>
        item.cartItemId === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

      // Remove items with quantity 0
      const filteredItems = updatedItems.filter((item) => item.quantity > 0);

      return {
        ...state,
        items: filteredItems,
      };
    }

    case CART_ACTIONS.CLEAR_CART: {
      return {
        ...state,
        items: [],
      };
    }

    case CART_ACTIONS.LOAD_CART: {
      return {
        ...state,
        items: action.payload,
      };
    }

    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: [],
};

// Cart Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  // Computed values
  const cartItemCount = state.items.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = state.items.reduce(
    (total, item) => total + item.finalPrice * item.quantity,
    0
  );

  // Actions
  const addToCart = (menuItem, customizations = {}, quantity = 1, specialInstructions = '') => {
    dispatch({
      type: CART_ACTIONS.ADD_ITEM,
      payload: { menuItem, customizations, quantity, specialInstructions },
    });
  };

  const removeFromCart = (cartItemId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: cartItemId });
  };

  const updateQuantity = (cartItemId, quantity) => {
    dispatch({
      type: CART_ACTIONS.UPDATE_QUANTITY,
      payload: { id: cartItemId, quantity },
    });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const value = {
    items: state.items,
    cartItemCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};