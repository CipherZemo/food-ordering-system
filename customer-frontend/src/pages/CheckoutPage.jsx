import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { orderAPI } from "../services/api";
import toast from "react-hot-toast";
import { CreditCard, MapPin, Loader, AlertTriangle, CheckCircle } from "lucide-react";

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [validatedTotal, setValidatedTotal] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
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
          country: user.address.country || "India",
        });
      }
    }
  }, [items, navigate]);

  // Load Razorpay script
  useEffect(() => {
    const loadScript = async () => {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Failed to load payment gateway. Please check your internet connection.");
        setPaymentError({
          type: "script_load_failed",
          message: "Failed to load Razorpay. Please refresh the page.",
        });
      } else {
        setScriptLoaded(true);
      }
    };
    loadScript();
  }, []);

  // Create Razorpay Order when component mounts
  useEffect(() => {
    const createRazorpayOrder = async () => {
      if (!scriptLoaded) return;

      try {
        setProcessingStep("Initializing payment...");
        const totalWithTax = cartTotal * 1.1;

        const response = await orderAPI.createRazorpayOrder(
          totalWithTax,
          items,
          deliveryAddress
        );

        setRazorpayOrderId(response.orderId);
        setRazorpayKey(response.key);
        setValidatedTotal(response.validatedTotal);
        setProcessingStep("");
        setPaymentError(null);
      } catch (error) {
        console.error("Error creating Razorpay order:", error);

        if (error.response?.data?.expectedTotal) {
          // Price mismatch - show expected total
          setPaymentError({
            type: "price_mismatch",
            message: `Cart total changed. Expected: ₹${error.response.data.expectedTotal.toFixed(2)}`,
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

    if (items.length > 0 && scriptLoaded) {
      createRazorpayOrder();
    }
  }, [cartTotal, items, retryCount, scriptLoaded]);

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

  const handlePayment = async () => {
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

    if (!razorpayOrderId || !razorpayKey) {
      toast.error("Payment not initialized. Please refresh the page.");
      return;
    }

    setLoading(true);
    setProcessingStep("Opening payment gateway...");

    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    const options = {
      key: razorpayKey,
      amount: Math.round(validatedTotal * 100), // Amount in paise
      currency: "INR",
      name: "Food Ordering System",
      description: "Order Payment",
      order_id: razorpayOrderId,
      prefill: {
        name: userData.name || "",
        email: userData.email || "",
        contact: userData.phone || "",
      },
      theme: {
        color: "#ea580c", // Orange color matching your theme
      },
      handler: async function (response) {
        setProcessingStep("Verifying payment...");

        try {
          // Verify payment on backend
          const verifyResponse = await orderAPI.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            items,
            totalAmount: validatedTotal,
            deliveryAddress,
          });

          if (verifyResponse.success) {
            setProcessingStep("Payment successful! Creating order...");
            clearCart();
            toast.success("Order placed successfully!");
            navigate(`/orders`);
          } else {
            throw new Error("Payment verification failed");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error("Payment verification failed. Please contact support.");
          setPaymentError({
            type: "verification_failed",
            message: "Payment verification failed. Your payment is safe. Please contact support.",
          });
        } finally {
          setLoading(false);
          setProcessingStep("");
        }
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          setProcessingStep("");
          toast.error("Payment cancelled");
        },
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      setLoading(false);
      setProcessingStep("");

      let errorMessage = "Payment failed. Please try again.";
      if (response.error.description) {
        errorMessage = response.error.description;
      }

      toast.error(errorMessage);
      setPaymentError({
        type: "payment_failed",
        message: errorMessage,
      });
    });

    razorpay.open();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Checkout</h1>

      {/* Error Display */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                {paymentError.type === "price_mismatch" && "Price Mismatch Detected"}
                {paymentError.type === "item_unavailable" && "Item Unavailable"}
                {paymentError.type === "script_load_failed" && "Payment Gateway Error"}
                {paymentError.type === "verification_failed" && "Verification Failed"}
                {paymentError.type === "payment_failed" && "Payment Failed"}
                {paymentError.type === "generic" && "Payment Error"}
              </h3>
              <p className="text-red-700">{paymentError.message}</p>
              <button
                onClick={handleRetry}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
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
                    placeholder="Mumbai"
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
                    placeholder="Maharashtra"
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
                    placeholder="400001"
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
                    placeholder="India"
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

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Secure Payment with Razorpay
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You'll be redirected to Razorpay's secure payment page where you can pay using:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Credit/Debit Cards</li>
                      <li>UPI (Google Pay, PhonePe, Paytm, etc.)</li>
                      <li>Net Banking</li>
                      <li>Wallets</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-3">
                🔒 Your payment information is secure and encrypted by Razorpay.
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

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={loading || !!paymentError || !scriptLoaded}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition flex items-center justify-center space-x-2 ${
                loading || paymentError || !scriptLoaded
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
                  Pay ₹
                  {validatedTotal
                    ? validatedTotal.toFixed(2)
                    : (cartTotal * 1.1).toFixed(2)}
                </span>
              )}
            </button>
          </div>
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
                            Array.isArray(value) ? value.join(", ") : value
                          )
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-600 ml-2">
                    ₹{(item.finalPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>₹{(cartTotal * 0.1).toFixed(2)}</span>
              </div>
              {validatedTotal &&
                Math.abs(validatedTotal - cartTotal * 1.1) > 0.01 && (
                  <div className="flex items-center justify-between text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <span>Server-validated total</span>
                    <span className="font-bold">
                      ₹{validatedTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-3">
                <span>Total</span>
                <span>
                  ₹
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