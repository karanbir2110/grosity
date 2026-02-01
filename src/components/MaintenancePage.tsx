// src/components/MaintenancePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Clock, Coffee, Home, ShoppingBag, Phone, Mail } from 'lucide-react';
import siteService from '../services/siteService';

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isNight, setIsNight] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if it's night time (between 9 PM and 8 AM)
  const checkIsNightTime = () => {
    const hours = currentTime.getHours();
    return hours >= 21 || hours < 9; // 9 PM to 8 AM
  };

  useEffect(() => {
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      setIsNight(checkIsNightTime());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    setIsNight(checkIsNightTime());
  }, [currentTime]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const isLive = await siteService.isSiteLive();
        if (isLive) {
          navigate('/');
        }
        setLastChecked(new Date());
      } catch (error) {
        console.error('Error checking site status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    // Check immediately
    checkStatus();
    
    // Check every 30 seconds for auto-redirect
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const handleRefresh = async () => {
    setCheckingStatus(true);
    try {
      const isLive = await siteService.isSiteLive();
      if (isLive) {
        navigate('/');
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking site status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleBrowseProducts = () => {
    navigate('/shop');
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get next opening time (8 AM)
  const getNextOpeningTime = () => {
    const now = new Date();
    const nextOpening = new Date(now);
    
    if (now.getHours() < 8) {
      // Still before 8 AM today
      nextOpening.setHours(9, 0, 0, 0);
    } else {
      // After 8 AM, set to 8 AM tomorrow
      nextOpening.setDate(nextOpening.getDate() + 1);
      nextOpening.setHours(9, 0, 0, 0);
    }
    
    return nextOpening;
  };

  const nextOpening = getNextOpeningTime();

  // Loading state
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Checking store status...</p>
          <p className="text-sm text-gray-400 mt-2">{formatTime(currentTime)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Day/Night Theme */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-full ${isNight ? 'bg-blue-900/30' : 'bg-blue-100/10'} border ${isNight ? 'border-blue-700/50' : 'border-blue-400/30'}`}>
              {isNight ? (
                <Moon className="h-20 w-20 text-blue-400" />
              ) : (
                <Sun className="h-20 w-20 text-yellow-400" />
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full mb-4">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="font-mono text-lg">{formatTime(currentTime)}</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {isNight ? 'Store Closed for the Night 🌙' : 'Store Currently Offline'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {isNight 
              ? 'We are closed for the night. Delivery services have stopped for today.'
              : 'Our delivery services are currently unavailable. Please check back during business hours.'}
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${isNight ? 'bg-blue-900/40' : 'bg-yellow-900/40'}`}>
                {isNight ? (
                  <Coffee className="h-8 w-8 text-blue-300" />
                ) : (
                  <Clock className="h-8 w-8 text-yellow-300" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isNight ? 'Closed for the Night' : 'Delivery Service Paused'}
                </h2>
                <p className="text-gray-400">
                  {isNight 
                    ? 'Our team is resting for the night'
                    : 'Our delivery partners are currently unavailable'}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-900/70 px-6 py-3 rounded-xl border border-gray-700">
              <div className="text-center">
                <div className={`text-sm font-semibold mb-1 ${isNight ? 'text-blue-400' : 'text-yellow-400'}`}>
                  {isNight ? 'NIGHT TIME' : 'OFFLINE'}
                </div>
                <div className="text-xs text-gray-400">
                  {isNight ? '9:00 PM - 9:00 AM' : 'Check back soon'}
                </div>
              </div>
            </div>
          </div>

          {/* Opening Hours Information */}
          <div className="bg-gray-900/40 p-6 rounded-xl border border-gray-700/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </h3>
                <div className="space-y-2" >
                  <div className="flex justify-between" >
                    <span className="text-gray-400">Monday - Sunday:</span>
                    <span className="font-semibold">9:00 AM - 9:00 PM</span>
                  </div>
                  
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Next Opening
                </h3>
                <div className="bg-gray-800/60 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-300">
                      {nextOpening.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {nextOpening.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-gray-300 text-center">
                <span className="font-semibold">Note:</span> {isNight 
                  ? 'You can browse products and add items to your cart, but checkout and delivery will be available from 9:00 AM tomorrow.'
                  : 'Delivery services resume during business hours. You can still browse our products.'}
              </p>
            </div>
          </div>
        </div>

        {/* What You Can Do */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-900/30 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-300" />
              </div>
              <h3 className="text-xl font-bold">Browse Products</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Explore our catalog and save items to your wishlist for when we reopen.
            </p>
            <button
              onClick={handleBrowseProducts}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Start Browsing
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <Home className="h-6 w-6 text-purple-300" />
              </div>
              <h3 className="text-xl font-bold">Return Home</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Go back to our homepage to learn more about our store and products.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Go Home
            </button>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-green-300" />
              </div>
              <h3 className="text-xl font-bold">Check Status</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Check if we're back online. Auto-checks every 30 seconds.
            </p>
            <button
              onClick={handleRefresh}
              disabled={checkingStatus}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                {checkingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Checking...
                  </>
                ) : (
                  'Check Now'
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50">
          <h3 className="text-2xl font-bold text-center mb-8">Need Assistance?</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900/40 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-900/30 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-300" />
                </div>
                <h4 className="text-lg font-bold">Email Support</h4>
              </div>
              <p className="text-gray-400 mb-3">
                Send us an email and we'll respond when we reopen.
              </p>
              <a
                href="mailto:support@yourdomain.com"
                className="text-blue-300 hover:text-blue-200 font-medium inline-flex items-center gap-2"
              >
                grostiy.connect@gmail.com
              </a>
            </div>

            <div className="bg-gray-900/40 p-6 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-900/30 rounded-lg">
                  <Phone className="h-6 w-6 text-green-300" />
                </div>
                <h4 className="text-lg font-bold">Emergency Contact</h4>
              </div>
              <p className="text-gray-400 mb-3">
                For urgent matters regarding existing orders.
              </p>
              <a
                href="tel:+911234567890"
                className="text-green-300 hover:text-green-200 font-medium inline-flex items-center gap-2"
              >
                +91 7309685242
              </a>
            </div>
          </div>

          {/* Auto-check Status */}
          <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-lg mb-2">Automatic Reopening Detection</h4>
                <p className="text-gray-400 text-sm">
                  This page will automatically redirect you when we reopen.
                  Next check: 30 seconds
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isNight ? 'animate-pulse bg-blue-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm">
                  Last checked: {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 pt-8 border-t border-gray-700/30">
          <div className="mb-4">
            {isNight ? (
              <div className="inline-flex items-center gap-2 text-gray-400">
                <Moon className="h-4 w-4" />
                <span>Have a good night! We'll see you tomorrow morning.</span>
                <Moon className="h-4 w-4" />
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Thank you for your patience. We'll be back soon!</span>
                <Clock className="h-4 w-4" />
              </div>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Current time: {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage; 