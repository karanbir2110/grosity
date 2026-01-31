// src/pages/TestPayment.tsx
import React from 'react';
import PaymentButton from '../components/PaymentButton';

const TestPaymentPage: React.FC = () => {
  console.log('TestPayment rendering');

  const handlePaymentSuccess = (response: any) => {
    console.log('Payment Success Response:', response);
    alert(`✅ Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
    
    // You can redirect or update UI here
    // window.location.href = '/payment-success';
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment Error:', error);
    alert(`❌ Payment Failed: ${error.description || error.message}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Test Payment</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Product Details</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Product:</strong> Sample Product</p>
            <p><strong>Amount:</strong> ₹100</p>
            <p><strong>Description:</strong> This is a test payment</p>
          </div>
        </div>

        <div className="space-y-4">
          <PaymentButton
            amount={100}
            productName="Sample Product"
            receipt="order_test_001"
            notes={{
              test: "true",
              type: "razorpay_integration_test"
            }}
            customerName="Test Customer"
            customerEmail="test@example.com"
            customerPhone="9876543210"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onClose={() => console.log('Payment modal closed')}
            className="w-full py-4 text-lg"
          >
            Pay ₹100 Now
          </PaymentButton>

          <PaymentButton
            amount={500}
            productName="Premium Product"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            className="w-full py-4 text-lg bg-green-600 hover:bg-green-700"
          >
            Pay ₹500
          </PaymentButton>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p className="font-semibold mb-2">📋 Test Instructions:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click any payment button above</li>
            <li>Razorpay payment modal will open</li>
            <li>Use test card: <span className="font-mono bg-gray-100 px-1">4111 1111 1111 1111</span></li>
            <li>Expiry: Any future date (e.g., 12/2030)</li>
            <li>CVV: Any 3 digits (e.g., 123)</li>
            <li>Name: Any name</li>
            <li>Click "Pay" button in Razorpay modal</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-medium text-yellow-800">💡 Important:</p>
            <p className="text-yellow-700">This is using Razorpay <strong>TEST MODE</strong>. No real money will be deducted.</p>
            <p className="text-yellow-700 mt-1">Make sure your Razorpay account is in test mode and you're using test keys.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentPage;