import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Clock, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types/database';
import ProductCard from '../components/ProductCard';
import siteService from '../services/siteService'; // Make sure this service exists

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStoreOffline, setIsStoreOffline] = useState(false);
  const [checkingStoreStatus, setCheckingStoreStatus] = useState(true);
  const [showNotification, setShowNotification] = useState(true);

  // Check store status
  useEffect(() => {
    const checkStoreStatus = async () => {
      try {
        const isLive = await siteService.isSiteLive();
        setIsStoreOffline(!isLive);
      } catch (error) {
        console.error('Error checking store status:', error);
        setIsStoreOffline(false); // Assume online if there's an error
      } finally {
        setCheckingStoreStatus(false);
      }
    };

    checkStoreStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkStoreStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*').eq('is_featured', true).limit(8),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setFeaturedProducts(productsRes.data);
      setLoading(false);
    }

    fetchData();
  }, []);

  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  return (

    <div className="relative">
      {/* Store Offline Notification Banner */}
      {isStoreOffline && showNotification && !checkingStoreStatus && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">Store Currently Offline</div>
                  <div className="text-sm opacity-90">
                    Delivery services have stopped for the night. You can still browse products.
                    We'll be back at 9:00 AM.
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/maintenance"
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm"
                >
                  View Details
                </Link>
                <button
                  onClick={handleNotificationClose}
                  className="text-white hover:text-red-200 transition-colors p-1"
                  aria-label="Close notification"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
        {/* Optional: Add subtle overlay when store is offline */}
        {isStoreOffline && (
          <div className="absolute inset-0 bg-black/5 pointer-events-none z-10"></div>
        )}
        
      <section className="relative bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
        <div className="max-w-7xl mx-auto relative z-20"></div>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              {/* Store Status Badge */}
              {isStoreOffline && !checkingStoreStatus && (
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full mb-6 font-semibold">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span>Store Closed for the Night</span>
                </div>
              )}
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Fresh Produce
                <span className="block text-green-600">Delivered Daily</span>
              </h1>
              
              {/* Modified message when store is offline */}
              <p className="text-xl text-gray-600 mb-8">
                {isStoreOffline 
                  ? 'Farm-fresh fruits and vegetables. Currently closed for the night. You can still browse products and plan your next order.'
                  : 'Farm-fresh fruits and vegetables delivered straight to your doorstep. Always fresh.'}
              </p>
              
              {/* Modified delivery info when store is offline */}
              {isStoreOffline && (
                <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-800">Next Delivery Window</p>
                      <p className="text-yellow-700">Tomorrow from 9:00 AM to 9:00 PM</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/shop"
                  className={`px-8 py-4 rounded-lg transition flex items-center space-x-2 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                    isStoreOffline 
                      ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <span>{isStoreOffline ? 'Browse Products' : 'Shop Now'}</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {!isStoreOffline && (
                  <Link
                    to="/about"
                    className="bg-white text-green-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition text-lg font-semibold border-2 border-green-600"
                  >
                    Learn More
                  </Link>
                )}
                {isStoreOffline && (
                  <Link
                    to="/maintenance"
                    className="bg-transparent text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-100 transition text-lg font-semibold border-2 border-gray-400"
                  >
                    View Store Hours
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg"
                alt="Fresh Produce"
                className="rounded-2xl shadow-2xl"
              />
              {/* Optional overlay when store is offline */}
              {isStoreOffline && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with modified delivery info when offline */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`flex items-start space-x-4 p-6 rounded-lg hover:bg-gray-50 transition ${
              isStoreOffline ? 'opacity-90' : ''
            }`}>
              <div className={`p-3 rounded-full flex-shrink-0 ${
                isStoreOffline ? 'bg-gray-100' : 'bg-green-100'
              }`}>
                <Truck className={`h-6 w-6 ${isStoreOffline ? 'text-gray-500' : 'text-green-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isStoreOffline ? 'Delivery Paused' : 'Free Delivery'}
                </h3>
                <p className={`${isStoreOffline ? 'text-gray-500' : 'text-gray-600'}`}>
                  {isStoreOffline 
                    ? 'Resumes tomorrow at 9:00 AM'
                    : 'On orders above ₹99'}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 rounded-lg hover:bg-gray-50 transition">
              <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Quality Guaranteed
                </h3>
                <p className="text-gray-600">
                  Fresh or 100% refund
                </p>
              </div>
            </div>
            <div className={`flex items-start space-x-4 p-6 rounded-lg hover:bg-gray-50 transition ${
              isStoreOffline ? 'bg-red-50 border border-red-100' : ''
            }`}>
              <div className={`p-3 rounded-full flex-shrink-0 ${
                isStoreOffline ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <Clock className={`h-6 w-6 ${isStoreOffline ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delivery Hours
                </h3>
                <p className={isStoreOffline ? 'text-red-600 font-medium' : 'text-gray-600'}>
                  {isStoreOffline 
                    ? 'Currently Closed - Opens at 9:00 AM'
                    : 'We Deliver from 9 AM to 9 PM'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600">
              Discover our wide range of fresh produce
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.slug}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={category.image_url || ''}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Featured Products
                </h2>
                <p className="text-xl text-gray-600">
                  Handpicked fresh produce for you
                </p>
              </div>
              {isStoreOffline && (
                <div className="mt-4 md:mt-0 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-700 font-medium">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Checkout disabled until 9:00 AM</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  storeOffline={isStoreOffline}
                />
              ))}
            </div>
          )}
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className={`inline-flex items-center space-x-2 px-8 py-3 rounded-lg transition text-lg font-semibold ${
                isStoreOffline
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <span>View All Products</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Get Fresh Updates
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Subscribe to our newsletter for exclusive deals and fresh produce tips
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition font-semibold"
            >
              Subscribe
            </button>
          </form>
          
          {/* Store Hours Info when offline */}
          {isStoreOffline && (
            <div className="mt-10 pt-8 border-t border-white/20">
              <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl">
                <Clock className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-semibold text-lg">Store Hours</p>
                  <p className="opacity-90">Closed for the night • Opens at 9:00 AM</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating notification for mobile */}
      {isStoreOffline && showNotification && (
        <div className="fixed bottom-4 right-4 z-40 md:hidden">
          <div className="bg-red-600 text-white p-4 rounded-xl shadow-2xl max-w-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold">Store Closed</p>
                <p className="text-sm opacity-90">Delivery paused until 9:00 AM</p>
              </div>
              <button
                onClick={handleNotificationClose}
                className="text-white/80 hover:text-white ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}