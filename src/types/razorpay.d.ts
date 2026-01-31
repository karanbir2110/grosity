// src/types/razorpay.d.ts

// Global declaration for Razorpay in browser
declare global {
  interface Window {
    Razorpay: RazorpayStatic;
  }
}

// Main Razorpay interface
export interface RazorpayStatic {
  new (options: RazorpayOptions): RazorpayInstance;
}

// Razorpay instance methods
export interface RazorpayInstance {
  open: () => void;
  on: (event: RazorpayEvent, callback: (response: any) => void) => void;
  close: () => void;
}

// Razorpay events
export type RazorpayEvent = 
  | 'payment.success'
  | 'payment.failed'
  | 'payment.cancel'
  | 'modal.ondismiss'
  | 'modal.close';

// Razorpay options for checkout
export interface RazorpayOptions {
  key: string;
  amount: number; // amount in paise (e.g., 10000 = ₹100)
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string; // order_id from your backend
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
    confirm_close?: boolean;
  };
  readonly?: {
    contact?: boolean;
    email?: boolean;
    name?: boolean;
  };
  config?: {
    display: {
      language?: 'en' | 'ben' | 'hi' | 'mar' | 'guj' | 'tam' | 'tel';
    };
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  timeout?: number;
  remember_customer?: boolean;
}

// Response after successful payment
export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Error response
export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

// For Node.js/backend usage (if needed)
declare module 'razorpay' {
  interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: 'created' | 'attempted' | 'paid';
    attempts: number;
    notes: Record<string, string>;
    created_at: number;
  }

  interface RazorpayPayment {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    method: string;
    email: string;
    contact: string;
    notes: Record<string, string>;
    created_at: number;
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, string>;
        payment_capture?: 0 | 1;
      }): Promise<RazorpayOrder>;
      
      fetch(orderId: string): Promise<RazorpayOrder>;
      
      all(params?: {
        authorized?: 0 | 1;
        receipt?: string;
        'expand[]'?: string;
      }): Promise<{ items: RazorpayOrder[] }>;
      
      payments(orderId: string): Promise<{ items: RazorpayPayment[] }>;
    };
    
    payments: {
      fetch(paymentId: string): Promise<RazorpayPayment>;
      
      capture(
        paymentId: string, 
        amount: number, 
        currency: string
      ): Promise<RazorpayPayment>;
      
      refund(
        paymentId: string, 
        options?: { amount: number; notes?: Record<string, string> }
      ): Promise<any>;
    };
  }
  
  export = Razorpay;
}

// Export for ES modules
export {};