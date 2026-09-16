// src/pages/customer/CheckoutPage.jsx
// MODULE 13 — Customer Checkout Page Implementation for Locvia

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Building,
  Check,
  CheckCircle2,
  ShoppingBag,
  Plus,
  AlertCircle,
  X,
  Store,
  Tag,
  ChevronRight,
  Lock,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import Container from '../../components/common/Container';
import { useCart } from '../../context/CartContext';
import { useAddress } from '../../context/AddressContext';
import { useDeliveryLocation } from '../../context/LocationContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { getShopByIdSync } from '../../services/shopService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

const ADDRESS_TYPES = [
  { label: 'Home', icon: Home },
  { label: 'Work', icon: Briefcase },
  { label: 'Other', icon: Building },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { isOnline } = useOnlineStatus();

  // Cart Context State & Pricing
  const {
    items,
    totalItems,
    totalAmount,
    totalMRP,
    totalSavings,
    appliedCoupon,
    removeCoupon
  } = useCart();

  // Address & Delivery Location Context
  const {
    addresses,
    defaultAddress,
    addAddress,
  } = useAddress();

  const {
    activeSavedAddress,
    selectSavedAddress,
  } = useDeliveryLocation();

  // Modal States
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addressErrorNotice, setAddressErrorNotice] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Add Address Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    type: 'Home',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState({});

  // Delivery fee logic matching Cart Page: ₹25 standard fee; Free on orders >= ₹500
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

  // Group cart items by shopId
  const itemsByShop = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const shopId = item.product?.shopId || 'default';
      if (!groups[shopId]) {
        groups[shopId] = {
          shop: getShopByIdSync(shopId) || {
            id: shopId,
            name: item.product?.shopName || 'Local Store',
            address: 'Local Market',
          },
          items: [],
        };
      }
      groups[shopId].items.push(item);
    });
    return Object.values(groups);
  }, [items]);

  // Active delivery address resolution priority:
  // 1. Explicitly selected saved address
  // 2. Default saved address
  // 3. First available saved address
  const activeAddress = useMemo(() => {
    if (activeSavedAddress) return activeSavedAddress;
    if (defaultAddress) return defaultAddress;
    if (addresses.length > 0) return addresses[0];
    return null;
  }, [activeSavedAddress, defaultAddress, addresses]);

  // Address Selection Handler
  const handleSelectAddress = (addr) => {
    selectSavedAddress(addr);
    setIsAddressModalOpen(false);
    setAddressErrorNotice('');
  };

  // Add Address Form Reset
  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      type: 'Home',
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsAddFormOpen(true);
  };

  // Add Address Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required.';
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      errs.phone = 'Phone number is required.';
    } else if (!/^[6-9]\d{9}$/.test(trimmedPhone) && !/^\d{10}$/.test(trimmedPhone)) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (!formData.addressLine1.trim()) errs.addressLine1 = 'Address Line 1 is required.';
    if (!formData.city.trim()) errs.city = 'City is required.';
    if (!formData.state.trim()) errs.state = 'State is required.';
    const trimmedPin = formData.pincode.trim();
    if (!trimmedPin) {
      errs.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(trimmedPin)) {
      errs.pincode = 'Enter a valid 6-digit pincode.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit New Address Handler
  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isAddingAddress) return;

    setIsAddingAddress(true);
    try {
      const newId = await addAddress(formData);
      const createdAddress = {
        id: newId,
        ...formData,
      };
      selectSavedAddress(createdAddress);
      setIsAddFormOpen(false);
      setIsAddressModalOpen(false);
      setAddressErrorNotice('');
    } finally {
      setIsAddingAddress(false);
    }
  };

  // Continue to Payment Action
  const handleContinueToPayment = () => {
    if (!isOnline) {
      setAddressErrorNotice("You're offline. Reconnect to internet to place your order.");
      return;
    }

    if (items.length === 0) {
      navigate('/customer/products');
      return;
    }

    if (!activeAddress) {
      setAddressErrorNotice('Please select a delivery address to continue.');
      setIsAddressModalOpen(true);
      return;
    }

    setIsNavigating(true);
    // Navigate to M14 Payment route
    navigate('/customer/payment');
  };

  // ── 1. EMPTY CART VIEW ───────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="checkout-page-wrapper animate-fade-in">
        <Container style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
          <div className="checkout-empty-card">
            <div className="checkout-empty-icon-wrap">
              <ShoppingBag size={52} strokeWidth={1.8} className="text-primary" />
            </div>
            <h2 className="checkout-empty-title">Your cart is empty</h2>
            <p className="checkout-empty-sub">
              Add some products to continue shopping and proceed to checkout.
            </p>
            <button
              onClick={() => navigate('/customer/products')}
              className="btn btn-primary btn-lg checkout-continue-shop-btn"
            >
              Continue Shopping
            </button>
          </div>
        </Container>
      </div>
    );
  }

  // ── 2. MAIN CHECKOUT VIEW ────────────────────────────────────────────────
  const TypeIcon =
    activeAddress?.type === 'Work'
      ? Briefcase
      : activeAddress?.type === 'Other'
      ? Building
      : Home;

  return (
    <div className="checkout-page-wrapper animate-fade-in">
      <Container style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>

        {/* Top Header & Breadcrumb */}
        <div className="checkout-header-bar">
          <button
            onClick={() => navigate('/customer/cart')}
            className="checkout-back-link-btn"
            aria-label="Back to Cart"
          >
            <ArrowLeft size={18} />
            <span>Back to Cart</span>
          </button>
          <div className="checkout-header-titles">
            <h1 className="checkout-page-title">Checkout</h1>
            <p className="checkout-page-subtitle">
              Review your delivery address and order items before payment.
            </p>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="checkout-main-grid">

          {/* LEFT COLUMN: Address + Order Items */}
          <div className="checkout-left-col">

            {/* Address Error Alert */}
            {addressErrorNotice && (
              <div className="checkout-alert-box checkout-alert-error">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{addressErrorNotice}</span>
              </div>
            )}

            {/* 1. DELIVERY ADDRESS CARD */}
            <div className="checkout-card checkout-address-card">
              <div className="checkout-card-header">
                <div className="checkout-card-title-wrap">
                  <MapPin size={20} className="text-primary" />
                  <h2>Delivery Address</h2>
                </div>

                {addresses.length > 0 && (
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="checkout-change-address-btn"
                  >
                    Change Address
                  </button>
                )}
              </div>

              {activeAddress ? (
                <div className="checkout-active-address-body">
                  <div className="address-badge-row">
                    <span className="checkout-type-pill">
                      <TypeIcon size={14} />
                      {activeAddress.type || 'Home'}
                    </span>
                    {activeAddress.isDefault && (
                      <span className="checkout-default-pill">
                        <CheckCircle2 size={12} /> Default
                      </span>
                    )}
                  </div>

                  <div className="address-person-details">
                    <h3 className="person-name">{activeAddress.fullName}</h3>
                    <p className="person-phone">+91 {activeAddress.phone}</p>
                  </div>

                  <div className="address-full-lines">
                    <p>{activeAddress.addressLine1}</p>
                    {activeAddress.addressLine2 && <p>{activeAddress.addressLine2}</p>}
                    {activeAddress.landmark && (
                      <p className="address-landmark-text">Landmark: {activeAddress.landmark}</p>
                    )}
                    <p className="address-city-state-pin">
                      <strong>{activeAddress.city}</strong>, {activeAddress.state} — {activeAddress.pincode}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="checkout-no-address-state">
                  <AlertCircle size={28} className="text-warning" />
                  <div>
                    <h3 className="no-address-title">No delivery address selected</h3>
                    <p className="no-address-sub">Please add a delivery address to proceed with your order.</p>
                  </div>
                  <button
                    onClick={handleOpenAddForm}
                    className="btn btn-primary add-addr-quick-btn"
                  >
                    <Plus size={16} /> Add Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* 2. ORDER ITEMS BY SHOP */}
            <div className="checkout-card checkout-items-card">
              <div className="checkout-card-header">
                <div className="checkout-card-title-wrap">
                  <ShoppingBag size={20} className="text-primary" />
                  <h2>Order Items ({totalItems})</h2>
                </div>
                <span className="items-count-badge">{itemsByShop.length} {itemsByShop.length === 1 ? 'Shop' : 'Shops'}</span>
              </div>

              <div className="checkout-shop-groups">
                {itemsByShop.map(({ shop, items: shopItems }) => (
                  <div key={shop.id || shop.name} className="checkout-shop-block">
                    
                    {/* Shop Header */}
                    <div className="checkout-shop-header">
                      <Store size={16} className="text-primary" />
                      <span className="checkout-shop-name">{shop.name || 'Local Store'}</span>
                      {shop.address && (
                        <span className="checkout-shop-addr">• {shop.address}</span>
                      )}
                    </div>

                    {/* Shop Products */}
                    <div className="checkout-items-list">
                      {shopItems.map((item) => {
                        const product = item.product;
                        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                        const itemTotal = product.price * item.quantity;

                        return (
                          <div key={product.id} className="checkout-item-row">
                            <div className="item-thumb-wrap">
                              <img
                                src={normalizeImageUrl(product.image || product.imageUrl, 'product')}
                                alt={product.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="item-thumb-img"
                                loading="lazy"
                              />
                            </div>

                            <div className="item-info-col">
                              <h4 className="item-title">{product.name}</h4>
                              <p className="item-shop-sub">By {shop.name || 'Local Store'}</p>
                              <div className="item-price-unit-row">
                                <span className="item-unit-price">{formatPrice(product.price)}</span>
                                <span className="item-qty-badge">× {item.quantity}</span>
                                {hasDiscount && (
                                  <span className="item-mrp-crossed">{formatPrice(product.originalPrice)}</span>
                                )}
                              </div>
                            </div>

                            <div className="item-total-col">
                              <span className="item-total-price">{formatPrice(itemTotal)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div className="checkout-right-col">
            <div className="checkout-card checkout-summary-card">
              
              <h2 className="summary-title">Order Summary</h2>

              {/* Pricing Breakdown */}
              <div className="summary-rows">
                
                <div className="summary-row">
                  <span className="summary-label">Item Subtotal</span>
                  <span className="summary-value">{formatPrice(totalAmount)}</span>
                </div>

                {totalMRP > totalAmount && (
                  <div className="summary-row">
                    <span className="summary-label">Item MRP Total</span>
                    <span className="summary-value mrp-crossed">{formatPrice(totalMRP)}</span>
                  </div>
                )}

                {totalSavings > 0 && (
                  <div className="summary-row summary-row-green">
                    <span className="summary-label">Product Discount</span>
                    <span className="summary-value">- {formatPrice(totalSavings)}</span>
                  </div>
                )}

                {/* Applied Coupon Info */}
                {appliedCoupon && (
                  <div className="summary-row summary-row-coupon">
                    <div className="coupon-label-wrap">
                      <Tag size={14} className="text-primary" />
                      <span>Coupon ({appliedCoupon.code})</span>
                      <button
                        onClick={removeCoupon}
                        className="coupon-remove-btn"
                        title="Remove coupon"
                      >
                        Remove
                      </button>
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

                {/* Final Payable Amount */}
                <div className="summary-row summary-row-total">
                  <span className="total-label">To Pay</span>
                  <span className="total-value">{formatPrice(finalTotal)}</span>
                </div>

              </div>

              {/* Total Savings Callout */}
              {(totalSavings > 0 || couponDiscount > 0) && (
                <div className="checkout-savings-banner">
                  <Sparkles size={16} className="text-green flex-shrink-0" />
                  <span>
                    You save <strong>{formatPrice(totalSavings + couponDiscount)}</strong> on this order!
                  </span>
                </div>
              )}

              {/* Offline Warning banner if offline */}
              {!isOnline && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    color: '#DC2626',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                  }}
                >
                  <WifiOff size={16} />
                  <span>You&apos;re offline. Reconnect to place order.</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                onClick={handleContinueToPayment}
                disabled={!activeAddress || !isOnline || isNavigating}
                className={`btn btn-primary btn-block checkout-pay-btn ${(!activeAddress || !isOnline || isNavigating) ? 'btn-disabled' : ''}`}
                style={!isOnline ? { opacity: 0.65, cursor: 'not-allowed' } : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isNavigating ? (
                  <>
                    <ButtonLoader size="sm" color="white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isOnline ? 'Continue to Payment' : 'Reconnect to Place Order'}</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              {!activeAddress && isOnline && (
                <p className="checkout-address-warning-text">
                  <AlertCircle size={13} /> Select or add a delivery address to proceed.
                </p>
              )}

              {/* Security Badge Footer */}
              <div className="checkout-security-footer">
                <Lock size={14} />
                <span>100% Safe & Secure Checkout</span>
              </div>

            </div>
          </div>

        </div>

      </Container>

      {/* ── ADDRESS SELECTOR MODAL ────────────────────────────────────────────── */}
      {isAddressModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddressModalOpen(false)}>
          <div className="checkout-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Delivery Address</h3>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="modal-close-btn"
                aria-label="Close address modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="checkout-modal-addresses-list">
              {addresses.map((addr) => {
                const isSelected = activeAddress?.id === addr.id;
                const AddrIcon = addr.type === 'Work' ? Briefcase : addr.type === 'Other' ? Building : Home;

                return (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`checkout-modal-address-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="addr-radio-col">
                      <div className={`custom-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="radio-dot" />}
                      </div>
                    </div>

                    <div className="addr-details-col">
                      <div className="addr-top-line">
                        <span className="addr-type-tag">
                          <AddrIcon size={13} /> {addr.type || 'Home'}
                        </span>
                        {isSelected && <span className="addr-selected-pill"><Check size={11} /> Selected</span>}
                        {!isSelected && addr.isDefault && <span className="addr-default-pill">Default</span>}
                      </div>

                      <strong className="addr-person-name">{addr.fullName}</strong>
                      <p className="addr-phone-text">+91 {addr.phone}</p>
                      <p className="addr-lines-text">
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p className="addr-city-line">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="checkout-modal-footer">
              <button onClick={handleOpenAddForm} className="btn btn-outline btn-block add-addr-modal-btn">
                <Plus size={16} /> Add New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ADDRESS MODAL ───────────────────────────────────────────────── */}
      {isAddFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddFormOpen(false)}>
          <div className="address-modal-container animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Address</h3>
              <button
                onClick={() => setIsAddFormOpen(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit} className="address-form" noValidate>
              
              <div className="form-group">
                <label className="form-label">Address Type</label>
                <div className="address-type-selector">
                  {ADDRESS_TYPES.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      className={`type-pill ${formData.type === label ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, type: label }))}
                    >
                      <Icon size={15} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">Full Name <span className="required-star">*</span></label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Yaswanth Chowdary"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className={`form-input ${formErrors.fullName ? 'has-error' : ''}`}
                  />
                  {formErrors.fullName && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">Phone Number <span className="required-star">*</span></label>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                      className={`form-input phone-field ${formErrors.phone ? 'has-error' : ''}`}
                    />
                  </div>
                  {formErrors.phone && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="addressLine1" className="form-label">Address Line 1 <span className="required-star">*</span></label>
                  <input
                    id="addressLine1"
                    type="text"
                    placeholder="House / Flat No., Building Name"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, addressLine1: e.target.value }))}
                    className={`form-input ${formErrors.addressLine1 ? 'has-error' : ''}`}
                  />
                  {formErrors.addressLine1 && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.addressLine1}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="addressLine2" className="form-label">Address Line 2 <span className="optional-tag">(Optional)</span></label>
                  <input
                    id="addressLine2"
                    type="text"
                    placeholder="Area, Colony, Sector"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData((prev) => ({ ...prev, addressLine2: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="landmark" className="form-label">Landmark <span className="optional-tag">(Optional)</span></label>
                  <input
                    id="landmark"
                    type="text"
                    placeholder="Near main road, park..."
                    value={formData.landmark}
                    onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode" className="form-label">Pincode <span className="required-star">*</span></label>
                  <input
                    id="pincode"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 560034"
                    value={formData.pincode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                    className={`form-input ${formErrors.pincode ? 'has-error' : ''}`}
                  />
                  {formErrors.pincode && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.pincode}</span>
                  )}
                </div>
              </div>

              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">City <span className="required-star">*</span></label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className={`form-input ${formErrors.city ? 'has-error' : ''}`}
                  />
                  {formErrors.city && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="form-label">State <span className="required-star">*</span></label>
                  <input
                    id="state"
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    className={`form-input ${formErrors.state ? 'has-error' : ''}`}
                  />
                  {formErrors.state && (
                    <span className="field-error-msg"><AlertCircle size={13} /> {formErrors.state}</span>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsAddFormOpen(false)} disabled={isAddingAddress} className="btn btn-outline">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isAddingAddress && <ButtonLoader size="sm" color="white" />}
                  <span>{isAddingAddress ? 'Saving...' : 'Save & Select Address'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CheckoutPage;
