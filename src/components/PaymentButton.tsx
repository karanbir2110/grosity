import React, { useState } from "react";
import { RAZORPAY_KEY_ID } from "../utils/razorpayConfig";
import type {
  RazorpayOptions,
  RazorpaySuccessResponse
} from "../types/razorpay.d";

interface PaymentButtonProps {
  amount: number; // INR
  currency?: string;
  productName?: string;
  receipt?: string;
  notes?: Record<string, string>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onError?: (error: any) => void;
  onClose?: () => void;
  disabled?: boolean; // Add disabled prop
}

const CREATE_ORDER_URL =
  "https://dtnnozzuixtaomabgfxf.supabase.co/functions/v1/create-razorpay-order";

const VERIFY_PAYMENT_URL =
  "https://dtnnozzuixtaomabgfxf.supabase.co/functions/v1/verify-payment";

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  currency = "INR",
  productName = "Product",
  receipt,
  notes,
  customerName,
  customerEmail,
  customerPhone,
  className = "",
  children,
  onSuccess,
  onError,
  onClose,
  disabled = false, // Add disabled prop with default
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------------------------
     Load Razorpay SDK
  ---------------------------------------- */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  /* ----------------------------------------
     Create Razorpay Order (Backend)
  ---------------------------------------- */
  const createOrder = async () => {
    const res = await fetch(CREATE_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        receipt,
        notes
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Create order failed:", text);
      throw new Error("Failed to create Razorpay order");
    }

    return res.json();
  };

  /* ----------------------------------------
     Verify Payment (Backend)
  ---------------------------------------- */
  const verifyPayment = async (response: RazorpaySuccessResponse) => {
    const res = await fetch(VERIFY_PAYMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        amount,
        currency,
        receipt,
        notes
      })
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Verification failed:", text);
      throw new Error("Payment verification failed");
    }

    return res.json();
  };

  /* ----------------------------------------
     Main Payment Handler
  ---------------------------------------- */
  const handlePayment = async () => {
    // Prevent payment if disabled
    if (disabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!RAZORPAY_KEY_ID) {
        throw new Error("Razorpay key not configured");
      }

      if (amount <= 0) {
        throw new Error("Invalid payment amount");
      }

      // 1️⃣ Load SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // 2️⃣ Create Order
      const order = await createOrder();

      // 3️⃣ Configure Razorpay
      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount, // paise
        currency,
        name: "Grosity",
        description: `Payment for ${productName}`,
        order_id: order.id,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        notes: notes || {},
        theme: { color: "#2563eb" },

        handler: async (response: RazorpaySuccessResponse) => {
          try {
            await verifyPayment(response);
            onSuccess?.(response);
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
            onError?.(err);
          }
        },

        modal: {
          ondismiss: () => {
            onClose?.();
          }
        }
      };

      // 4️⃣ Open Razorpay
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (resp: any) => {
        const msg = resp.error?.description || "Payment failed";
        setError(msg);
        onError?.(resp.error);
      });

      razorpay.open();

    } catch (err: any) {
      setError(err.message || "Something went wrong");
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-button-wrapper">
      <button
        onClick={handlePayment}
        disabled={loading || disabled} // Combine loading and disabled states
        className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className} ${disabled ? 'opacity-50' : ''}`}
      >
        {loading ? "Processing..." : children || `Pay ₹${amount}`}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;