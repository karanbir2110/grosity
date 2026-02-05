import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone, MapPin, Leaf, Linkedin, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center space-x-2 text-white mb-4">
              <Leaf className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold">Grosity</span>
            </Link>
            <p className="text-sm mb-4">
              Freshly produced, delivered straight from the farms to your doorstep.
            </p>
            <div className="flex space-x-4 mt-4">
              <a 
                href="https://www.linkedin.com/company/grosityindia/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-green-500 transition"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a 
                href="https://www.instagram.com/grosityindia" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-green-500 transition"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://wa.me/message/2HGRVAHSLXX6K1" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-green-500 transition"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="hover:text-green-500 transition">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-green-500 transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-green-500 transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-green-500 transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shop?category=fruits" className="hover:text-green-500 transition">
                  Fruits
                </Link>
              </li>
              <li>
                <Link to="/shop?category=vegetables" className="hover:text-green-500 transition">
                  Vegetables
                </Link>
              </li>
              <li>
                <Link to="/shop?category=organic fertilizer" className="hover:text-green-500 transition">
                  Organic Fertilizer
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">Thapar Institute Of Engineering and Technology,147003</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-500" />
                <span className="text-sm">+91 7309685242</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-green-500" />
                <span className="text-sm">grostiy.connect@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="text-sm">
              &copy; 2025 Grosity. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm hover:text-green-500 transition">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm hover:text-green-500 transition">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}