import { useState, useEffect } from 'react';
import { Upload, X, RefreshCw, AlertTriangle, CheckCircle, Store } from 'lucide-react';
import { uploadImage } from '../../services/api/shopApi';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ShopImageUploader({
  existingImageUrl = '',
  shopId = null,
  onImageChange = () => {},
}) {
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl || '');
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (existingImageUrl) {
      setPreviewUrl(existingImageUrl);
    }
  }, [existingImageUrl]);

  const validateFile = (file) => {
    if (!file) return false;

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a valid shop banner image (JPG, JPEG, PNG, or WEBP).');
      setUploadState('error');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('Shop image size must be less than 5 MB.');
      setUploadState('error');
      return false;
    }

    setErrorMessage('');
    return true;
  };

  const handleFileSelect = async (file) => {
    if (!validateFile(file)) return;

    // Generate immediate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadState('uploading');
    setUploadProgress(40);

    try {
      const res = await uploadImage(file);
      const secureUrl = res?.secure_url || res?.url || res?.imageUrl;

      if (!secureUrl) {
        throw new Error('Shop image upload failed to return a secure URL.');
      }

      setUploadProgress(100);
      setUploadState('success');
      setPreviewUrl(secureUrl);

      onImageChange({
        file,
        previewUrl: secureUrl,
        imageUrl: secureUrl,
        image: secureUrl,
      });
    } catch (err) {
      console.error('Shop image upload failed:', err);
      setUploadState('error');
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to upload shop image. Please try again.');
    }
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
    setUploadState('idle');
    setErrorMessage('');
    onImageChange({
      file: null,
      previewUrl: '',
      imageUrl: '',
      image: '',
    });
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
        Shop Banner / Storefront Image
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
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px', height: '180px' }}>
              <img
                src={previewUrl}
                alt="Shop preview"
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
                  title="Image Uploaded to Cloudinary"
                >
                  <CheckCircle size={18} />
                </div>
              )}
            </div>

            {uploadState === 'uploading' ? (
              <div style={{ width: '100%', maxWidth: '240px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '4px' }}>
                  Uploading shop image to Cloudinary... {uploadProgress}%
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
                  <RefreshCw size={14} /> Replace Image
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
          <label style={{ cursor: 'pointer', display: 'block', padding: '1rem 0' }}>
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
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Upload Shop Storefront Image
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 10px 0' }}>
              Drag and drop your shop banner or click to browse
            </p>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#374151',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              Browse Image
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {/* Helper & Format Note */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
          Supports JPEG, PNG, WebP (Max 5 MB). Uploaded directly to Cloudinary.
        </span>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '6px',
            color: '#B91C1C',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
