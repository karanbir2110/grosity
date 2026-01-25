import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User, CheckCircle, MapPin, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Define a type for the profile
interface Profile {
  full_name?: string;
  mobile?: string;
  address?: string;
}

// Predefined delivery locations (same as in Checkout.tsx)
const DELIVERY_LOCATIONS = [
  { id: 'hostel_a', name: 'Hostel A', description: 'Main Block' },
  { id: 'hostel_b', name: 'Hostel B', description: 'Near Sports Complex' },
  { id: 'hostel_c', name: 'Hostel C', description: 'New Building' },
  { id: 'hostel_d', name: 'Hostel D', description: 'International Hostel' },
  { id: 'library', name: 'Central Library', description: 'Main Campus' },
  { id: 'cafeteria', name: 'Main Cafeteria', description: 'Food Court Area' },
  { id: 'admin_block', name: 'Administration Block', description: 'Reception Desk' },
  { id: 'sports_complex', name: 'Sports Complex', description: 'Entrance Gate' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveAnimation, setSaveAnimation] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    address: '',
  });

  // Track selected delivery location
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  /* =====================
     AUTH CHECK
     ===================== */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  /* =====================
     FETCH PROFILE
     ===================== */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        // Cast the result to the Profile type
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, mobile, address')
          .eq('id', user.id)
          .single() as { data: Profile | null; error: any };

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching profile:', error);
        }

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            mobile: data.mobile || '',
            address: data.address || '',
          });

          // Check if saved address matches any predefined location
          if (data.address) {
            const matchedLocation = DELIVERY_LOCATIONS.find(
              loc => data.address?.includes(loc.name) || data.address === loc.id
            );
            if (matchedLocation) {
              setSelectedLocation(matchedLocation.id);
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* =====================
     HANDLE LOCATION SELECTION
     ===================== */
  const handleLocationSelect = (locationId: string) => {
    setSelectedLocation(locationId);
    const location = DELIVERY_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
      setFormData(prev => ({
        ...prev,
        address: `${location.name} - ${location.description}`
      }));
    }
  };

  /* =====================
     UPDATE PROFILE
     ===================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields
    if (!formData.full_name || !formData.mobile) {
      alert('Please fill in your full name and mobile number');
      return;
    }

    // Validate delivery location selection
    if (!selectedLocation) {
      alert('Please select a delivery location');
      return;
    }

    setSaving(true);
    setSuccess(false);

    // Trigger save animation
    setSaveAnimation(true);

    // Cast the data to 'any' to bypass TypeScript errors
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'user',
        full_name: formData.full_name,
        mobile: formData.mobile,
        address: formData.address,
      } as any); // Use type assertion to 'any'

    setSaving(false);

    if (!error) {
      setSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
      // Stop animation after 1.5 seconds
      setTimeout(() => {
        setSaveAnimation(false);
      }, 1500);
    } else {
      alert(error.message);
      setSaveAnimation(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Get selected location details
  const selectedLocationDetails = selectedLocation 
    ? DELIVERY_LOCATIONS.find(loc => loc.id === selectedLocation)
    : null;

  return (
    <>
      {/* Inline CSS styles for animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
          
          .animate-shimmer {
            animation: shimmer 1.5s infinite;
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-50 py-8">
        {/* Save Animation Overlay */}
        {saveAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-green-50 opacity-0 animate-pulse"></div>
            <div className="relative z-10">
              <div className="animate-bounce">
                <div className="bg-green-600 text-white p-6 rounded-full shadow-2xl transform transition-all duration-300 scale-100">
                  <CheckCircle className="h-12 w-12" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4">
          <div className={`bg-white rounded-xl shadow-lg p-6 md:p-8 transition-all duration-300 ${
            saveAnimation ? 'ring-4 ring-green-200 ring-opacity-50 scale-102' : ''
          }`}>
            {/* Profile Header with Selected Location Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-green-600" />
                  <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                </div>
                
                {/* Current Delivery Location Badge */}
                {selectedLocationDetails && (
                  <div className={`hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 transition-all duration-300 ${
                    saveAnimation ? 'scale-105 shadow-md' : ''
                  }`}>
                    <MapPin className="h-4 w-4" />
                    <div className="text-sm">
                      <span className="font-medium">Delivery Point:</span>{' '}
                      {selectedLocationDetails.name}
                    </div>
                    {saveAnimation && (
                      <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Mobile-friendly location display */}
              {selectedLocationDetails && (
                <div className={`md:hidden mb-4 p-3 bg-green-50 rounded-lg border border-green-200 transition-all duration-300 ${
                  saveAnimation ? 'scale-105 shadow-md' : ''
                }`}>
                  <div className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Selected Delivery Point</p>
                      <p className="text-green-900 font-semibold">{selectedLocationDetails.name}</p>
                      <p className="text-xs text-green-600 mt-1">{selectedLocationDetails.description}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {saveAnimation && (
                      <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse absolute -top-1 -right-1" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-700 font-medium">
                    Profile updated successfully!
                  </p>
                </div>
                <p className="text-sm text-green-600 text-center mt-1">
                  Your delivery preference has been saved
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email address cannot be changed
                </p>
              </div>

              {/* Personal Information Section */}
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Personal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      required
                    />
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="Enter your 10-digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      10-digit mobile number without country code
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Location Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Delivery Location
                  </h2>
                  
                  {/* Current Selection Display */}
                  {selectedLocationDetails && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Current Selection:</span>
                      <span className={`bg-green-100 text-green-800 px-3 py-1 rounded-full transition-all duration-300 ${
                        saveAnimation ? 'scale-110 shadow-md' : ''
                      }`}>
                        {selectedLocationDetails.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Your Preferred Delivery Point *
                  </label>
                  
                  {/* Selected Location Preview Card */}
                  {selectedLocationDetails && (
                    <div className={`mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg transition-all duration-300 ${
                      saveAnimation ? 'ring-4 ring-green-100 scale-102' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <p className="text-green-800 font-semibold">Currently Selected</p>
                          </div>
                          <h3 className="text-lg font-bold text-green-900">
                            {selectedLocationDetails.name}
                          </h3>
                          <p className="text-green-700">{selectedLocationDetails.description}</p>
                        </div>
                        <div className={`bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                          saveAnimation ? 'bg-green-200 scale-110' : ''
                        }`}>
                          {saveAnimation ? 'Saved!' : 'Active'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location Options Grid */}
                  <div className="grid md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {DELIVERY_LOCATIONS.map(location => (
                      <div
                        key={location.id}
                        className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedLocation === location.id
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${
                          saveAnimation && selectedLocation === location.id ? 'animate-pulse' : ''
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
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-800">
                              {location.name}
                            </label>
                            {selectedLocation === location.id && (
                              <div className="flex items-center text-green-600 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                <span>Selected</span>
                                {saveAnimation && (
                                  <Sparkles className="h-3 w-3 ml-1 text-yellow-500 animate-spin" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {location.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Information Note */}
                  <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> We only deliver to these predefined points. 
                      Please select your preferred delivery location. This will be used for all your orders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <button
                      type="submit"
                      disabled={saving || !selectedLocation}
                      className={`bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 text-lg flex items-center gap-3 relative overflow-hidden ${
                        saveAnimation ? 'animate-pulse' : ''
                      }`}
                    >
                      {/* Button shine effect during save */}
                      {saveAnimation && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      )}
                      
                      <Save className={`h-5 w-5 transition-transform duration-300 ${
                        saving || saveAnimation ? 'animate-spin' : ''
                      }`} />
                      {saving ? 'Saving...' : saveAnimation ? 'Saved!' : 'Save Profile'}
                    </button>
                    
                    {!selectedLocation && (
                      <p className="mt-2 text-sm text-red-600">
                        * Please select a delivery location to save your profile
                      </p>
                    )}
                  </div>
                  
                  {/* Selection Summary */}
                  {selectedLocationDetails && (
                    <div className="hidden md:block text-right">
                      <p className="text-sm text-gray-500">Delivery will be to:</p>
                      <p className={`font-semibold text-gray-800 transition-all duration-300 ${
                        saveAnimation ? 'text-green-600 scale-105' : ''
                      }`}>
                        {selectedLocationDetails.name}
                      </p>
                      {saveAnimation && (
                        <p className="text-xs text-green-500 mt-1 animate-fadeIn">
                          ✓ Preference saved
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}