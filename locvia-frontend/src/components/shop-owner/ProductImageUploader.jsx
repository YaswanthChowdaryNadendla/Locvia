// src/components/shop-owner/ProductImageUploader.jsx
// Reusable Cloudinary-ready Product Image Uploader component for Module 21

import { useState, useEffect } from 'react';
import { Upload, X, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ProductImageUploader({
  existingImageUrl = '',
  existingPublicId = '',
  shopId = 'SHOP_001',
  productId = null,
  onImageChange = () => {},
}) {
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl || '');
  const [publicId, setPublicId] = useState(existingPublicId || '');
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    }
    if (existingPublicId) {
      setPublicId(existingPublicId);
    }
  }, [existingImageUrl, existingPublicId]);

  const validateFile = (file) => {
    if (!file) return false;

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a valid product image (JPG, JPEG, PNG, or WEBP).');
      setUploadState('error');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('Image size must be less than 5 MB.');
      setUploadState('error');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadState('uploading');
    setUploadProgress(20);

    // Simulate Cloudinary-ready async upload pipeline
    const timer1 = setTimeout(() => setUploadProgress(60), 200);
    const timer2 = setTimeout(() => {
      setUploadProgress(100);
      setUploadState('success');

      const generatedPublicId = publicId || `locvia/products/${shopId}/${productId || Date.now()}`;
      setPublicId(generatedPublicId);

      // Notify parent component with file & preview info
      onImageChange({
        file,
        previewUrl: objectUrl,
        imageUrl: objectUrl,
        imagePublicId: generatedPublicId,
      });
    }, 450);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    setPublicId('');
    setUploadState('idle');
    setErrorMessage('');
    onImageChange({
      file: null,
      previewUrl: '',
      imageUrl: '',
      imagePublicId: '',
    });
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
        Product Image *
      </label>

      {/* Main Upload / Preview Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragOver ? '2px dashed var(--color-primary)' : '2px dashed #D1D5DB',
          borderRadius: '12px',
          padding: '1.25rem',
          backgroundColor: isDragOver ? 'var(--color-primary-light, #E6F4EA)' : '#F9FAFB',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {previewUrl ? (
          /* Preview Active State */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <img
                src={previewUrl}
                alt="Product preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              />
              {uploadState === 'success' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    borderRadius: '50%',
                    padding: '2px',
                  }}
                  title="Image Ready"
                >
                  <CheckCircle size={18} />
                </div>
              )}
            </div>

            {uploadState === 'uploading' ? (
              <div style={{ width: '100%', maxWidth: '200px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                  Uploading image... {uploadProgress}%
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: 'var(--color-primary)',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} /> Replace
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEE2E2',
                    color: '#DC2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty / Idle State */
          <label style={{ cursor: 'pointer', display: 'block', padding: '0.75rem 0' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light, #E6F4EA)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto',
              }}
            >
              <Upload size={22} />
            </div>

            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              Click to upload or drag & drop product image
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>
              JPG, JPEG, PNG, WEBP • Max file size: 5 MB
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Error Feedback */}
      {uploadState === 'error' && errorMessage && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '6px',
            color: '#DC2626',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <AlertTriangle size={14} /> {errorMessage}
        </div>
      )}
    </div>
  );
}
