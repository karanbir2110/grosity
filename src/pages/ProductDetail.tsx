import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, ArrowLeft, Tag, Leaf } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types/database';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartAnimation, setCartAnimation] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      if (!slug) return;

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_visible', true)
        .maybeSingle();

      setProduct(data);
      setLoading(false);
    }

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    
    // Trigger animation
    setCartAnimation(true);
    
    // Add item to cart
    addToCart(product, quantity);
    setQuantity(1);
    
    // Reset animation after it completes
    setTimeout(() => {
      setCartAnimation(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
          <Link to="/shop" className="text-green-600 hover:text-green-700">
            Return to shop
          </Link>
        </div>
      </div>
    );
  }

  const discountedPrice = product.price * (1 - product.discount_percentage / 100);
  const hasDiscount = product.discount_percentage > 0;

  return (
    <div className={`min-h-screen bg-gray-50 py-12 transition-all duration-300 ${cartAnimation ? 'scale-[1.002]' : ''}`}>
      {/* Cart Animation Overlay */}
      {cartAnimation && (
        <div className="fixed inset-0 bg-green-50 opacity-20 pointer-events-none z-50 transition-opacity duration-300" />
      )}
      
      <div className="max-w-7xl mx-auto px-4">
        <Link
          to="/shop"
          className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700 mb-8 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Shop</span>
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="relative">
            <img
              src={product.image_url || ''}
              alt={product.name}
              className="w-full rounded-2xl shadow-lg"
            />
            {hasDiscount && (
              <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-lg font-semibold shadow-lg">
                <Tag className="h-5 w-5" />
                <span>{product.discount_percentage}% OFF</span>
              </div>
            )}
            {product.is_organic && (
              <div className="absolute top-6 left-6 bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-semibold shadow-lg">
                <Leaf className="h-5 w-5" />
                <span>Organic</span>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-baseline space-x-3 mb-6">
              <span className="text-4xl font-bold text-green-600">
                ₹{discountedPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-gray-500 line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
              <span className="text-xl text-gray-500">/ {product.unit}</span>
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Stock</p>
                  <p className="font-semibold text-gray-900">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.is_available || product.stock_quantity === 0}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {product.is_available && product.stock_quantity > 0
                  ? 'Add to Cart'
                  : 'Out of Stock'}
              </span>
            </button>

            {product.is_organic && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">
                  Certified Organic
                </h3>
                <p className="text-sm text-green-700">
                  This product is certified organic and grown without synthetic pesticides or
                  fertilizers.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}