// src/components/shops/ShopCard.jsx
// Reusable premium shop card for discovery and home page lists

import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Bike } from 'lucide-react';
import { formatRating } from '../../utils/formatters';
import { normalizeImageUrl, handleImageError } from '../../utils/imageUtils';

/**
 * Props:
 *  shop - shop object from data/shops.js
 */
const ShopCard = ({ shop }) => {
  const {
    id,
    name,
    description,
    image,
    category,
    distance,
    rating,
    reviewCount,
    deliveryTime,
    deliveryFee,
    isOpen,
    tags,
  } = shop;

  return (
    <Link to={`/customer/shops/${id}`} className="lv-shop-card">
      {/* Shop Image Banner */}
      <div className="lv-shop-card-media">
        <img
          src={normalizeImageUrl(image, 'shop')}
          alt={name}
          onError={(e) => handleImageError(e, 'shop')}
          className="lv-shop-card-img"
          loading="lazy"
        />

        {/* Closed Overlay if not open */}
        {!isOpen && (
          <div className="lv-shop-closed-overlay">
            <span className="lv-shop-closed-pill">Closed Now</span>
          </div>
        )}

        {/* Category badge with glassmorphism over top-left */}
        {category && (
          <span className="lv-shop-category-badge">
            {category}
          </span>
        )}

        {/* Delivery-time badge over top-right if data supports it */}
        {deliveryTime && (
          <div className="lv-shop-delivery-badge">
            <Clock size={11} className="lv-shop-badge-clock" />
            <span>{deliveryTime}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="lv-shop-card-body">
        {/* Name + Rating Row */}
        <div className="lv-shop-header-row">
          <h3 className="lv-shop-name" title={name}>
            {name}
          </h3>

          {rating && (
            <div className="lv-shop-rating-pill" aria-label={`Rating: ${rating} out of 5`}>
              <Star size={11} fill="#eab308" className="lv-star-icon" />
              <span className="lv-rating-val">{formatRating(rating)}</span>
              {reviewCount && (
                <span className="lv-review-count">({reviewCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Description clamped cleanly to 2 lines with consistent min-height */}
        <p className="lv-shop-desc">
          {description}
        </p>

        {/* Metadata row with small green icons */}
        <div className="lv-shop-meta-row">
          <div className="lv-shop-meta-item">
            <Clock size={12} className="lv-shop-meta-icon" />
            <span>{deliveryTime || '20–30 min'}</span>
          </div>
          <span className="lv-shop-meta-dot">•</span>
          <div className="lv-shop-meta-item">
            <MapPin size={12} className="lv-shop-meta-icon" />
            <span>{typeof distance === 'number' ? `${distance} km` : distance}</span>
          </div>
          <span className="lv-shop-meta-dot">•</span>
          <div className="lv-shop-meta-item">
            <Bike size={12} className="lv-shop-meta-icon" />
            <span>
              {deliveryFee === 0 ? (
                <span className="lv-shop-free-fee">Free</span>
              ) : (
                `₹${deliveryFee}`
              )}
            </span>
          </div>
        </div>

        {/* Feature Tags */}
        {tags?.length > 0 && (
          <div className="lv-shop-tags-row">
            {tags.map((tag) => (
              <span key={tag} className="lv-shop-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ShopCard;
