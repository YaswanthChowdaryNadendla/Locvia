// src/pages/customer/CartPage.jsx
// MODULE 11 — Cart Page Implementation for Locvia

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  Store,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  Ticket
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getShopByIdSync } from '../../services/shopService';
import { formatPrice } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

const CartPage = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
    totalMRP,
    totalSavings,
    appliedCoupon,
    applyCouponCode,
    removeCoupon
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Delivery fee logic: ₹25 standard delivery fee; Free on orders >= ₹500
  const FREE_DELIVERY_THRESHOLD = 500;
  const STANDARD_DELIVERY_FEE = 25;

  const deliveryFee = useMemo(() => {
    if (items.length === 0) return 0;
    if (appliedCoupon?.type === 'free_shipping') return 0;
    return totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  }, [items.length, totalAmount, appliedCoupon]);

  const amountNeededForFreeDelivery = useMemo(() => {
    if (appliedCoupon?.type === 'free_shipping') return 0;
    return Math.max(0, FREE_DELIVERY_THRESHOLD - totalAmount);
  }, [totalAmount, appliedCoupon]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'fixed') {
      return appliedCoupon.discountAmount;
    }
    if (appliedCoupon.type === 'percentage') {
      const discount = (totalAmount * appliedCoupon.discountPercentage) / 100;
      return Math.min(discount, appliedCoupon.maxDiscountAmount);
    }
    return 0; // free_shipping implies ₹0 discount applied to subtotal (waives delivery instead)
  }, [appliedCoupon, totalAmount]);

  const finalTotal = useMemo(() => {
    if (items.length === 0) return 0;
    const total = totalAmount - couponDiscount + deliveryFee;
    return Math.max(0, total);
  }, [items.length, totalAmount, deliveryFee, couponDiscount]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const result = applyCouponCode(couponInput);
    if (!result.success) {
      setCouponError(result.message);
    } else {
      setCouponInput('');
    }
  };

  // Group cart items by shopId
  const itemsByShop = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const shopId = item.product.shopId || 'default';
      if (!groups[shopId]) {
        groups[shopId] = {
          shop: getShopByIdSync(shopId),
          items: [],
        };
      }
      groups[shopId].items.push(item);
    });
    return Object.values(groups);
  }, [items]);

  // ── EMPTY CART STATE ──────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="locvia-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          <div className="empty-cart-card">
            <div className="empty-cart-icon-bg">
              <ShoppingBag size={54} strokeWidth={1.8} style={{ color: 'var(--color-primary)' }} />
            </div>
            
            <h1 className="empty-cart-title">Your Cart is Empty</h1>
            <p className="empty-cart-subtitle">
              Looks like you haven't added anything to your cart yet. Explore nearby local shops and stock up on daily essentials!
            </p>

            <div className="empty-cart-actions">
              <Link to="/customer/products" className="btn btn-primary btn-lg start-shopping-btn">
                <ShoppingBag size={18} />
                Start Shopping
              </Link>
              <Link to="/customer/shops" className="btn btn-outline btn-lg explore-shops-btn">
                <Store size={18} />
                Browse Shops
              </Link>
            </div>

            {/* Quick Suggestions / Features */}
            <div className="empty-cart-features">
              <div className="feature-pill">
                <Clock size={16} className="feature-icon" />
                <span>15 Min Express Delivery</span>
              </div>
              <div className="feature-pill">
                <Store size={16} className="feature-icon" />
                <span>Direct from Local Retailers</span>
              </div>
              <div className="feature-pill">
                <ShieldCheck size={16} className="feature-icon" />
                <span>Best Prices & Fresh Quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CART MAIN UI ─────────────────────────────────────────────────────────
  return (
    <div className="cart-page-wrapper">
      <div className="locvia-container" style={{ paddingTop: '1.5rem', paddingBottom: '5rem' }}>
        
        {/* Header navigation bar */}
        <div className="cart-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              className="cart-back-btn"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="cart-page-title">Your Cart</h1>
              <span className="cart-item-count-tag">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          <button
            onClick={clearCart}
            className="cart-clear-all-btn"
            title="Clear all items in cart"
          >
            <Trash2 size={15} />
            Clear Cart
          </button>
        </div>

        {/* Free Delivery Incentive Progress Bar */}
        {totalAmount < FREE_DELIVERY_THRESHOLD ? (
          <div className="free-delivery-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
                Add <strong>{formatPrice(amountNeededForFreeDelivery)}</strong> more to get <strong>FREE Delivery!</strong>
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (totalAmount / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="free-delivery-unlocked-banner">
            <CheckCircle2 size={18} style={{ color: '#166534', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
              Congratulations! You unlocked FREE Delivery on this order.
            </span>
          </div>
        )}

        {/* Main Grid: Left Items List, Right Summary */}
        <div className="cart-layout-grid">

          {/* LEFT COLUMN: Cart Items Grouped by Shop */}
          <div className="cart-items-column">
            {itemsByShop.map((group) => {
              const shop = group.shop;
              return (
                <div key={shop ? shop.id : 'unknown'} className="cart-shop-group-card">
                  
                  {/* Shop Header */}
                  <div className="cart-shop-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="cart-shop-icon-badge">
                        <Store size={18} style={{ color: 'var(--color-primary-dark)' }} />
                      </div>
                      <div>
                        <Link
                          to={shop ? `/customer/shops/${shop.id}` : '#'}
                          className="cart-shop-title-link"
                        >
                          {shop ? shop.name : 'Local Shop'}
                        </Link>
                        {shop && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              📍 {shop.address || 'Ongole'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                              ⚡ {shop.deliveryTimeMinutes || 15} mins delivery
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items List in Shop */}
                  <div className="cart-shop-items-list">
                    {group.items.map(({ product, quantity }) => {
                      const stock = product.stock !== undefined
                        ? product.stock
                        : (product.isAvailable ? 50 : 0);
                      const isMaxStockReached = quantity >= stock;
                      const hasDiscount = (product.originalPrice || product.mrp) > product.price;
                      const displayOriginalPrice = product.originalPrice || product.mrp;

                      return (
                        <div key={product.id} className="cart-item-row">
                          {/* Image */}
                          <div className="cart-item-image-box">
                            <img
                              src={normalizeImageUrl(product.image, 'product')}
                              alt={product.name}
                              onError={(e) => handleImageError(e, 'product')}
                              className="cart-item-img"
                              loading="lazy"
                            />
                            {product.discount > 0 && (
                              <span className="cart-item-discount-badge">
                                {product.discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="cart-item-info">
                            <Link
                              to={`/customer/product/${product.id}`}
                              className="cart-item-name-link"
                            >
                              {product.name}
                            </Link>

                            <div className="cart-item-meta">
                              {product.unit && <span className="cart-item-unit">{product.unit}</span>}
                              {product.category && (
                                <span className="cart-item-category-tag">{product.category}</span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="cart-item-price-row">
                              <span className="cart-item-price">
                                {formatPrice(product.price)}
                              </span>
                              {hasDiscount && (
                                <span className="cart-item-mrp">
                                  {formatPrice(displayOriginalPrice)}
                                </span>
                              )}
                              <span className="cart-item-subtotal-hint">
                                Total: {formatPrice(product.price * quantity)}
                              </span>
                            </div>

                            {/* Stock warning */}
                            {isMaxStockReached && stock > 0 && (
                              <span className="cart-stock-warning">
                                Max stock limit ({stock}) reached
                              </span>
                            )}
                          </div>

                          {/* Controls (Stepper + Remove) */}
                          <div className="cart-item-actions">
                            <div className="cart-stepper">
                              <button
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="cart-stepper-btn"
                                aria-label="Decrease quantity"
                                title="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              
                              <span className="cart-stepper-qty">{quantity}</span>
                              
                              <button
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className={`cart-stepper-btn ${isMaxStockReached ? 'disabled' : ''}`}
                                disabled={isMaxStockReached}
                                aria-label="Increase quantity"
                                title={isMaxStockReached ? 'Maximum stock limit reached' : 'Increase quantity'}
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(product.id)}
                              className="cart-remove-btn"
                              aria-label={`Remove ${product.name} from cart`}
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                              <span className="cart-remove-text">Remove</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Order Summary Card */}
          <div className="cart-summary-column">
            <div className="order-summary-card">
              
              <h2 className="summary-title">Order Summary</h2>

              {/* Coupon Section */}
              <div className="coupon-section">
                {appliedCoupon ? (
                  <div className="applied-coupon-box">
                    <div className="applied-coupon-info">
                      <CheckCircle2 size={18} className="text-green" />
                      <div>
                        <div className="applied-coupon-code">{appliedCoupon.code}</div>
                        <div className="applied-coupon-desc">{appliedCoupon.description} applied</div>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="remove-coupon-btn"
                      aria-label="Remove coupon"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="coupon-form">
                    <div className="coupon-input-wrapper">
                      <Ticket size={18} className="coupon-input-icon" />
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="coupon-input"
                      />
                      <button type="submit" className="apply-coupon-btn" disabled={!couponInput.trim()}>
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <div className="coupon-error-message">
                        <AlertCircle size={14} />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </form>
                )}
              </div>

              <div className="summary-divider" style={{ margin: '16px 0' }} />

              <div className="summary-rows-group">
                
                {/* Subtotal */}
                <div className="summary-row">
                  <span className="summary-row-label">Item Subtotal</span>
                  <span className="summary-row-val">{formatPrice(totalAmount)}</span>
                </div>

                {/* MRP Total & Savings */}
                {totalSavings > 0 && (
                  <>
                    <div className="summary-row">
                      <span className="summary-row-label">Item MRP Total</span>
                      <span className="summary-row-val line-through">{formatPrice(totalMRP)}</span>
                    </div>

                    <div className="summary-row discount-row">
                      <span className="summary-row-label">
                        <Tag size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                        Product Discount
                      </span>
                      <span className="summary-row-val text-green">
                        -{formatPrice(totalSavings)}
                      </span>
                    </div>
                  </>
                )}

                {/* Coupon Discount */}
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="summary-row-label">
                      <Ticket size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                      Coupon Discount ({appliedCoupon.code})
                    </span>
                    <span className="summary-row-val text-green">
                      -{formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}

                {/* Delivery Fee */}
                <div className="summary-row">
                  <span className="summary-row-label">
                    Delivery Fee
                    {deliveryFee === 0 && (
                      <span className="free-badge">FREE</span>
                    )}
                  </span>
                  <span className="summary-row-val">
                    {deliveryFee === 0 ? (
                      <span className="text-green font-bold">FREE</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>

              </div>

              {/* Savings Highlight Box */}
              {totalSavings > 0 && (
                <div className="savings-highlight-box">
                  <Sparkles size={16} className="savings-sparkle-icon" />
                  <span>
                    You save <strong>{formatPrice(totalSavings)}</strong> on MRP for this order!
                  </span>
                </div>
              )}

              <div className="summary-divider" />

              {/* Grand Total */}
              <div className="summary-total-row">
                <div>
                  <span className="total-label">To Pay</span>
                  <span className="total-tax-hint">Inclusive of all taxes</span>
                </div>
                <span className="total-val">{formatPrice(finalTotal)}</span>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={() => {
                  setIsNavigating(true);
                  navigate('/customer/checkout');
                }}
                disabled={isNavigating}
                className="btn btn-primary btn-block checkout-proceed-btn"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isNavigating ? (
                  <>
                    <ButtonLoader size="sm" color="white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Checkout</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="summary-trust-badges">
                <div className="trust-badge-item">
                  <Clock size={16} className="trust-icon" />
                  <div>
                    <strong>Fast Delivery</strong>
                    <p>Delivered to your doorstep in mins</p>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <ShieldCheck size={16} className="trust-icon" />
                  <div>
                    <strong>Secure Checkout</strong>
                    <p>Safety & privacy guaranteed</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
