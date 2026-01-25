import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  user_id: string;
  order_number?: string;
  total_amount: number;
  status: string;
  phone?: string;
  delivery_location?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_pincode?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Profile {
  id: string;
  full_name?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        // Fetch orders with all fields including delivery_location
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        if (ordersData) {
          // Cast to Order type
          const typedOrders = ordersData as Order[];
          setOrders(typedOrders);

          // Fetch order items for all orders
          const orderIds = typedOrders.map(order => order.id);
          if (orderIds.length > 0) {
            const { data: itemsData, error: itemsError } = await supabase
              .from('order_items')
              .select('*')
              .in('order_id', orderIds);

            if (itemsError) throw itemsError;

            // Group items by order_id
            const groupedItems: Record<string, OrderItem[]> = {};
            
            // Cast itemsData to OrderItem[] and process
            const typedItems = (itemsData || []) as OrderItem[];
            
            typedItems.forEach(item => {
              if (!groupedItems[item.order_id]) {
                groupedItems[item.order_id] = [];
              }
              groupedItems[item.order_id].push(item);
            });

            setOrderItems(groupedItems);
          }

          // Fetch profile for the user
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (!profileError && profileData) {
            const typedProfile = profileData as Profile;
            setProfiles({ [user.id]: typedProfile });
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'confirmed':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate readable order number
  const getOrderNumber = (order: Order, index: number) => {
    if (order.order_number) return order.order_number;
    
    // Format date for order number
    const date = new Date(order.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Use last 6 characters of order ID for uniqueness
    const orderIdSuffix = order.id.substring(order.id.length - 6).toUpperCase();
    
    return `ORD-${year}${month}${day}-${orderIdSuffix}`;
  };

  // Calculate subtotal for an item
  const calculateSubtotal = (item: OrderItem) => {
    return item.price * item.quantity;
  };

  // Get delivery information - prioritize order delivery_location, fallback to profile
  const getDeliveryInfo = (order: Order) => {
    const userProfile = profiles[order.user_id];
    
    // FIRST PRIORITY: delivery_location from orders table (new orders)
    // SECOND PRIORITY: delivery_address from orders table (old orders)
    // THIRD PRIORITY: address from profile
    
    let deliveryAddress = 'Not provided';
    
    if (order.delivery_location) {
      deliveryAddress = order.delivery_location;
    } else if (order.delivery_address) {
      deliveryAddress = order.delivery_address;
    } else if (userProfile?.address) {
      deliveryAddress = userProfile.address;
    }
    
    return {
      phone: order.phone || userProfile?.mobile || 'Not provided',
      address: deliveryAddress,
      city: order.delivery_city || userProfile?.city || '',
      state: order.delivery_state || userProfile?.state || '',
      pincode: order.delivery_pincode || userProfile?.pincode || '',
      name: userProfile?.full_name || 'Customer',
    };
  };

  // Parse delivery location string into name and description
  const parseDeliveryLocation = (location: string) => {
    if (!location) return { name: '', description: '' };
    
    // Format: "Location Name - Description"
    const parts = location.split(' - ');
    if (parts.length >= 2) {
      return {
        name: parts[0],
        description: parts.slice(1).join(' - ')
      };
    }
    
    return {
      name: location,
      description: ''
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders. Start shopping now!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const deliveryInfo = getDeliveryInfo(order);
              const orderNumber = getOrderNumber(order, index);
              const locationDetails = parseDeliveryLocation(deliveryInfo.address);
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Number</p>
                      <p className="font-semibold text-gray-900">{orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-gray-900">
                        ₹{order.total_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Order Items Section */}
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                      {orderItems[order.id] && orderItems[order.id].length > 0 ? (
                        <div className="space-y-3">
                          {orderItems[order.id].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.product_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Quantity: {item.quantity} × ₹{item.price.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  ₹{calculateSubtotal(item).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No items found for this order</p>
                      )}
                    </div>

                    {/* Delivery Information Section */}
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                        Delivery Information
                      </h3>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">Contact Name</p>
                          <p className="text-gray-900 font-medium">{deliveryInfo.name}</p>
                        </div>

                        <div className="mb-3 flex items-start">
                          <Phone className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Contact Number</p>
                            <p className="text-gray-900 font-medium">{deliveryInfo.phone}</p>
                          </div>
                        </div>
                        
                        {/* Delivery Location Display */}
                        {deliveryInfo.address && deliveryInfo.address !== 'Not provided' && (
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <MapPin className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-600 mb-1">Delivery Point</p>
                                
                                {/* Show location name and description separately if available */}
                                {locationDetails.name ? (
                                  <div>
                                    <p className="text-gray-900 font-semibold text-lg">
                                      {locationDetails.name}
                                    </p>
                                    {locationDetails.description && (
                                      <p className="text-gray-700 mt-1">
                                        {locationDetails.description}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-gray-900 font-medium">{deliveryInfo.address}</p>
                                )}
                                
                                {/* Legacy address fields (for old orders) */}
                                {(deliveryInfo.city || deliveryInfo.state || deliveryInfo.pincode) && (
                                  <p className="mt-2 text-sm text-gray-600">
                                    {deliveryInfo.city && `${deliveryInfo.city}, `}
                                    {deliveryInfo.state && `${deliveryInfo.state} `}
                                    {deliveryInfo.pincode && `- ${deliveryInfo.pincode}`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}