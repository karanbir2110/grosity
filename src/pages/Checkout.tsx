import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface ProfileForm {
  full_name: string;
  mobile: string;
  address: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [profile, setProfile] = useState<ProfileForm>({
    full_name: '',
    mobile: '',
    address: '',
  });

  /* =======================
     FETCH PROFILE
     ======================= */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data } = await (supabase as any)
        .from('profiles')
        .select('full_name, mobile, address')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          mobile: data.mobile ?? '',
          address: data.address ?? '',
        });
      }
    };

    fetchProfile();
  }, [user]);

  /* =======================
     CALCULATIONS
     ======================= */
  const deliveryCharge = useMemo(
    () => (totalPrice >= 99 ? 0 : 40),
    [totalPrice]
  );

  const finalTotal = useMemo(
    () => totalPrice + deliveryCharge,
    [totalPrice, deliveryCharge]
  );

  /* =======================
     EMPTY CART MESSAGE
     ======================= */
  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-gray-600 mb-6">
            It looks like you haven't added any items to your cart yet.
            Start shopping to place an order!
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/shop')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================
     PLACE ORDER
     ======================= */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      return;
    }

    if (!profile.full_name || !profile.mobile || !profile.address) {
      alert('Please fill all details');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Check stock availability before proceeding
    const insufficientStockItems = items.filter(item => 
      (item.product.stock_quantity || 0) < item.quantity
    );

    if (insufficientStockItems.length > 0) {
      const productNames = insufficientStockItems.map(item => item.product.name).join(', ');
      alert(`Insufficient stock for: ${productNames}. Please update your cart.`);
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ UPDATE PROFILE */
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: profile.full_name,
          mobile: profile.mobile,
          address: profile.address,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      /* 2️⃣ CREATE ORDER */
      const { data: order, error: orderError } = await (supabase as any)
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalTotal,
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      /* 3️⃣ CREATE ORDER ITEMS */
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price:
          item.product.price *
          (1 - item.product.discount_percentage / 100),
      }));

      const { error: orderItemsError } = await (supabase as any)
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      /* 4️⃣ UPDATE PRODUCT STOCK QUANTITIES */
      // Create an array of update promises for each product
      const updateStockPromises = items.map(item => 
        (supabase as any)
          .from('products')
          .update({
            stock_quantity: (item.product.stock_quantity || 0) - item.quantity
          })
          .eq('id', item.product.id)
      );

      // Execute all stock updates
      const updateResults = await Promise.all(updateStockPromises);
      
      // Check for any errors in stock updates
      const stockUpdateErrors = updateResults.filter(result => result.error);
      if (stockUpdateErrors.length > 0) {
        console.error('Stock update errors:', stockUpdateErrors);
        // Optional: You could rollback the order here if stock updates fail
        // For now, we'll just log it but continue with the order
      }

      clearCart();
      setOrderPlaced(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     SUCCESS SCREEN
     ======================= */
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Your order has been placed successfully.
          </p>
          <p className="text-gray-600 mb-8">
            We'll contact you at{' '}
            <span className="font-semibold">{profile.mobile}</span>
          </p>

          <div className="text-left bg-white p-6 rounded-lg shadow-md mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-3">Delivery Details</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {profile.full_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Mobile:</span> {profile.mobile}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Address:</span> {profile.address}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="bg-white text-green-600 px-8 py-3 rounded-lg border-2 border-green-600 font-semibold hover:bg-green-50 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =======================
     CHECKOUT UI
     ======================= */
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Cart
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - FORM */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-md p-6 md:p-8"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Delivery Information
              </h2>

              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={e =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    required
                  />
                </div>

                {/* Mobile Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={profile.mobile}
                    onChange={e =>
                      setProfile({ ...profile, mobile: e.target.value })
                    }
                    placeholder="Enter your 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">10-digit mobile number without country code</p>
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={profile.address}
                    onChange={e =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="House no., Building, Street, Area, City, State, Pincode"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-8 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg"
              >
                {loading ? 'Processing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY (OPTIMIZED) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              {/* Cart Items List */}
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded mr-2">
                          Qty: {item.quantity}
                        </span>
                        {item.product.discount_percentage > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {item.product.discount_percentage}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-semibold text-gray-800">
                        ₹
                        {(
                          item.product.price *
                          (1 - item.product.discount_percentage / 100) *
                          item.quantity
                        ).toFixed(2)}
                      </p>
                      {item.product.discount_percentage > 0 && (
                        <p className="text-sm text-gray-500 line-through">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charge</span>
                  <span className={deliveryCharge === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryCharge === 0 ? (
                      <span className="flex items-center">
                        <span className="mr-1">FREE</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    ) : (
                      `₹${deliveryCharge.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-green-600">₹{finalTotal.toFixed(2)}</span>
                  </div>
                  
                  {deliveryCharge === 0 && totalPrice >= 99 && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.2 6.5 10.266a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        You saved ₹40 on delivery!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}