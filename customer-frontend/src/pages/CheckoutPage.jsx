import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../context/CartContext";
import { orderAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  CreditCard,
  MapPin,
  Loader,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { items, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [validatedTotal, setValidatedTotal] = useState(null);

  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "USA",
  });

  const [paymentError, setPaymentError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to checkout");
      navigate("/login?returnUrl=/checkout");
      return;
    }

    // Check if cart is empty
    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    // Load user's saved address
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.address) {
        setDeliveryAddress({
          street: user.address.street || "",
          city: user.address.city || "",
          state: user.address.state || "",
          zipCode: user.address.zipCode || "",
          country: user.address.country || "USA",
        });
      }
    }
  }, [items, navigate]);

  // Create PaymentIntent when component mounts

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setProcessingStep("Initializing payment...");
        const totalWithTax = cartTotal * 1.1;

        const response = await orderAPI.createPaymentIntent(
          totalWithTax,
          items,
          deliveryAddress,
        );

        setClientSecret(response.clientSecret);
        setPaymentIntentId(response.paymentIntentId);
        setValidatedTotal(response.validatedTotal);
        setProcessingStep("");
        setPaymentError(null);
      } catch (error) {
        console.error("Error creating payment intent:", error);

        if (error.response?.data?.expectedTotal) {
          // Price mismatch - show expected total
          setPaymentError({
            type: "price_mismatch",
            message: `Cart total changed. Expected: $${error.response.data.expectedTotal.toFixed(2)}`,
          });
          toast.error("Cart prices changed. Please review and try again.");
        } else if (error.response?.data?.message?.includes("unavailable")) {
          // Item unavailable
          setPaymentError({
            type: "item_unavailable",
            message: error.response.data.message,
          });
          toast.error(error.response.data.message);
        } else {
          setPaymentError({
            type: "generic",
            message: "Failed to initialize payment. Please try again.",
          });
          toast.error("Failed to initialize payment");
        }
      }
    };

    if (items.length > 0) {
      createPaymentIntent();
    }
  }, [cartTotal, items, retryCount]);

  const handleAddressChange = (e) => {
    setDeliveryAddress({
      ...deliveryAddress,
      [e.target.name]: e.target.value,
    });
  };

  const handleRetry = () => {
    setPaymentError(null);
    setRetryCount(retryCount + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate address
    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.zipCode
    ) {
      toast.error("Please provide complete delivery address");
      return;
    }

    if (paymentError) {
      toast.error("Please fix errors before submitting");
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      setProcessingStep("Validating payment details...");

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        },
      );

      if (error) {
        throw error;
      }

      // Handle different payment statuses
      if (paymentIntent.status === "succeeded") {
        setProcessingStep("Payment successful! Creating order...");

        // Wait a moment for webhook to process
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Fetch the order created by webhook
        const orders = await orderAPI.getMyOrders();
        const newOrder = orders.data.find(
          (order) => order.stripePaymentIntentId === paymentIntent.id,
        );

        if (newOrder) {
          clearCart();
          toast.success("Order placed successfully!");
          navigate(`/order-confirmation/${newOrder._id}`);
        } else {
          // Webhook hasn't processed yet, show waiting screen
          toast.success("Payment successful! Processing your order...");
          navigate("/orders");
          clearCart();
        }
      } else if (paymentIntent.status === "requires_action") {
        // 3D Secure authentication required
        setProcessingStep("Additional authentication required...");

        const { error: confirmError, paymentIntent: confirmedPaymentIntent } =
          await stripe.confirmCardPayment(clientSecret);

        if (confirmError) {
          throw confirmError;
        }

        if (confirmedPaymentIntent.status === "succeeded") {
          setProcessingStep("Payment successful! Creating order...");
          clearCart();
          toast.success("Order placed successfully!");
          navigate("/orders");
        }
      } else {
        throw new Error(`Unexpected payment status: ${paymentIntent.status}`);
      }
    } catch (error) {
      console.error("Payment error:", error);

      // Provide specific error messages
      let errorMessage = "Payment failed. Please try again.";
      let errorType = "generic";

      if (error.type === "card_error") {
        errorType = "card_error";
        switch (error.code) {
          case "card_declined":
            errorMessage =
              "Your card was declined. Please try a different card.";
            break;
          case "insufficient_funds":
            errorMessage = "Insufficient funds. Please try a different card.";
            break;
          case "incorrect_cvc":
            errorMessage = "Incorrect CVC code. Please check and try again.";
            break;
          case "expired_card":
            errorMessage =
              "Your card has expired. Please use a different card.";
            break;
          default:
            errorMessage =
              error.message || "Card error. Please try a different card.";
        }
      } else if (error.type === "validation_error") {
        errorType = "validation_error";
        errorMessage = "Please check your card details and try again.";
      }

      setPaymentError({ type: errorType, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setProcessingStep("");
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>

      {/* Price Mismatch Warning */}
      {paymentError?.type === "price_mismatch" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
          <div className="flex-grow">
            <h3 className="font-bold text-yellow-800 mb-1">Price Changed</h3>
            <p className="text-yellow-700 text-sm mb-3">
              {paymentError.message}
            </p>
            <button
              onClick={() => navigate("/cart")}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm"
            >
              Review Cart
            </button>
          </div>
        </div>
      )}

      {/* Item Unavailable Warning */}
      {paymentError?.type === "item_unavailable" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
          <div className="flex-grow">
            <h3 className="font-bold text-red-800 mb-1">Item Unavailable</h3>
            <p className="text-red-700 text-sm mb-3">{paymentError.message}</p>
            <button
              onClick={() => navigate("/cart")}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
            >
              Update Cart
            </button>
          </div>
        </div>
      )}

      {/* Payment Error with Retry */}
      {paymentError &&
        paymentError.type !== "price_mismatch" &&
        paymentError.type !== "item_unavailable" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            <div className="flex-grow">
              <h3 className="font-bold text-red-800 mb-1">Payment Failed</h3>
              <p className="text-red-700 text-sm mb-3">
                {paymentError.message}
              </p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="text-orange-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">
                  Delivery Address
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={deliveryAddress.street}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={deliveryAddress.city}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="New York"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={deliveryAddress.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="NY"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={deliveryAddress.zipCode}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="10001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={deliveryAddress.country}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="USA"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CreditCard className="text-orange-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">
                  Payment Information
                </h2>
              </div>

              <div className="border border-gray-300 rounded-lg p-4">
                <CardElement options={cardElementOptions} />
              </div>

              <p className="text-sm text-gray-500 mt-3">
                Your payment information is secure and encrypted.
              </p>
            </div>

            {/* Processing Status */}
            {processingStep && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                <Loader className="animate-spin text-blue-600" size={20} />
                <span className="text-blue-800 font-medium">
                  {processingStep}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!stripe || loading || !!paymentError}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition flex items-center justify-center space-x-2 ${
                !stripe || loading || paymentError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  Place Order - $
                  {validatedTotal
                    ? validatedTotal.toFixed(2)
                    : (cartTotal * 1.1).toFixed(2)}
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Order Summary
            </h2>

            {/* Items */}
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex justify-between text-sm"
                >
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800">
                      {item.quantity}x {item.name}
                    </p>
                    {Object.keys(item.customizations).length > 0 && (
                      <p className="text-xs text-gray-500">
                        {Object.entries(item.customizations)
                          .map(([key, value]) =>
                            Array.isArray(value) ? value.join(", ") : value,
                          )
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-600 ml-2">
                    ${(item.finalPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              {validatedTotal &&
                Math.abs(validatedTotal - cartTotal * 1.1) > 0.01 && (
                  <div className="flex items-center justify-between text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <span>Server-validated total</span>
                    <span className="font-bold">
                      ${validatedTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-3">
                <span>Total</span>
                <span>
                  $
                  {validatedTotal
                    ? validatedTotal.toFixed(2)
                    : (cartTotal * 1.1).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
