// src/pages/customer/AddressPage.jsx
// MODULE 12 — Customer Address Management Page for Locvia

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Home,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  User,
  ArrowLeft,
  AlertCircle,
  Building,
  Check
} from 'lucide-react';
import { useAddress } from '../../context/AddressContext';
import EmptyState from '../../components/common/EmptyState';
import ButtonLoader from '../../components/common/loaders/ButtonLoader';

const ADDRESS_TYPES = [
  { label: 'Home', icon: Home },
  { label: 'Work', icon: Briefcase },
  { label: 'Other', icon: Building },
];

const AddressPage = () => {
  const navigate = useNavigate();
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddress();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form input states
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

  // Validation errors
  const [errors, setErrors] = useState({});

  // Reset form
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
      isDefault: false,
    });
    setErrors({});
    setEditingAddress(null);
    setIsSubmitting(false);
  };

  // Open modal to Add
  const handleOpenAdd = () => {
    resetForm();
    // If no addresses exist, default is set automatically
    if (addresses.length === 0) {
      setFormData((prev) => ({ ...prev, isDefault: true }));
    }
    setIsFormOpen(true);
  };

  // Open modal to Edit
  const handleOpenEdit = (addr) => {
    resetForm();
    setEditingAddress(addr);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      type: addr.type || 'Home',
      isDefault: !!addr.isDefault,
    });
    setIsFormOpen(true);
  };

  // Validation logic
  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit Indian phone number';
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Flat / House No. & Building is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
      } else {
        await addAddress(formData);
      }
      setIsFormOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (deletingId && !isDeleting) {
      setIsDeleting(true);
      try {
        await deleteAddress(deletingId);
        setDeletingId(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="address-page-wrapper">
      <div className="locvia-container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header Bar */}
        <div className="address-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              className="address-back-btn"
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="address-page-title">My Addresses</h1>
              <span className="address-count-tag">
                {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
              </span>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary add-address-btn"
          >
            <Plus size={18} />
            <span>Add New Address</span>
          </button>
        </div>

        {/* EMPTY STATE */}
        {addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Saved Addresses"
            description="Add an address to make checkout faster and deliver your groceries right to your doorstep."
            actionLabel="Add New Address"
            onAction={handleOpenAdd}
          />
        ) : (
          /* ADDRESS CARDS GRID */
          <div className="address-grid">
            {addresses.map((addr) => {
              const TypeIcon =
                addr.type === 'Work'
                  ? Briefcase
                  : addr.type === 'Other'
                  ? Building
                  : Home;

              return (
                <div
                  key={addr.id}
                  className={`address-card ${addr.isDefault ? 'is-default' : ''}`}
                >
                  {/* Top Bar: Type + Default Badge */}
                  <div className="address-card-top">
                    <div className="address-type-badge">
                      <TypeIcon size={14} />
                      <span>{addr.type || 'Home'}</span>
                    </div>

                    {addr.isDefault ? (
                      <span className="default-badge">
                        <CheckCircle2 size={13} />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => setDefaultAddress(addr.id)}
                        className="set-default-btn"
                        title="Set as default address"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  {/* Address Info */}
                  <div className="address-card-body">
                    <div className="address-name-row">
                      <User size={15} className="address-icon" />
                      <strong className="address-person-name">{addr.fullName}</strong>
                    </div>

                    <div className="address-phone-row">
                      <Phone size={14} className="address-icon" />
                      <span>+91 {addr.phone}</span>
                    </div>

                    <div className="address-lines">
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && (
                        <p className="address-landmark">Landmark: {addr.landmark}</p>
                      )}
                      <p className="address-location-line">
                        {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="address-card-actions">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="address-action-btn edit-btn"
                      aria-label={`Edit address for ${addr.fullName}`}
                    >
                      <Edit2 size={15} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingId(addr.id)}
                      className="address-action-btn delete-btn"
                      aria-label={`Delete address for ${addr.fullName}`}
                    >
                      <Trash2 size={15} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── ADD / EDIT ADDRESS MODAL ────────────────────────────────────── */}
      {isFormOpen && (
        <div className="modal-backdrop" onClick={() => setIsFormOpen(false)}>
          <div
            className="address-modal-container animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="modal-close-btn"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="address-form" noValidate>
              
              {/* Address Type Selector */}
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

              {/* Full Name & Phone */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Yaswanth Chowdary"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className={`form-input ${errors.fullName ? 'has-error' : ''}`}
                  />
                  {errors.fullName && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.fullName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="required-star">*</span>
                  </label>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value.replace(/\D/g, ''),
                        }))
                      }
                      className={`form-input phone-field ${errors.phone ? 'has-error' : ''}`}
                    />
                  </div>
                  {errors.phone && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Address Line 1 & Line 2 */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="addressLine1" className="form-label">
                    Address Line 1 <span className="required-star">*</span>
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    placeholder="House / Flat No., Building Name, Street"
                    value={formData.addressLine1}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, addressLine1: e.target.value }))
                    }
                    className={`form-input ${errors.addressLine1 ? 'has-error' : ''}`}
                  />
                  {errors.addressLine1 && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.addressLine1}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="addressLine2" className="form-label">
                    Address Line 2 <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    placeholder="Area, Colony, Sector"
                    value={formData.addressLine2}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, addressLine2: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>
              </div>

              {/* Landmark & Pincode */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="landmark" className="form-label">
                    Landmark <span className="optional-tag">(Optional)</span>
                  </label>
                  <input
                    id="landmark"
                    type="text"
                    placeholder="Near hospital, park, main road..."
                    value={formData.landmark}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, landmark: e.target.value }))
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode" className="form-label">
                    Pincode <span className="required-star">*</span>
                  </label>
                  <input
                    id="pincode"
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 523001"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pincode: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    className={`form-input ${errors.pincode ? 'has-error' : ''}`}
                  />
                  {errors.pincode && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.pincode}
                    </span>
                  )}
                </div>
              </div>

              {/* City & State */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">
                    City <span className="required-star">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Ongole"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className={`form-input ${errors.city ? 'has-error' : ''}`}
                  />
                  {errors.city && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.city}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="state" className="form-label">
                    State <span className="required-star">*</span>
                  </label>
                  <input
                    id="state"
                    type="text"
                    placeholder="e.g. Andhra Pradesh"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className={`form-input ${errors.state ? 'has-error' : ''}`}
                  />
                  {errors.state && (
                    <span className="field-error-msg">
                      <AlertCircle size={13} /> {errors.state}
                    </span>
                  )}
                </div>
              </div>

              {/* Set as Default Checkbox */}
              <div className="form-checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                    }
                  />
                  <span className="checkbox-custom">
                    <Check size={13} />
                  </span>
                  <span className="checkbox-label">Set as default delivery address</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSubmitting && <ButtonLoader size="sm" color="white" />}
                  <span>{isSubmitting ? (editingAddress ? 'Saving...' : 'Adding...') : (editingAddress ? 'Save Changes' : 'Save Address')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {deletingId && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeletingId(null)}>
          <div
            className="delete-confirm-modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <Trash2 size={24} style={{ color: 'var(--color-danger)' }} />
            </div>
            <h3>Delete this address?</h3>
            <p>This address will be removed from your saved locations list.</p>

            <div className="delete-modal-actions">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn btn-danger"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {isDeleting && <ButtonLoader size="sm" color="white" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddressPage;
