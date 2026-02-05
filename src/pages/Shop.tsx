import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category, Product } from '../types/database';
import { useCart } from '../context/CartContext';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || ''
  );
  const [showOrganic, setShowOrganic] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [cartAnimation, setCartAnimation] = useState(false);
  const { items, addToCart, updateQuantity } = useCart();

  // Helper function to get quantity for a product
  const getItemQuantity = (productId: string) => {
    const item = items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Helper function to get stock status display
  const getStockStatus = (stockQuantity: number) => {
    if (stockQuantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (stockQuantity < 10) {
      return { 
        text: `Only ${stockQuantity} left`, 
        color: 'text-red-600', 
        bgColor: 'bg-red-50' 
      };
    } else if (stockQuantity < 20) {
      return { 
        text: 'Low Stock', 
        color: 'text-amber-600', 
        bgColor: 'bg-amber-50' 
      };
    } else {
      return { 
        text: 'In Stock', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50' 
      };
    }
  };

  useEffect(() => {
    async function fetchData() {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('products').select('*').eq('is_available', true),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      setLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        filtered = filtered.filter((product) => product.category_id === category.id);
      }
    }

    if (showOrganic) {
      filtered = filtered.filter((product) => product.is_organic);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, showOrganic, sortBy, products, categories]);

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    if (categorySlug) {
      setSearchParams({ category: categorySlug });
    } else {
      setSearchParams({});
    }
  };

  const handleAddToCart = (product: Product) => {
    // Trigger animation
    setCartAnimation(true);
    
    // Add item to cart
    addToCart(product);
    
    // Reset animation after it completes
    setTimeout(() => {
      setCartAnimation(false);
    }, 300);
  };

  const handleIncrement = (product: Product) => {
    const currentQuantity = getItemQuantity(product.id);
    if (currentQuantity === 0) {
      handleAddToCart(product);
    } else {
      updateQuantity(product.id, currentQuantity + 1);
    }
  };

  const handleDecrement = (productId: string) => {
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    } else {
      updateQuantity(productId, 0);
    }
  };

  const renderProductCard = (product: Product) => {
    const quantity = getItemQuantity(product.id);
    const discountedPrice = product.price * (1 - product.discount_percentage / 100);
    const hasDiscount = product.discount_percentage > 0;
    const stockStatus = getStockStatus(product.stock_quantity);

    return (
      <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        <Link to={`/product/${product.slug}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={product.image_url || ''}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {product.discount_percentage}% OFF
              </div>
            )}
            {product.is_organic && (
              <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Organic
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-4">
          <Link to={`/product/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 text-lg mb-2 hover:text-green-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-baseline space-x-2 mb-3">
            <span className="text-xl font-bold text-green-600">
              ₹{discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-gray-500 line-through text-sm">
                ₹{product.price.toFixed(2)}
              </span>
            )}
            <span className="text-gray-500 text-sm">/ {product.unit}</span>
          </div>
          
          {/* Stock status with conditional display */}
          <div className="flex justify-end mb-4">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${stockStatus.color} ${stockStatus.bgColor}`}>
              {stockStatus.text}
            </span>
          </div>
          
          {/* Add to Cart Button */}
          {quantity === 0 ? (
            <button
              onClick={() => handleAddToCart(product)}
              disabled={!product.is_available || product.stock_quantity === 0}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
          ) : (
            /* Quantity Controls */
            <div className="flex items-center justify-center space-x-4 bg-green-50 rounded-lg py-2 px-4 border border-green-100 transition-all duration-300">
              <button
                onClick={() => handleDecrement(product.id)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-full border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-lg font-semibold text-green-800">
                {quantity} 
              </span>
              <button
                onClick={() => handleIncrement(product)}
                disabled={quantity >= product.stock_quantity}
                className="w-8 h-8 flex items-center justify-center bg-green-600 rounded-full text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${cartAnimation ? 'scale-[1.002]' : ''}`}>
      {/* Cart Animation Overlay */}
      {cartAnimation && (
        <div className="fixed inset-0 bg-green-50 opacity-20 pointer-events-none z-50 transition-opacity duration-300" />
      )}
      
      <div className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Shop Fresh Produce</h1>
          <p className="text-lg opacity-90">
            Discover our wide selection of farm-fresh fruits and vegetables
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <SlidersHorizontal className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === ''}
                      onChange={() => handleCategoryChange('')}
                      className="text-green-600 focus:ring-green-600"
                    />
                    <span className="text-gray-700">All Products</span>
                  </label>
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.slug}
                        onChange={() => handleCategoryChange(category.slug)}
                        className="text-green-600 focus:ring-green-600"
                      />
                      <span className="text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Filters</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOrganic}
                    onChange={(e) => setShowOrganic(e.target.checked)}
                    className="rounded text-green-600 focus:ring-green-600"
                  />
                  <span className="text-gray-700">Organic Only</span>
                </label>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Showing {filteredProducts.length} of {products.length} products
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">
                  No products found matching your criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(renderProductCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}