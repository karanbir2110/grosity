// src/utils/razorpayConfig.ts

// Get Razorpay key from environment variables
// Vite uses import.meta.env, not process.env
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Validate Razorpay key on import
if (!RAZORPAY_KEY_ID) {
  console.error('❌ VITE_RAZORPAY_KEY_ID is not set in .env file');
} else if (RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
  console.warn('⚠️ Using TEST Razorpay key. For live payments, use LIVE key (rzp_live_)');
} else if (RAZORPAY_KEY_ID.startsWith('rzp_live_')) {
  console.log('✅ Using LIVE Razorpay key');
} else {
  console.error('❌ Invalid Razorpay key format. Should start with rzp_test_ or rzp_live_');
}

// Razorpay options interface
export interface PaymentData {
  amount: number; // in INR (e.g., 100 for ₹100)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  internal_order_id?: string;
  productName?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

// Website/company details - CONFIRMED: Your business name is "Grosity"
export const COMPANY_DETAILS = {
  name: 'Grosity', // CONFIRMED from razorpay.me/@grosity
  logo: '/logo.png', // path to your logo
  primaryColor: '#000000', // your brand color
  description: 'Your one-stop shop for quality products',
};

// Currency configuration
export const CURRENCY_CONFIG = {
  INR: {
    symbol: '₹',
    decimal: 2,
    multiplier: 100, // convert to paise
  },
  USD: {
    symbol: '$',
    decimal: 2,
    multiplier: 100, // convert to cents
  },
};

// Get current currency config
export function getCurrencyConfig(currency: string = 'INR') {
  return CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG] || CURRENCY_CONFIG.INR;
}

// Validate payment amount
export function validateAmount(amount: number, currency: string = 'INR'): string | null {
  const config = getCurrencyConfig(currency);
  const minAmount = currency === 'INR' ? 100 : 100; // 1 INR or 1 USD in smallest unit
  
  if (amount < 1) {
    return 'Amount must be at least 1';
  }
  
  const amountInSmallestUnit = amount * config.multiplier;
  if (amountInSmallestUnit < minAmount) {
    return `Amount must be at least ${config.symbol}${minAmount / config.multiplier}`;
  }
  
  return null;
}

// Convert amount to paise/cents
export function convertToSmallestUnit(amount: number, currency: string = 'INR'): number {
  const config = getCurrencyConfig(currency);
  return Math.round(amount * config.multiplier);
}

// Convert from paise/cents to readable amount
export function convertFromSmallestUnit(amount: number, currency: string = 'INR'): number {
  const config = getCurrencyConfig(currency);
  return amount / config.multiplier;
}