// src/utils/formatters.js
// Shared formatting utilities used across the app

// ── Currency ───────────────────────────────────────────────
export const formatPrice = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDiscount = (original, current) => {
  if (!original || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
};

// ── Date & Time ────────────────────────────────────────────
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ── Rating ─────────────────────────────────────────────────
export const formatRating = (rating) => {
  if (!rating) return '0.0';
  return Number(rating).toFixed(1);
};

// ── Distance ───────────────────────────────────────────────
export const formatDistance = (km) => {
  if (!km && km !== 0) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
};

// ── Phone ──────────────────────────────────────────────────
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// ── Order ID ───────────────────────────────────────────────
export const formatOrderId = (id) => {
  if (!id) return '';
  return `#${String(id).toUpperCase().slice(-8)}`;
};

// ── Truncate text ──────────────────────────────────────────
export const truncate = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};
