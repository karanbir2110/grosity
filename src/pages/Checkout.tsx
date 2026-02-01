import { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PaymentButton from '../components/PaymentButton';
import siteService from '../services/siteService';
import type { RazorpaySuccessResponse } from '../types/razorpay.d';

interface ProfileForm {
  full_name: string;
  mobile: string;
  address: string;
}

interface DeliveryLocation {
  id: string;
  name: string;
  description: string;
  delivery_fee: number;
  is_active: boolean;
  order_index: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const [checkingSiteStatus, setCheckingSiteStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');
  const [orderId, setOrderId] = useState<string>('');
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const [profile, setProfile] = useState<ProfileForm>({
    full_name: '',
    mobile: '',
    address: '',
  });

  // Form validation states
  const [formErrors, setFormErrors] = useState({
    full_name: false,
    mobile: false,
    delivery_location: false
  });

  /* =======================
     SITE STATUS CHECK
     ======================= */
  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
        const isLive = await siteService.isSiteLive();
        if (!isLive) {
          navigate('/maintenance');
          return;
        }
      } catch (error) {
        console.error('Error checking site status:', error);
      } finally {
        setCheckingSiteStatus(false);
      }
    };

    checkSiteStatus();
  }, [navigate]);

  /* =======================
     AUTHENTICATION CHECK
     ======================= */
  useEffect(() => {
    // Only check auth after site status is verified
    if (checkingSiteStatus) return;

    const timer = setTimeout(() => {
      setIsInitialized(true);
      
      // Check if user exists after initialization
      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login', { 
          state: { 
            from: '/checkout',
            message: 'Please login to proceed to checkout' 
          } 
        });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [user, navigate, checkingSiteStatus]);

  /* =======================
     FETCH DELIVERY LOCATIONS
     ======================= */
  useEffect(() => {
    // Only fetch locations after site status check
    if (checkingSiteStatus) return;

    const fetchDeliveryLocations = async () => {
      try {
        setLocationsLoading(true);
        const { data, error } = await (supabase as any)
          .from('delivery_locations')
          .select('*')
          .eq('is_active', true)
          .order('order_index');

        if (error) {
          console.error('Error fetching delivery locations:', error);
          return;
        }

        if (data) {
          setDeliveryLocations(data as DeliveryLocation[]);
        }
      } catch (err) {
        console.error('Error in fetchDeliveryLocations:', err);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchDeliveryLocations();
  }, [checkingSiteStatus]);

  /* =======================
     FETCH PROFILE
     ======================= */
  useEffect(() => {
    // Only fetch profile after locations are loaded
    if (!user || deliveryLocations.length === 0 || checkingSiteStatus) return;

    const fetchProfile = async () => {
      try {
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

          // Check if saved address matches any delivery location
          if (data.address) {
            const matchedLocation = deliveryLocations.find(
              loc => data.address?.includes(loc.name)
            );
            if (matchedLocation) {
              setSelectedLocation(matchedLocation.id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, [user, deliveryLocations, checkingSiteStatus]);

  /* =======================
     HANDLE LOCATION SELECTION
     ======================= */
  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    const location = deliveryLocations.find(loc => loc.id === locationId);
    if (location) {
      setProfile(prev => ({
        ...prev,
        address: `${location.name} - ${location.description}`
      }));
    }
    // Clear delivery location error when location is selected
    setFormErrors(prev => ({
      ...prev,
      delivery_location: false
    }));
  };

  /* =======================
     VALIDATE FORM
     ======================= */
  const validateForm = (): boolean => {
    const errors = {
      full_name: !profile.full_name.trim(),
      mobile: !profile.mobile.trim() || profile.mobile.length !== 10,
      delivery_location: !selectedLocation
    };

    setFormErrors(errors);

    // Check if any field has errors
    const hasErrors = Object.values(errors).some(error => error);
    
    if (hasErrors) {
      // Scroll to first error
      if (errors.full_name) {
        document.querySelector('input[name="full_name"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.mobile) {
        document.querySelector('input[name="mobile"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (errors.delivery_location) {
        document.querySelector('input[name="delivery-location"]')?.closest('div')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return false;
    }
    
    return true;
  };

  /* =======================
     CALCULATIONS
     ======================= */
  const selectedLocationDetails = selectedLocation 
    ? deliveryLocations.find(loc => loc.id === selectedLocation)
    : null;

  // FIXED: Helper function to calculate delivery charge
  const calculateDeliveryCharge = useCallback((cartTotal: number) => {
    // Rule 1: Free delivery for orders ₹99 or above
    if (cartTotal >= 99) {
      return 0;
    }
    
    // Rule 2: If cart is under ₹99, charge ₹40 PLUS location's fee
    let charge = 40; // ₹40 base charge
    
    if (selectedLocationDetails) {
      // Add location's fee to the ₹40 base
      charge += selectedLocationDetails.delivery_fee;
    }
    
    return charge;
  }, [selectedLocationDetails]);

  // Calculate delivery charge
  const deliveryCharge = useMemo(() => {
    return calculateDeliveryCharge(totalPrice);
  }, [totalPrice, calculateDeliveryCharge]);

  // Calculate final total with debugging
  const finalTotal = useMemo(() => {
    // Calculate cart total manually for verification
    const manualCartTotal = items.reduce((sum, item) => {
      const price = item.product.price || 0;
      const discount = item.product.discount_percentage || 0;
      const discountedPrice = price * (1 - discount / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0);

    // Calculate delivery using the same helper
    const delivery = calculateDeliveryCharge(manualCartTotal);

    // Final total
    const calculatedTotal = manualCartTotal + delivery;

    // Debug log
    console.log('🛒 Cart Debug:', {
      itemsCount: items.length,
      cartTotalFromContext: totalPrice,
      manualCartTotal,
      delivery,
      calculatedTotal,
      selectedLocation: selectedLocationDetails?.name || 'None',
      locationFee: selectedLocationDetails?.delivery_fee || 0,
      baseCharge: manualCartTotal < 99 ? 40 : 0,
      freeDelivery: manualCartTotal >= 99 ? 'YES (₹99+ threshold)' : 'NO'
    });

    return calculatedTotal;
  }, [totalPrice, calculateDeliveryCharge, items]);

  // Check if form is valid for payment
  const isFormValidForPayment = useMemo(() => {
    return (
      profile.full_name.trim() !== '' &&
      profile.mobile.trim() !== '' &&
      profile.mobile.length === 10 &&
      selectedLocation !== '' &&
      finalTotal > 0 &&
      items.length > 0
    );
  }, [profile.full_name, profile.mobile, selectedLocation, finalTotal, items.length]);

  /* =======================
     CREATE ORDER IN DATABASE
     ======================= */
  const createOrderInDatabase = async (paymentMethod: 'cod' | 'online', razorpayPaymentId?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate form before creating order
    if (!validateForm()) {
      throw new Error('Please fill all required fields correctly');
    }

    if (items.length === 0) {
      throw new Error('Your cart is empty');
    }

    // Validate amount
    if (finalTotal <= 0) {
      throw new Error(`Invalid order total: ₹${finalTotal}. Please check your cart items.`);
    }

    if (finalTotal < 1) {
      throw new Error('Minimum order amount is ₹1');
    }

    // Check stock availability
    const insufficientStockItems = items.filter(item => 
      (item.product.stock_quantity || 0) < item.quantity
    );

    if (insufficientStockItems.length > 0) {
      const productNames = insufficientStockItems.map(item => item.product.name).join(', ');
      throw new Error(`Insufficient stock for: ${productNames}. Please update your cart.`);
    }

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
          status: paymentMethod === 'online' ? 'paid' : 'pending',
          delivery_location: profile.address,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      console.log('✅ Order created in database:', order.id);

      /* 3️⃣ CREATE PAYMENT RECORD (only for online payments) */
      if (paymentMethod === 'online' && razorpayPaymentId) {
        try {
          const { error: paymentError } = await (supabase as any)
            .from('payments')
            .insert({
              order_id: order.id,
              user_id: user.id,
              amount: finalTotal,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_signature: '', // Will be updated by verify-payment
              status: 'pending_verification',
              payment_method: 'razorpay'
            });

          if (paymentError) {
            console.warn('Payment record creation warning:', paymentError);
          } else {
            console.log('✅ Payment record created');
          }
        } catch (paymentErr) {
          console.warn('Payment record creation warning:', paymentErr);
          // Don't fail the order if payment record fails
        }
      }

      /* 4️⃣ CREATE ORDER ITEMS */
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price * (1 - item.product.discount_percentage / 100),
      }));

      const { error: orderItemsError } = await (supabase as any)
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      console.log('✅ Order items created:', orderItems.length);

      /* 5️⃣ UPDATE PRODUCT STOCK QUANTITIES */
      const updateStockPromises = items.map(item => 
        (supabase as any)
          .from('products')
          .update({
            stock_quantity: (item.product.stock_quantity || 0) - item.quantity
          })
          .eq('id', item.product.id)
      );

      const updateResults = await Promise.all(updateStockPromises);
      
      const stockUpdateErrors = updateResults.filter(result => result.error);
      if (stockUpdateErrors.length > 0) {
        console.error('Stock update errors:', stockUpdateErrors);
      }

      setOrderId(order.id);
      return order.id;
    } catch (err) {
      console.error('❌ Error creating order:', err);
      throw err;
    }
  };

  /* =======================
     HANDLE ONLINE PAYMENT SUCCESS
     ======================= */
  const handlePaymentSuccess = async (response: RazorpaySuccessResponse) => {
    try {
      setLoading(true);
      
      console.log('💰 Payment Success Response:', response);
      console.log('📦 Final Total being processed:', finalTotal);
      
      // Validate form before proceeding
      if (!validateForm()) {
        throw new Error('Please fill all required fields correctly');
      }

      // Validate amount again
      if (finalTotal <= 0) {
        throw new Error(`Cannot process order with amount: ₹${finalTotal}. Please add items to your cart.`);
      }

      if (finalTotal < 1) {
        throw new Error('Minimum order amount is ₹1');
      }

      // Create order in database with payment ID
      const orderId = await createOrderInDatabase('online', response.razorpay_payment_id);
      
      console.log('🎉 Order completed successfully:', orderId);
      
      // Save order amount before clearing cart
      setOrderAmount(finalTotal);
      clearCart();
      setOrderPlaced(true);
    } catch (err: any) {
      console.error('❌ Payment success handler error:', err);
      alert(err.message || 'Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     HANDLE PAYMENT ERROR
     ======================= */
  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    alert('Payment failed. Please try again or choose Cash on Delivery.');
  };

  /* =======================
     HANDLE PAYMENT CLOSE
     ======================= */
  const handlePaymentClose = () => {
    console.log('Payment modal closed by user');
  };

  /* =======================
     HANDLE CASH ON DELIVERY
     ======================= */
  const handleCashOnDelivery = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form before proceeding
    if (!validateForm()) {
      return;
    }

    // Validate amount
    if (finalTotal <= 0) {
      alert(`Cannot place order with amount: ₹${finalTotal}. Please add items to your cart.`);
      return;
    }

    setLoading(true);

    try {
      await createOrderInDatabase('cod');
      // Save order amount before clearing cart
      setOrderAmount(finalTotal);
      clearCart();
      setOrderPlaced(true);
    } catch (err: any) {
      alert(err.message || 'Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking site status
  if (checkingSiteStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking site status...</p>
        </div>
      </div>
    );
  }

  // Show loading while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // If redirected, show nothing (navigation will happen)
  if (!user) {
    return null;
  }

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
     SUCCESS SCREEN
     ======================= */
  if (orderPlaced) {
    const isOnlinePayment = paymentMethod === 'online';
    
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <CheckCircle className="h-24 w-24 text-green-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isOnlinePayment ? 'Payment Successful!' : 'Order Placed Successfully!'}
          </h1>
          <p className="text-gray-600 mb-4">
            {isOnlinePayment 
              ? 'Your payment has been processed successfully.' 
              : 'Your order has been placed successfully.'}
          </p>
          <p className="text-gray-600 mb-8">
            Order ID: <span className="font-semibold">#{orderId}</span>
            <br />
            We'll contact you at{' '}
            <span className="font-semibold">{profile.mobile}</span>
          </p>

          <div className="text-left bg-white p-6 rounded-lg shadow-md mb-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-3">Order & Delivery Details</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Order ID:</span> #{orderId}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Payment Method:</span> {isOnlinePayment ? 'Online Payment' : 'Cash on Delivery'}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Name:</span> {profile.full_name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Mobile:</span> {profile.mobile}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Delivery Point:</span> {selectedLocationDetails?.name}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Location:</span> {selectedLocationDetails?.description}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Total Amount:</span> ₹{orderAmount.toFixed(2)}
              </p>
              <p className="text-gray-700 text-sm mt-4 pt-4 border-t">
                <span className="font-medium">Note:</span> Please collect your order from this location during the specified delivery hours.
                {!isOnlinePayment && ' Please keep exact change ready for payment.'}
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
              onSubmit={handleCashOnDelivery}
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
                    name="full_name"
                    value={profile.full_name}
                    onChange={e => {
                      setProfile({ ...profile, full_name: e.target.value });
                      // Clear error when user starts typing
                      if (formErrors.full_name) {
                        setFormErrors(prev => ({ ...prev, full_name: false }));
                      }
                    }}
                    placeholder="Enter your full name"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                      formErrors.full_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">Please enter your full name</p>
                  )}
                </div>

                {/* Mobile Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={profile.mobile}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setProfile({ ...profile, mobile: value });
                      // Clear error when user starts typing
                      if (formErrors.mobile) {
                        setFormErrors(prev => ({ ...prev, mobile: false }));
                      }
                    }}
                    placeholder="Enter your 10-digit mobile number"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
                      formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">10-digit mobile number without country code</p>
                    {formErrors.mobile && (
                      <p className="text-sm text-red-600">
                        {!profile.mobile ? 'Please enter mobile number' : 'Mobile number must be 10 digits'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Location Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Delivery Point *
                  </label>
                  
                  {locationsLoading ? (
                    <div className="p-8 border border-gray-200 rounded-lg bg-gray-50 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                      <p className="text-gray-600">Loading delivery locations...</p>
                    </div>
                  ) : deliveryLocations.length === 0 ? (
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 text-center">
                      <MapPin className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No delivery locations available.</p>
                      <p className="text-sm text-gray-500 mt-1">Please contact support.</p>
                    </div>
                  ) : (
                    <div className={`grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 ${
                      formErrors.delivery_location ? 'border-2 border-red-300 rounded-lg p-2' : ''
                    }`}>
                      {deliveryLocations.map(location => (
                        <div
                          key={location.id}
                          className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedLocation === location.id
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleLocationSelect(location.id)}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name="delivery-location"
                              checked={selectedLocation === location.id}
                              onChange={() => handleLocationSelect(location.id)}
                              className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                              required
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-800">
                                {location.name}
                              </label>
                              {location.delivery_fee > 0 ? (
                                <span className="text-sm font-semibold text-gray-700">
                                  ₹{location.delivery_fee.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm font-semibold text-green-600">
                                  FREE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {location.description}
                            </p>
                            {selectedLocation === location.id && (
                              <div className="flex items-center text-green-600 text-xs mt-2">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formErrors.delivery_location && (
                    <p className="mt-2 text-sm text-red-600">Please select a delivery location</p>
                  )}

                  {/* Information Note */}
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> We only deliver to these predefined points. 
                      Please select your preferred delivery location. You'll need to collect your order from this point.
                    </p>
                  </div>

                  {/* Selected Location Preview */}
                  {selectedLocationDetails && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <p className="text-green-800 font-semibold">Selected Delivery Point</p>
                      </div>
                      <h3 className="text-lg font-bold text-green-900">
                        {selectedLocationDetails.name}
                      </h3>
                      <p className="text-green-700">{selectedLocationDetails.description}</p>
                      {selectedLocationDetails.delivery_fee > 0 && (
                        <p className="text-sm font-semibold text-green-800 mt-2">
                          Delivery Fee: ₹{selectedLocationDetails.delivery_fee.toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-green-600 mt-2">
                        This location will be saved with your order.
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method *
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'online'
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('online')}
                    >
                      <div className="flex items-center h-5 absolute left-3">
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === 'online'}
                          onChange={() => setPaymentMethod('online')}
                          className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-center">
                        <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                        <label className="block text-sm font-medium text-gray-800 cursor-pointer">
                          Online Payment
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Pay now with Razorpay</p>
                      </div>
                    </div>

                    <div
                      className={`relative flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="flex items-center h-5 absolute left-3">
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                      </div>
                      <div className="text-center">
                        <svg className="h-6 w-6 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <label className="block text-sm font-medium text-gray-800 cursor-pointer">
                          Cash on Delivery
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Pay when you receive</p>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'online' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.2 6.5 10.266a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        Secure online payment powered by Razorpay
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Note:</span> Please keep exact change ready for delivery.
                        Additional charges may apply for large orders.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Buttons */}
              {paymentMethod === 'online' ? (
                <div className="mt-8">
                  {finalTotal <= 0 ? (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 font-medium">
                        ❌ Cannot proceed with payment: Order total is ₹{finalTotal.toFixed(2)}
                      </p>
                      <p className="text-red-600 text-sm mt-1">
                        Please add items to your cart or check product prices.
                      </p>
                    </div>
                  ) : !isFormValidForPayment ? (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700 font-medium">
                        ⚠️ Please fill all required fields to proceed with payment
                      </p>
                      <ul className="text-yellow-600 text-sm mt-2 space-y-1">
                        {!profile.full_name.trim() && <li>• Full name is required</li>}
                        {!profile.mobile.trim() && <li>• Mobile number is required</li>}
                        {profile.mobile.length !== 10 && profile.mobile.trim() && <li>• Mobile number must be 10 digits</li>}
                        {!selectedLocation && <li>• Delivery location is required</li>}
                      </ul>
                    </div>
                  ) : (
                    <>
                      <PaymentButton
                        amount={finalTotal} // Amount in RUPEES only
                        currency="INR"
                        productName={`Order #${Date.now()}`}
                        receipt={`order_${Date.now()}`}
                        customerName={profile.full_name}
                        customerEmail={user?.email || ''}
                        customerPhone={profile.mobile}
                        notes={{
                          order_items: items.map(item => item.product.name).join(', '),
                          delivery_location: selectedLocationDetails?.name || '',
                          user_id: user?.id || ''
                        }}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onClose={handlePaymentClose}
                        className="w-full py-4 text-lg"
                        disabled={!isFormValidForPayment}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          Pay ₹{finalTotal.toFixed(2)}
                        </div>
                      </PaymentButton>
                      
                      <p className="text-xs text-gray-500 text-center mt-4">
                        You will be redirected to Razorpay's secure payment gateway.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isFormValidForPayment}
                  className="w-full mt-8 bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg relative overflow-hidden group"
                >
                  {loading ? (
                    <>
                      <span className="opacity-0">Place Order (Cash on Delivery)</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    </>
                  ) : (
                    `Place Order - ₹${finalTotal.toFixed(2)} (Cash on Delivery)`
                  )}
                  {!isFormValidForPayment && (
                    <span className="block text-sm font-normal mt-1 text-red-100">
                      * Please fill all required fields
                    </span>
                  )}
                </button>
              )}
              
              <p className="text-xs text-gray-500 text-center mt-4">
                {paymentMethod === 'online' 
                  ? 'Your payment is secured with 256-bit SSL encryption.' 
                  : 'Your selected delivery point will be saved with your order for future reference.'}
              </p>
            </form>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
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
                  <span>₹{(finalTotal - deliveryCharge).toFixed(2)}</span>
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

                {/* Selected Location Info in Summary */}
                {selectedLocationDetails && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Delivery Point:</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{selectedLocationDetails.name}</p>
                    <p className="text-xs text-gray-500">{selectedLocationDetails.description}</p>
                    {selectedLocationDetails.delivery_fee > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Location Fee: ₹{selectedLocationDetails.delivery_fee.toFixed(2)}
                      </p>
                    )}
                    {totalPrice < 99 && selectedLocationDetails.delivery_fee > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Base Charge: ₹40.00
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Amount</span>
                    <span className="text-green-600">₹{finalTotal.toFixed(2)}</span>
                  </div>
                  
                  {finalTotal <= 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">
                        ⚠️ Order total is ₹0. Please add items to your cart.
                      </p>
                    </div>
                  )}
                  
                  {deliveryCharge === 0 && finalTotal > 0 && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.2 6.5 10.266a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        Free delivery on orders ₹99 and above!
                      </p>
                    </div>
                  )}

                  {totalPrice < 99 && deliveryCharge > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Delivery includes ₹40 base charge {selectedLocationDetails && selectedLocationDetails.delivery_fee > 0 ? `+ ₹${selectedLocationDetails.delivery_fee.toFixed(2)} location fee` : ''}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Order Summary Note */}
              <div className="mt-6 pt-6 border-t">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {paymentMethod === 'online' ? (
                      <>
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Online Payment Selected</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">Cash on Delivery Selected</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {paymentMethod === 'online'
                      ? 'Complete payment now to confirm your order instantly.'
                      : 'Pay when you collect your order from the delivery point.'}
                  </p>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Your order will be delivered to the selected pickup point.
                  Please bring your order confirmation when collecting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}