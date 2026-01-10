import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition"
          >
            <Leaf className="h-8 w-8" />
            <span className="text-2xl font-bold">Grosity</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-green-600 transition">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-green-600 transition">
              Shop
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-green-600 transition">
              About Us
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-green-600 transition">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/shop" className="text-gray-600 hover:text-green-600 transition">
              <Search className="h-5 w-5" />
            </Link>

            {user ? (
              /* ✅ FIXED ACCOUNT DROPDOWN - Click to open/close */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="text-gray-600 hover:text-green-600 transition"
                >
                  <User className="h-5 w-5" />
                </button>

                {dropdownOpen && (
                  <div
                    className="
                      absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2
                      border border-gray-100
                      z-50
                    "
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-gray-600 hover:text-green-600 transition">
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link to="/cart" className="relative text-gray-600 hover:text-green-600 transition">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-4 space-y-3">
            <Link
              to="/"
              className="block text-gray-700 hover:text-green-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="block text-gray-700 hover:text-green-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="block text-gray-700 hover:text-green-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="block text-gray-700 hover:text-green-600 transition"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {user && (
              <>
                <Link
                  to="/profile"
                  className="block text-gray-700 hover:text-green-600 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/orders"
                  className="block text-gray-700 hover:text-green-600 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-left w-full text-gray-700 hover:text-green-600 transition"
                >
                  Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}