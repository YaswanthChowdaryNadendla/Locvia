// src/services/paymentService.js
// Mock payment service
// Phase 2 (Backend): Replace with real Razorpay + Spring Boot integration.
//
// IMPORTANT — Production Architecture:
//   1. React calls POST /api/payments/create-order (Spring Boot)
//   2. Spring Boot creates Razorpay order → returns { razorpayOrderId, amount }
//   3. React opens Razorpay checkout with razorpayOrderId
//   4. On payment success, Razorpay returns { paymentId, signature }
//   5. React calls POST /api/payments/verify (Spring Boot)
//   6. Spring Boot verifies HMAC signature → updates order status
//
// Razorpay Key ID (publishable) → frontend
// Razorpay Key Secret           → backend ONLY, never in React

const delay = (ms = 800) => new Promise((res) => setTimeout(res, ms));

// ── Mock: Create payment order ─────────────────────────────
// Real: POST /api/payments/create-order  { orderId, amount }
export const createPaymentOrder = async ({ orderId, amount }) => {
  await delay();
  return {
    razorpayOrderId: `mock_rzp_order_${Date.now()}`,
    amount,
    currency: 'INR',
    orderId,
  };
};

// ── Mock: Simulate payment success ────────────────────────
// Real: Opens Razorpay checkout → user pays → Razorpay triggers success handler
export const simulatePayment = async ({ razorpayOrderId }) => {
  await delay(1200);
  return {
    razorpayPaymentId: `mock_rzp_pay_${Date.now()}`,
    razorpayOrderId,
    razorpaySignature: `mock_signature_${Date.now()}`,
  };
};

// ── Mock: Verify payment ───────────────────────────────────
// Real: POST /api/payments/verify  { paymentId, orderId, signature }
export const verifyPayment = async (paymentData) => {
  await delay(600);
  // Mock always returns success
  return { verified: true, message: 'Payment verified successfully.' };
};

// ── Mock: COD confirmation ─────────────────────────────────
export const confirmCODOrder = async ({ orderId }) => {
  await delay(400);
  return { confirmed: true, orderId, paymentMode: 'COD' };
};
