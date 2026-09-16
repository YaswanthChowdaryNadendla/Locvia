// src/components/products/ProductCard.jsx
// Reusable product card for grids and lists

import { Star, Plus, Minus, Store } from 'lucide-react';
import { formatPrice, formatRating } from '../../utils/formatters';
import { getShopByIdSync } from '../../services/shopService';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

/**
 * Props:
 *  product       - product object
 *  quantity      - number (optional override for current qty in cart)
 *  onAdd         - function(product) (optional override)
 *  onIncrement   - function(productId) (optional override)
 *  onDecrement   - function(productId) (optional override)
 */

const ProductCard = ({
  product,
  quantity: propQuantity,
  onAdd: propOnAdd,
  onIncrement: propOnIncrement,
  onDecrement: propOnDecrement,
}) => {
  const navigate = useNavigate();
  
  // Safely attempt to use cart context
  const cart = useCart();

  if (!product) return null;

  const {
    id,
    name,
    price,
    originalPrice,
    discount,
    unit,
    image,
    rating,
    reviewCount,
    isAvailable = true,
    shopId,
  } = product;

  // Determine current quantity in cart
  const quantity = propQuantity !== undefined 
    ? propQuantity 
    : (cart ? cart.getItemQuantity(id) : 0);

  const shop = getShopByIdSync(shopId);
  const shopName = shop ? shop.name : 'Local Store';

  const handleCardClick = (e) => {
    // If user clicked inside shop link or button stepper, do not navigate to product
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/customer/product/${id}`);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (propOnAdd) {
      propOnAdd(product);
    } else if (cart) {
      cart.addItem(product, 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (propOnIncrement) {
      propOnIncrement(id);
    } else if (cart) {
      cart.updateQuantity(id, quantity + 1);
    }
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    if (propOnDecrement) {
      propOnDecrement(id);
    } else if (cart) {
      cart.updateQuantity(id, quantity - 1);
    }
  };

  return (
    <div
      className="lv-product-card"
      onClick={handleCardClick}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
    >
      {/* Product Image Box */}
      <div className="lv-product-card-media">
        <img
          src={normalizeImageUrl(image, 'product')}
          alt={name}
          onError={(e) => handleImageError(e, 'product')}
          className="lv-product-img"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="lv-product-discount-badge">
            {discount}% OFF
          </span>
        )}

        {/* Out of stock overlay */}
        {!isAvailable && (
          <div className="lv-product-stock-overlay">
            <span className="lv-product-stock-pill">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="lv-product-body">
        {/* Quantity / Unit */}
        {unit && (
          <span className="lv-product-unit">
            {unit}
          </span>
        )}

        {/* Product Name */}
        <h3 className="lv-product-name" title={name}>
          {name}
        </h3>

        {/* Shop Name Tag */}
        {shopName && (
          <div className="lv-product-shop" title={shopName}>
            <Store size={12} className="shrink-0" />
            <span className="truncate">{shopName}</span>
          </div>
        )}

        {/* Rating */}
        {rating ? (
          <div className="lv-product-rating-row">
            <span className="lv-product-rating-pill" aria-label={`Rating: ${rating} out of 5`}>
              <Star size={10} fill="#f59e0b" color="#f59e0b" className="shrink-0" />
              <span>{formatRating(rating)}</span>
            </span>
            {reviewCount && (
              <span className="lv-product-review-count">({reviewCount})</span>
            )}
          </div>
        ) : null}

        {/* Price & Add Action Row */}
        <div className="lv-product-footer">
          {/* Price */}
          <div className="lv-product-price-box">
            <span className="lv-product-price">
              {formatPrice(price)}
            </span>
            {originalPrice > price && (
              <span className="lv-product-original-price">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Add Button / Stepper */}
          {isAvailable ? (
            <div>
              {quantity === 0 ? (
                <button
                  onClick={handleAdd}
                  className="lv-product-add-btn"
                  aria-label={`Add ${name} to cart`}
                >
                  <Plus size={14} /> ADD
                </button>
              ) : (
                <div className="lv-product-stepper">
                  <button
                    onClick={handleDecrement}
                    className="lv-product-stepper-btn"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="lv-product-stepper-val">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="lv-product-stepper-btn"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              disabled
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            >
              Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

