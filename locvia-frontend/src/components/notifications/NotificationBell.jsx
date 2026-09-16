// src/components/notifications/NotificationBell.jsx
// Module 38 — Notification Bell & Dropdown Panel
// Features unread badge, sound ON/OFF toggle, mark-all-as-read, and per-role navigation.

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Volume2,
  VolumeX,
  CheckCheck,
  ShoppingBag,
  Truck,
  ChevronRight,
  Clock,
  Store,
} from 'lucide-react';
import { formatRelativeTime } from '../../services/notificationService';

export default function NotificationBell({
  notifications = [],
  unreadCount = 0,
  isSoundOn = true,
  onToggleSound,
  onMarkAsRead,
  onMarkAllAsRead,
  role = 'SHOP_OWNER',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleNotificationClick = (n) => {
    if (onMarkAsRead) onMarkAsRead(n.id);
    setIsOpen(false);

    if (n.type === 'NEW_ORDER') {
      navigate(`/shop-owner/orders/${n.orderId}`);
    } else if (n.type === 'DELIVERY_ASSIGNED') {
      navigate('/delivery/active');
    }
  };

  const emptyText =
    role === 'DELIVERY_PARTNER'
      ? 'No delivery assignments yet.'
      : 'No new orders yet.';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Bell Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        title="Notifications"
        style={{
          position: 'relative',
          background: isOpen ? '#F3F4F6' : 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: unreadCount > 0 ? 'var(--color-primary, #0C831F)' : '#4B5563',
          transition: 'all 0.15s ease',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary, #0C831F)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
      >
        <Bell size={20} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Dropdown Panel ── */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notification Center"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 24px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInDown 0.18s ease-out',
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#111827' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--color-primary-lighter, #DCFCE7)',
                    color: 'var(--color-primary, #0C831F)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Header Actions: Sound Toggle & Mark All Read */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Sound Toggle */}
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  title={isSoundOn ? 'Sound is ON. Click to mute' : 'Sound is MUTED. Click to enable'}
                  aria-label={isSoundOn ? 'Mute notification sound' : 'Enable notification sound'}
                  style={{
                    background: isSoundOn ? '#F0FDF4' : '#F3F4F6',
                    border: `1px solid ${isSoundOn ? '#BBF7D0' : '#E5E7EB'}`,
                    color: isSoundOn ? 'var(--color-primary, #0C831F)' : '#6B7280',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  <span className="hide-mobile">{isSoundOn ? 'Sound On' : 'Sound Off'}</span>
                </button>
              )}

              {/* Mark All Read */}
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                  aria-label="Mark all notifications as read"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '6px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.color = 'var(--color-primary, #0C831F)'; }}
                  onBlur={(e) => { e.currentTarget.style.color = '#6B7280'; }}
                >
                  <CheckCheck size={14} />
                  <span>Read all</span>
                </button>
              )}
            </div>
          </div>

          {/* Notification List Scroll Area */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                }}
              >
                <Bell size={32} strokeWidth={1.5} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>
                  {emptyText}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                  Real-time alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read;
                const isOrder = n.type === 'NEW_ORDER';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(n);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F9FAFB',
                      backgroundColor: isUnread ? '#F0FDF4' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#DCFCE7' : '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#F0FDF4' : '#FFFFFF';
                    }}
                  >
                    {/* Event Type Icon */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        backgroundColor: isOrder ? '#E0F2FE' : '#FEF3C7',
                        color: isOrder ? '#0284C7' : '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isOrder ? <ShoppingBag size={17} /> : <Truck size={17} />}
                    </div>

                    {/* Content Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isUnread ? 700 : 600,
                            color: isUnread ? '#111827' : '#4B5563',
                          }}
                        >
                          {n.title}
                        </span>
                        {isUnread && (
                          <span
                            aria-label="Unread"
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary, #0C831F)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      {/* Order ID & Price / Address */}
                      <p
                        style={{
                          margin: '3px 0 6px',
                          fontSize: '12px',
                          color: '#374151',
                          fontWeight: isUnread ? 500 : 400,
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {n.message}
                      </p>

                      {/* Shop or Pickup/Delivery context line */}
                      {isOrder && n.shopName && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: '#6B7280',
                            marginBottom: '4px',
                          }}
                        >
                          <Store size={11} />
                          <span>{n.shopName}</span>
                        </div>
                      )}

                      {/* Timestamp & Action hint */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: '#9CA3AF',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} />
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        <span
                          style={{
                            color: 'var(--color-primary, #0C831F)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}
                        >
                          {isOrder ? 'View Order' : 'View Delivery'}
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
