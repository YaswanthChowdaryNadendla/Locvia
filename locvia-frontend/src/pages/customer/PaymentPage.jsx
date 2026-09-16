// src/pages/customer/PaymentPage.jsx
// MODULE 14 — Razorpay Mock Payment Page Implementation for Locvia

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Building,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  Lock,
  Sparkles,
  ChevronRight,
  CreditCard,
  QrCode,
  Building2,
  Wallet as WalletIcon,
  RefreshCw,
  Tag,
  WifiOff,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useDeliveryLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import * as orderApi from '../../services/api/orderApi';
import * as paymentApi from '../../services/api/paymentApi';
import { setLastOrder, generateOrderId } from '../../services/orderService';
import { formatPrice } from '../../utils/formatters';

// Available Banks for Net Banking
const POPULAR_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
  { id: 'kotak', name: 'Kotak Mahindra Bank' },
  { id: 'indusind', name: 'IndusInd Bank' },
];

// Available Wallets
const POPULAR_WALLETS = [
  { id: 'paytm', name: 'Paytm Wallet' },
  { id: 'phonepe', name: 'PhonePe Wallet' },
  { id: 'amazonpay', name: 'Amazon Pay Balance' },
  { id: 'mobikwik', name: 'MobiKwik' },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();

  // Auth Context
  const { user } = useAuth();

  // Cart Context State & Pricing
  const {
    items,
    totalAmount,
    totalMRP,
    totalSavings,
    appliedCoupon,
    clearCart
  } = useCart();

  // Address & Delivery Location Context
  const { addresses, defaultAddress } = useAddress();
  const { activeSavedAddress } = useDeliveryLocation();

  // Active delivery address resolution priority:
  // 1. Explicitly selected saved address from M12/M13
  // 2. Default saved address
  // 3. First available saved address
  const activeAddress = useMemo(() => {
    if (activeSavedAddress) return activeSavedAddress;
    if (defaultAddress) return defaultAddress;
    if (addresses.length > 0) return addresses[0];
    return null;
  }, [activeSavedAddress, defaultAddress, addresses]);

  // Delivery fee logic matching M11 Cart & M13 Checkout: ₹25 standard; Free >= ₹500
  const FREE_DELIVERY_THRESHOLD = 500;
  const STANDARD_DELIVERY_FEE = 25;

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0;
    if (appliedCoupon?.type === 'free_shipping') return 0;
    return totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  }, [items.length, totalAmount, appliedCoupon]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'fixed') {
      return appliedCoupon.discountAmount;
    }
    if (appliedCoupon.type === 'percentage') {
      const discount = (totalAmount * appliedCoupon.discountPercentage) / 100;
      return Math.min(discount, appliedCoupon.maxDiscountAmount);
    }
    return 0;
  }, [appliedCoupon, totalAmount]);

  const finalTotal = useMemo(() => {
    if (items.length === 0) return 0;
    const total = totalAmount - couponDiscount + deliveryFee;
    return Math.max(0, total);
  }, [items.length, totalAmount, deliveryFee, couponDiscount]);

  // Payment Form States
  const [selectedMethod, setSelectedMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  
  // Temporary Form Inputs (Strictly in-memory React state, never persisted)
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');

  // Demo Failure Toggle
  const [forceFailDemo, setForceFailDemo] = useState(false);

  // Validation Error state
  const [validationError, setValidationError] = useState('');

  // Simulation state: 'idle' | 'processing' | 'success' | 'failed'
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [mockPaymentId, setMockPaymentId] = useState('');

  // Address Type Icon Helper
  const TypeIcon =
    activeAddress?.type === 'Work'
      ? Briefcase
      : activeAddress?.type === 'Other'
      ? Building
      : Home;

  // Form Input Formatters & Handlers
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
    setValidationError('');
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
    setValidationError('');
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(raw);
    setValidationError('');
  };

  // Generate Mock Payment ID
  const generateMockPaymentId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `MOCK_PAY_${rand}`;
  };

  // Validate Mock Payment Input
  const validateForm = () => {
    setValidationError('');
    if (selectedMethod === 'upi') {
      const trimmed = upiId.trim();
      if (!trimmed) {
        setValidationError('Please enter your UPI ID.');
        return false;
      }
      if (!trimmed.includes('@') || trimmed.length < 4) {
        setValidationError('Please enter a valid UPI ID (e.g. username@upi or mobile@okhdfcbank).');
        return false;
      }
    } else if (selectedMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length !== 16) {
        setValidationError('Please enter a valid 16-digit card number.');
        return false;
      }
      if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        setValidationError('Please enter a valid expiry date (MM/YY).');
        return false;
      }
      if (cardCvv.length !== 3) {
        setValidationError('Please enter a valid 3-digit CVV number.');
        return false;
      }
    } else if (selectedMethod === 'netbanking') {
      if (!selectedBank) {
        setValidationError('Please select a bank for Net Banking.');
        return false;
      }
    } else if (selectedMethod === 'wallet') {
      if (!selectedWallet) {
        setValidationError('Please select a wallet provider.');
        return false;
      }
    }
    return true;
  };

  // Submit Payment Handler
  const handleInitiatePayment = async (e) => {
    if (e) e.preventDefault();
    if (paymentStatus === 'processing') return;

    // Module 39 PWA Safety: Never falsely complete payment or place order while offline
    if (!isOnline) {
      setValidationError("You're offline. Please reconnect to internet to place your order.");
      return;
    }

    if (!validateForm()) return;

    // Start simulated payment loading state
    setPaymentStatus('processing');

    const generatedPaymentId = generateMockPaymentId();
    setMockPaymentId(generatedPaymentId);

    if (forceFailDemo) {
      setTimeout(() => setPaymentStatus('failed'), 1000);
      return;
    }

    try {
      const token = localStorage.getItem('locvia_token');
      if (token && activeAddress?.id) {
        // 1. Create real order on Spring Boot backend
        const createdOrder = await orderApi.createOrder({
          addressId: Number(activeAddress.id),
        });

        // 2. Create payment record on Spring Boot backend
        try {
          await paymentApi.createPayment({
            orderId: createdOrder.id,
            paymentMethod: selectedMethod === 'cod' ? 'COD' : (selectedMethod === 'upi' ? 'UPI' : 'MOCK'),
          });
        } catch (payErr) {
          console.warn('[PaymentPage] Backend payment recording warning:', payErr.message);
        }

        // 3. Persist last order snapshot for confirmation screen
        setLastOrder(createdOrder);

        // 4. Clear cart after successful order creation
        await clearCart();

        // 5. Update UI state to success
        setPaymentStatus('success');
      } else {
        // Fallback for unauthenticated or local flow
        const newOrderId = generateOrderId();
        const orderSnapshot = {
          id: newOrderId,
          orderId: newOrderId,
          userId: user?.id || 'cust-01',
          paymentId: generatedPaymentId,
          paymentMethod: selectedMethod,
          paymentStatus: 'PAID',
          orderStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          address: activeAddress || null,
          items: items.map((item) => ({
            id: item.id || item.product?.id,
            productId: item.product?.id,
            name: item.product?.name,
            image: item.product?.image || item.product?.imageUrl,
            quantity: item.quantity,
            price: item.product?.price,
          })),
          pricing: {
            subtotal: totalAmount,
            totalAmount: finalTotal,
          },
        };

        setLastOrder(orderSnapshot);
        clearCart();
        setPaymentStatus('success');
      }
    } catch (err) {
      console.error('[PaymentPage] Order placement error:', err);
      setValidationError(err.message || 'Payment processing failed. Please try again.');
      setPaymentStatus('failed');
    }
  };

  // Reset Failure State to Retry
  const handleRetry = () => {
    setPaymentStatus('idle');
    setValidationError('');
  };

  // Navigate to M15 Order Confirmation after success
  const handleContinueSuccess = () => {
    navigate('/customer/order-confirmation');
  };

  // ── 1. GUARD: EMPTY CART VIEW ─────────────────────────────────────────────
  if (items.length === 0 && paymentStatus !== 'success') {
    return (
      <div className="payment-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <div className="payment-empty-card">
            <div className="payment-empty-icon-wrap">
              <ShoppingBag size={52} strokeWidth={1.8} className="text-primary" />
            </div>
            <h2 className="payment-empty-title">No order to pay for</h2>
            <p className="payment-empty-sub">
              Your cart is currently empty. Please add items to your cart before proceeding to payment.
            </p>
            <button
              onClick={() => navigate('/customer/cart')}
              className="btn btn-primary btn-lg payment-continue-btn"
            >
              Back to Cart
            </button>
          </div>
        </Container>
      </div>
    );
  }

  // ── 2. GUARD: MISSING ADDRESS VIEW ───────────────────────────────────────
  if (!activeAddress && paymentStatus !== 'success') {
    return (
      <div className="payment-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <div className="payment-empty-card">
            <div className="payment-empty-icon-wrap warning">
              <AlertCircle size={52} strokeWidth={1.8} className="text-warning" />
            </div>
            <h2 className="payment-empty-title">Please select a delivery address first</h2>
            <p className="payment-empty-sub">
              No active delivery address was found for this order. Please return to checkout to select or add an address.
            </p>
            <button
              onClick={() => navigate('/customer/checkout')}
              className="btn btn-primary btn-lg payment-continue-btn"
            >
              Back to Checkout
            </button>
          </div>
        </Container>
      </div>
    );
  }

  // ── 3. SUCCESS PAYMENT OVERLAY/VIEW ────────────────────────────────────────
  if (paymentStatus === 'success') {
    return (
      <div className="payment-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
          <div className="payment-result-card payment-success-card animate-scale-in">
            
            <div className="result-icon-circle success">
              <CheckCircle2 size={56} className="text-green" />
            </div>

            <span className="payment-demo-badge">Razorpay Mock Payment</span>

            <h1 className="result-title">Payment Successful</h1>
            <p className="result-amount">{formatPrice(finalTotal)} paid successfully</p>
            <p className="result-sub-text">
              Your mock payment has been processed and verified.
            </p>

            <div className="mock-payment-details-box">
              <div className="detail-row">
                <span className="detail-label">Payment ID</span>
                <span className="detail-value font-mono">{mockPaymentId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value uppercase">{selectedMethod}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value text-green font-medium">Completed (Mock)</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Delivering To</span>
                <span className="detail-value">{activeAddress?.fullName} ({activeAddress?.city})</span>
              </div>
            </div>

            <div className="result-actions">
              <button
                onClick={handleContinueSuccess}
                className="btn btn-primary btn-lg btn-block continue-to-order-btn"
              >
                <span>Continue</span>
                <ChevronRight size={20} />
              </button>
            </div>

            <p className="result-footer-note">
              <ShieldCheck size={14} /> Demo Flow • No actual money was deducted from your account.
            </p>

          </div>
        </Container>
      </div>
    );
  }

  // ── 4. MAIN PAYMENT SELECTION VIEW ───────────────────────────────────────
  return (
    <div className="payment-page-wrapper animate-fade-in">
      <Container style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Navigation Bar Header */}
        <div className="payment-header-bar">
          <button
            onClick={() => navigate('/customer/checkout')}
            className="payment-back-btn"
            aria-label="Back to Checkout"
          >
            <ArrowLeft size={18} />
            <span>Back to Checkout</span>
          </button>
          <div className="payment-header-titles">
            <h1 className="payment-page-title">Payment</h1>
            <p className="payment-page-subtitle">
              Complete your payment securely using Razorpay Mock Gateway.
            </p>
          </div>
        </div>

        {/* Main 2-Column Responsive Grid */}
        <div className="payment-main-grid">

          {/* LEFT COLUMN: Delivery Address & Payment Method Selector */}
          <div className="payment-left-col">

            {/* Delivery Address Summary Card */}
            <div className="payment-card payment-address-summary-card">
              <div className="payment-card-header">
                <div className="card-header-left">
                  <MapPin size={18} className="text-primary" />
                  <h2>Delivering to</h2>
                </div>
                <button
                  onClick={() => navigate('/customer/checkout')}
                  className="address-change-link"
                >
                  Change
                </button>
              </div>

              <div className="payment-address-body">
                <div className="address-badge-line">
                  <span className="address-type-pill">
                    <TypeIcon size={13} />
                    {activeAddress?.type || 'Home'}
                  </span>
                  <span className="address-person-name">{activeAddress?.fullName}</span>
                  <span className="address-person-phone">+91 {activeAddress?.phone}</span>
                </div>
                <p className="address-full-text">
                  {activeAddress?.addressLine1}{activeAddress?.addressLine2 ? `, ${activeAddress?.addressLine2}` : ''}, {activeAddress?.city}, {activeAddress?.state} — {activeAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Payment Method Selector Card */}
            <div className="payment-card payment-methods-card">
              
              <div className="payment-card-header header-with-badge">
                <div className="card-header-left">
                  <ShieldCheck size={20} className="text-primary" />
                  <h2>Select Payment Method</h2>
                </div>
                <div className="razorpay-branding-badge">
                  <span className="rzp-dot" />
                  <span className="rzp-text">Razorpay</span>
                  <span className="rzp-mock-tag">Demo</span>
                </div>
              </div>

              {/* Validation Warning Alert */}
              {validationError && (
                <div className="payment-alert-box error">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Payment Methods List */}
              <div className="payment-methods-options">

                {/* 1. UPI */}
                <div
                  className={`payment-option-block ${selectedMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMethod('upi');
                    setValidationError('');
                  }}
                >
                  <div className="option-header-row">
                    <div className="option-radio-wrap">
                      <div className={`custom-radio-circle ${selectedMethod === 'upi' ? 'checked' : ''}`}>
                        {selectedMethod === 'upi' && <div className="radio-inner-dot" />}
                      </div>
                    </div>
                    <div className="option-label-wrap">
                      <div className="option-title-line">
                        <QrCode size={18} className="text-primary icon-left" />
                        <span className="option-title">UPI</span>
                        <span className="option-badge">Instant</span>
                      </div>
                      <p className="option-desc">Google Pay, PhonePe, Paytm, BHIM or any UPI ID</p>
                    </div>
                  </div>

                  {/* Expanded Form: UPI */}
                  {selectedMethod === 'upi' && (
                    <div className="option-expanded-form animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <div className="form-group">
                        <label htmlFor="upiIdInput" className="form-label">
                          Enter UPI ID <span className="required-star">*</span>
                        </label>
                        <div className="input-with-button-wrap">
                          <input
                            id="upiIdInput"
                            type="text"
                            placeholder="e.g. username@upi or mobile@okhdfcbank"
                            value={upiId}
                            onChange={(e) => {
                              setUpiId(e.target.value);
                              setValidationError('');
                            }}
                            className={`form-input ${validationError && !upiId ? 'has-error' : ''}`}
                          />
                        </div>
                        <p className="field-help-text">
                          A fake payment request will be simulated for this UPI ID.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Credit / Debit Card */}
                <div
                  className={`payment-option-block ${selectedMethod === 'card' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMethod('card');
                    setValidationError('');
                  }}
                >
                  <div className="option-header-row">
                    <div className="option-radio-wrap">
                      <div className={`custom-radio-circle ${selectedMethod === 'card' ? 'checked' : ''}`}>
                        {selectedMethod === 'card' && <div className="radio-inner-dot" />}
                      </div>
                    </div>
                    <div className="option-label-wrap">
                      <div className="option-title-line">
                        <CreditCard size={18} className="text-primary icon-left" />
                        <span className="option-title">Credit / Debit Card</span>
                      </div>
                      <p className="option-desc">Visa, Mastercard, RuPay, Maestro & more</p>
                    </div>
                  </div>

                  {/* Expanded Form: Card */}
                  {selectedMethod === 'card' && (
                    <div className="option-expanded-form animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <div className="form-group">
                        <label htmlFor="cardNumber" className="form-label">Card Number <span className="required-star">*</span></label>
                        <input
                          id="cardNumber"
                          type="text"
                          maxLength={19}
                          placeholder="4532 •••• •••• 8912"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-row-2col">
                        <div className="form-group">
                          <label htmlFor="cardExpiry" className="form-label">Expiry (MM/YY) <span className="required-star">*</span></label>
                          <input
                            id="cardExpiry"
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            className="form-input font-mono"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="cardCvv" className="form-label">CVV <span className="required-star">*</span></label>
                          <input
                            id="cardCvv"
                            type="password"
                            maxLength={3}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={handleCvvChange}
                            className="form-input font-mono"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="cardHolder" className="form-label">Name on Card <span className="optional-tag">(Optional)</span></label>
                        <input
                          id="cardHolder"
                          type="text"
                          placeholder="e.g. Yaswanth Chowdary"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="form-input"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Net Banking */}
                <div
                  className={`payment-option-block ${selectedMethod === 'netbanking' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMethod('netbanking');
                    setValidationError('');
                  }}
                >
                  <div className="option-header-row">
                    <div className="option-radio-wrap">
                      <div className={`custom-radio-circle ${selectedMethod === 'netbanking' ? 'checked' : ''}`}>
                        {selectedMethod === 'netbanking' && <div className="radio-inner-dot" />}
                      </div>
                    </div>
                    <div className="option-label-wrap">
                      <div className="option-title-line">
                        <Building2 size={18} className="text-primary icon-left" />
                        <span className="option-title">Net Banking</span>
                      </div>
                      <p className="option-desc">All major Indian banks supported</p>
                    </div>
                  </div>

                  {/* Expanded Form: Net Banking */}
                  {selectedMethod === 'netbanking' && (
                    <div className="option-expanded-form animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <div className="form-group">
                        <label htmlFor="bankSelect" className="form-label">Select Your Bank <span className="required-star">*</span></label>
                        <select
                          id="bankSelect"
                          value={selectedBank}
                          onChange={(e) => {
                            setSelectedBank(e.target.value);
                            setValidationError('');
                          }}
                          className="form-select"
                        >
                          <option value="">-- Choose Bank --</option>
                          {POPULAR_BANKS.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Wallet */}
                <div
                  className={`payment-option-block ${selectedMethod === 'wallet' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedMethod('wallet');
                    setValidationError('');
                  }}
                >
                  <div className="option-header-row">
                    <div className="option-radio-wrap">
                      <div className={`custom-radio-circle ${selectedMethod === 'wallet' ? 'checked' : ''}`}>
                        {selectedMethod === 'wallet' && <div className="radio-inner-dot" />}
                      </div>
                    </div>
                    <div className="option-label-wrap">
                      <div className="option-title-line">
                        <WalletIcon size={18} className="text-primary icon-left" />
                        <span className="option-title">Wallet</span>
                      </div>
                      <p className="option-desc">Paytm Wallet, PhonePe Wallet, Amazon Pay</p>
                    </div>
                  </div>

                  {/* Expanded Form: Wallet */}
                  {selectedMethod === 'wallet' && (
                    <div className="option-expanded-form animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <div className="form-group">
                        <label htmlFor="walletSelect" className="form-label">Select Wallet <span className="required-star">*</span></label>
                        <select
                          id="walletSelect"
                          value={selectedWallet}
                          onChange={(e) => {
                            setSelectedWallet(e.target.value);
                            setValidationError('');
                          }}
                          className="form-select"
                        >
                          <option value="">-- Choose Wallet --</option>
                          {POPULAR_WALLETS.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Developer / Demo Failure Mode Switch */}
              <div className="demo-failure-switch-row">
                <label className="demo-toggle-label">
                  <input
                    type="checkbox"
                    checked={forceFailDemo}
                    onChange={(e) => setForceFailDemo(e.target.checked)}
                    className="demo-checkbox"
                  />
                  <span>Simulate Payment Failure (Demo Mode)</span>
                </label>
              </div>

              {/* Module 39 PWA Safety: Offline Warning & Disabled Action */}
              {!isOnline && (
                <div
                  role="alert"
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <WifiOff size={16} />
                  <span>You&apos;re offline. Please reconnect to place your order.</span>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="payment-action-block">
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={paymentStatus === 'processing' || !isOnline}
                  className={`btn btn-primary btn-block payment-main-submit-btn ${(!isOnline || paymentStatus === 'processing') ? 'btn-disabled' : ''}`}
                  style={!isOnline ? { opacity: 0.6, cursor: 'not-allowed' } : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <ButtonLoader size="sm" color="white" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>{isOnline ? `Pay ${formatPrice(finalTotal)}` : 'Offline — Reconnect to Pay'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary Breakdown */}
          <div className="payment-right-col">
            <div className="payment-card payment-summary-card">
              
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span className="summary-label">Items Subtotal</span>
                  <span className="summary-value">{formatPrice(totalAmount)}</span>
                </div>

                {totalMRP > totalAmount && (
                  <div className="summary-row">
                    <span className="summary-label">MRP Total</span>
                    <span className="summary-value mrp-crossed">{formatPrice(totalMRP)}</span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="summary-row summary-row-green">
                    <span className="summary-label">Product Discount</span>
                    <span className="summary-value">- {formatPrice(totalSavings)}</span>
                  </div>
                )}

                {appliedCoupon && (
                  <div className="summary-row summary-row-coupon">
                    <div className="coupon-label-wrap">
                      <Tag size={13} className="text-primary" />
                      <span>Coupon ({appliedCoupon.code})</span>
                    </div>
                    <span className="summary-value text-green">
                      {appliedCoupon.type === 'free_shipping'
                        ? 'Free Shipping'
                        : `- ${formatPrice(couponDiscount)}`}
                    </span>
                  </div>
                )}

                <div className="summary-row">
                  <span className="summary-label">Delivery Fee</span>
                  <span className="summary-value">
                    {deliveryFee === 0 ? (
                      <span className="free-delivery-tag">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-row summary-row-total">
                  <span className="total-label">To Pay</span>
                  <span className="total-value">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {(totalSavings > 0 || couponDiscount > 0) && (
                <div className="payment-savings-banner">
                  <Sparkles size={16} className="text-green flex-shrink-0" />
                  <span>
                    Saving <strong>{formatPrice(totalSavings + couponDiscount)}</strong> on this order
                  </span>
                </div>
              )}

              <div className="payment-security-box">
                <ShieldCheck size={18} className="text-primary flex-shrink-0" />
                <p>
                  Razorpay Mock Payment Gateway • 256-bit SSL Demo Encrypted
                </p>
              </div>

            </div>
          </div>

        </div>

      </Container>

      {/* ── 5. MOCK PAYMENT PROCESSING MODAL ───────────────────────────────────── */}
      {paymentStatus === 'processing' && (
        <div className="modal-backdrop static-backdrop">
          <div className="payment-modal-card animate-scale-in">
            <div className="razorpay-modal-top-bar">
              <div className="rzp-brand-wrap">
                <span className="rzp-brand-logo">Razorpay</span>
                <span className="rzp-mock-badge">Mock Mode</span>
              </div>
              <span className="rzp-pay-amount">{formatPrice(finalTotal)}</span>
            </div>

            <div className="modal-processing-body">
              <div className="processing-spinner-wrap">
                <div className="processing-spinner" />
              </div>
              <h3 className="processing-title">Processing Payment...</h3>
              <p className="processing-sub">
                Connecting securely to Razorpay Mock Gateway. Please do not refresh or close this page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. PAYMENT FAILURE MODAL ─────────────────────────────────────────── */}
      {paymentStatus === 'failed' && (
        <div className="modal-backdrop">
          <div className="payment-modal-card failure-modal animate-scale-in">
            <div className="modal-result-icon failure">
              <XCircle size={54} className="text-red" />
            </div>

            <h2 className="modal-result-title">Payment Failed</h2>
            <p className="modal-result-sub">
              Your payment could not be completed at this time.
            </p>

            <div className="failure-reason-box">
              <p className="reason-label">Reason:</p>
              <p className="reason-text">Simulated Bank / Payment Rejection (Demo Mode)</p>
            </div>

            <div className="modal-failure-actions">
              <button
                onClick={handleRetry}
                className="btn btn-primary btn-block retry-payment-btn"
              >
                <RefreshCw size={16} />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => navigate('/customer/checkout')}
                className="btn btn-outline btn-block back-checkout-btn"
              >
                Back to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentPage;
