import { Link } from 'react-router-dom';
import { ShoppingCart, Tag, AlertTriangle } from 'lucide-react';
import { Product } from '../types/database';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  storeOffline?: boolean; // Add this prop
}

export default function ProductCard({ product, storeOffline = false }: ProductCardProps) {
  const { addToCart } = useCart();

  const discountedPrice = product.price * (1 - product.discount_percentage / 100);
  const hasDiscount = product.discount_percentage > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (storeOffline) return;
    addToCart(product);
  };

  // Determine if button should be disabled
  const isButtonDisabled = !product.is_available || storeOffline;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 relative"
    >
      {/* Store Offline Overlay */}
      {storeOffline && product.is_available && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Store Closed</span>
          </div>
          <p className="text-white text-center text-sm bg-black/40 px-3 py-1 rounded">
            Add to cart from 9 AM
          </p>
        </div>
      )}
      
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm font-semibold z-20">
            <Tag className="h-4 w-4" />
            <span>{product.discount_percentage}% OFF</span>
          </div>
        )}
        {product.is_organic && (
          <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-20">
            Organic
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="text-white font-semibold text-lg">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition">
          {product.name}
        </h3>
        <div className="flex items-baseline space-x-2 mb-3">
          <span className="text-2xl font-bold text-gray-900">
            ₹{discountedPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.price.toFixed(2)}
            </span>
          )}
          <span className="text-sm text-gray-500">/ {product.unit}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isButtonDisabled}
          className={`w-full py-2 rounded-lg transition flex items-center justify-center space-x-2 disabled:cursor-not-allowed ${
            storeOffline 
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
              : product.is_available 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-gray-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>
            {storeOffline 
              ? 'Store Closed' 
              : product.is_available 
                ? 'Add to Cart' 
                : 'Out of Stock'}
          </span>
        </button>
        
        {/* Additional info when store is offline */}
        {storeOffline && product.is_available && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              Available from 9:00 AM tomorrow
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}