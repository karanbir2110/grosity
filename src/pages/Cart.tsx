import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useEffect, useState } from 'react';
import siteService from '../services/siteService';

export default function Cart() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if site is live
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
        setCheckingStatus(false);
      }
    };

    checkSiteStatus();
  }, [navigate]);

  // Loading state while checking site status
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <ShoppingBag className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            <span>Start Shopping</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {items.map((item) => {
                const discountedPrice =
                  item.product.price * (1 - item.product.discount_percentage / 100);
                const subtotal = discountedPrice * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="flex items-center p-6 border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <img
                      src={item.product.image_url || ''}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />

                    <div className="flex-1 ml-6">
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="text-lg font-semibold text-gray-900 hover:text-green-600 transition"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-gray-600 text-sm mt-1">
                        ₹{discountedPrice.toFixed(2)} / {item.product.unit}
                      </p>

                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded transition"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                Math.min(item.product.stock_quantity, item.quantity + 1)
                              )
                            }
                            disabled={item.quantity >= item.product.stock_quantity}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-600 hover:text-red-700 transition"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right ml-6">
                      <p className="text-xl font-bold text-gray-900">
                        ₹{subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({totalItems})</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{totalPrice >= 99 ? 'FREE' : '₹40.00'}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>
                      ₹{(totalPrice + (totalPrice >= 99 ? 0 : 40)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {totalPrice < 99 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    Add ₹{(99 - totalPrice).toFixed(2)} more to get free delivery!
                  </p>
                </div>
              )}

              <Link
                to="/checkout"
                className="block w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-center font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/shop"
                className="block w-full text-center text-green-600 hover:text-green-700 py-3 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}