// src/components/common/ImageLoader.jsx
// Smooth image loader adhering to the Locvia global image healing system
// loading -> placeholder -> success -> safe fallback (no broken image icons, no raw alt pop-in, no retry loops)

import { useState, useRef, useEffect } from 'react';
import {
  normalizeImageUrl,
  handleImageError,
  DEFAULT_PRODUCT_IMAGE,
  DEFAULT_SHOP_IMAGE,
} from '../../utils/imageUtils';
import SkeletonLoader from './loaders/SkeletonLoader';

const ImageLoader = ({
  src,
  alt = '',
  type = 'product', // 'product' | 'shop'
  className = '',
  style = {},
  aspectRatio,
  loading = 'lazy',
  onLoad,
  onError,
  ...rest
}) => {
  const normalizedSrc = normalizeImageUrl(src, type);
  const [status, setStatus] = useState('loading'); // 'loading' | 'loaded' | 'error'
  const [currentSrc, setCurrentSrc] = useState(normalizedSrc);
  const hasFailedRef = useRef(false);

  // Update src when prop changes
  useEffect(() => {
    hasFailedRef.current = false;
    const newNorm = normalizeImageUrl(src, type);
    setCurrentSrc(newNorm);
    setStatus('loading');
  }, [src, type]);

  const handleImgLoad = (e) => {
    setStatus('loaded');
    if (onLoad) onLoad(e);
  };

  const handleImgError = (e) => {
    if (hasFailedRef.current) return;
    hasFailedRef.current = true;
    setStatus('error');
    const fallback = type === 'shop' ? DEFAULT_SHOP_IMAGE : DEFAULT_PRODUCT_IMAGE;
    setCurrentSrc(fallback);
    handleImageError(e, type);
    if (onError) onError(e);
  };

  return (
    <div
      className={`locvia-image-loader-wrap ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        width: style.width || '100%',
        height: style.height || '100%',
        aspectRatio: aspectRatio || undefined,
        backgroundColor: '#f8fafc',
        borderRadius: style.borderRadius || undefined,
      }}
    >
      {/* Skeleton Shimmer shown while loading */}
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
          }}
        >
          <SkeletonLoader
            width="100%"
            height="100%"
            borderRadius={style.borderRadius || '0px'}
          />
        </div>
      )}

      {/* Actual Image with smooth fade-in */}
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        onLoad={handleImgLoad}
        onError={handleImgError}
        style={{
          ...style,
          width: '100%',
          height: '100%',
          objectFit: style.objectFit || (type === 'shop' ? 'cover' : 'contain'),
          opacity: status === 'loading' ? 0 : 1,
          transition: 'opacity 0.25s ease',
          display: 'block',
        }}
        {...rest}
      />
    </div>
  );
};

export default ImageLoader;
