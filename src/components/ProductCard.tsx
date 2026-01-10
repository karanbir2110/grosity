import { Link } from 'react-router-dom';
import { ShoppingCart, Tag } from 'lucide-react';
import { Product } from '../types/database';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const discountedPrice = product.price * (1 - product.discount_percentage / 100);
  const hasDiscount = product.discount_percentage > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || ''}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {hasDiscount && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-1 text-sm font-semibold">
            <Tag className="h-4 w-4" />
            <span>{product.discount_percentage}% OFF</span>
          </div>
        )}
        {product.is_organic && (
          <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Organic
          </div>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
          disabled={!product.is_available}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>{product.is_available ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </Link>
  );
}
