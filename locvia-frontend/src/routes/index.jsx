// src/routes/index.jsx
// Central route configuration — ALL routes defined here.
// Add new routes here as modules are implemented.

import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import CustomerLayout from '../layouts/CustomerLayout';
import ShopOwnerLayout from '../layouts/ShopOwnerLayout';
import DeliveryPartnerLayout from '../layouts/DeliveryPartnerLayout';
import AdminLayout from '../layouts/AdminLayout';

import PageLoader from '../components/common/loaders/PageLoader';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '../pages/HomePage';
import CustomerHomePage from '../pages/customer/CustomerHomePage';
import ShopDiscoveryPage from '../pages/customer/ShopDiscoveryPage';
import ShopDetailsPage from '../pages/customer/ShopDetailsPage';
import ProductsPage from '../pages/customer/ProductsPage';
import ProductDetailsPage from '../pages/customer/ProductDetailsPage';
import CartPage from '../pages/customer/CartPage';
import AddressPage from '../pages/customer/AddressPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import PaymentPage from '../pages/customer/PaymentPage';
import OrderConfirmationPage from '../pages/customer/OrderConfirmationPage';
import CustomerOrdersPage from '../pages/customer/CustomerOrdersPage';
import OrderDetailsPage from '../pages/customer/OrderDetailsPage';
import OrderTrackingPage from '../pages/customer/OrderTrackingPage';
import CustomerProfilePage from '../pages/customer/CustomerProfilePage';
import LoginPage from '../pages/auth/LoginPage';

import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordFlow';
import PlaceholderPage from '../pages/PlaceholderPage';
import { ROLES } from '../data/users';
import { useAuth } from '../context/AuthContext';

// Shop Owner Module 19 Imports
// ShopOwnerLogin removed — /shop/login now redirects to /login (unified entry point)
import ShopOwnerRegister from '../modules/shop-owner/auth/ShopOwnerRegister';
import ShopOwnerProtectedRoute from '../modules/shop-owner/auth/ShopOwnerProtectedRoute';
import ShopDashboard from '../modules/shop-owner/dashboard/ShopDashboard';
import { ShopOwnerAuthProvider } from '../modules/shop-owner/auth/ShopOwnerAuthContext';
import ShopOwnerProductsPage from '../pages/shop-owner/ShopOwnerProductsPage';
import ShopOwnerInventoryPage from '../pages/shop-owner/ShopOwnerInventoryPage';
import ShopOwnerOrdersPage from '../pages/shop-owner/ShopOwnerOrdersPage';
import ShopOwnerOrderDetailsPage from '../pages/shop-owner/ShopOwnerOrderDetailsPage';
import ShopOwnerShopProfilePage from '../pages/shop-owner/ShopOwnerShopProfilePage';
import ShopOwnerProfilePage from '../pages/shop-owner/ShopOwnerProfilePage';

// Delivery Partner Module 24, 25, 26, 27 & 28 Imports
import DeliveryDashboardPage from '../pages/delivery/DeliveryDashboardPage';
import DeliveryProfilePage from '../pages/delivery/DeliveryProfilePage';
import DeliveryRequestsPage from '../pages/delivery/DeliveryRequestsPage';
import DeliveryExecutionPage from '../pages/delivery/DeliveryExecutionPage';
import DeliveryEarningsPage from '../pages/delivery/DeliveryEarningsPage';

// Admin Module 30, 31, 32, 33, 34 & 36 Imports
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminShopsPage from '../pages/admin/AdminShopsPage';
import AdminProductsPage from '../pages/admin/AdminProductsPage';
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from '../pages/admin/AdminOrderDetailsPage';
import AdminDeliveryPage from '../pages/admin/AdminDeliveryPage';
import AdminDeliveryDetailsPage from '../pages/admin/AdminDeliveryDetailsPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';

// Module 36 — Shop Owner Reviews
import ShopOwnerReviewsPage from '../pages/shop-owner/ShopOwnerReviewsPage';

// Footer & Informational Pages
import AboutPage from '../pages/info/AboutPage';
import CareersPage from '../pages/info/CareersPage';
import BlogPage from '../pages/info/BlogPage';
import ContactPage from '../pages/info/ContactPage';
import HelpCenterPage from '../pages/info/HelpCenterPage';
import TrackOrderPage from '../pages/info/TrackOrderPage';
import RefundPolicyPage from '../pages/info/RefundPolicyPage';
import DeliveryInfoPage from '../pages/info/DeliveryInfoPage';
import JoinCustomerPage from '../pages/info/JoinCustomerPage';
import JoinShopOwnerPage from '../pages/info/JoinShopOwnerPage';
import JoinDeliveryPartnerPage from '../pages/info/JoinDeliveryPartnerPage';
import PrivacyPolicyPage from '../pages/info/PrivacyPolicyPage';
import TermsPage from '../pages/info/TermsPage';
import CookiePolicyPage from '../pages/info/CookiePolicyPage';


// ── Lazy-loaded pages (add as modules are built) ─────────────
// const HomePage        = lazy(() => import('../pages/HomePage'));
// const LoginPage       = lazy(() => import('../pages/auth/LoginPage'));
// const RegisterPage    = lazy(() => import('../pages/auth/RegisterPage'));
// const CustomerHome    = lazy(() => import('../pages/customer/CustomerHome'));



// ── Route Definitions ─────────────────────────────────────────
const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public Routes ───────────────────── */}
        <Route
          path="/"
          element={
            user?.role === ROLES.SHOP_OWNER ? (
              <Navigate to="/shop-owner/dashboard" replace />
            ) : user?.role === ROLES.DELIVERY_PARTNER ? (
              <Navigate to="/delivery/dashboard" replace />
            ) : user?.role === ROLES.ADMIN ? (
              <Navigate to="/admin/users" replace />
            ) : (
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated
              ? (
                user?.role === ROLES.SHOP_OWNER
                  ? <Navigate to="/shop-owner/dashboard" replace />
                  : user?.role === ROLES.DELIVERY_PARTNER
                  ? <Navigate to="/delivery/dashboard" replace />
                  : user?.role === ROLES.ADMIN
                  ? <Navigate to="/admin/users" replace />
                  : <Navigate to="/customer" replace />
              )
              : (
                <PublicLayout hideFooter>
                  <LoginPage />
                </PublicLayout>
              )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated
              ? <Navigate to="/" replace />
              : (
                <PublicLayout hideFooter>
                  <RegisterPage />
                </PublicLayout>
              )
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated
              ? <Navigate to="/" replace />
              : (
                <PublicLayout hideFooter>
                  <ForgotPasswordPage />
                </PublicLayout>
              )
          }
        />

        {/* ── /shop/login → redirects to unified /login ─── */}
        <Route path="/shop/login" element={<Navigate to="/login" replace />} />

        {/* ── /shop/register → redirects to unified /register?role=SHOP_OWNER ─── */}
        <Route path="/shop/register" element={<Navigate to="/register?role=SHOP_OWNER" replace />} />


        <Route
          path="/shops"
          element={
            <PublicLayout>
              <ShopDiscoveryPage />
            </PublicLayout>
          }
        />

        <Route
          path="/home"
          element={
            <PublicLayout>
              <CustomerHomePage />
            </PublicLayout>
          }
        />

        <Route
          path="/shops/:id"
          element={
            <PublicLayout>
              <ShopDetailsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/shop/:id"
          element={
            <PublicLayout>
              <ShopDetailsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/products"
          element={
            <PublicLayout>
              <ProductsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/shop/:shopId/products"
          element={
            <PublicLayout>
              <ProductsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/shops/:shopId/products"
          element={
            <PublicLayout>
              <ProductsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/product/:id"
          element={
            <PublicLayout>
              <ProductDetailsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/cart"
          element={
            <PublicLayout>
              <CartPage />
            </PublicLayout>
          }
        />

        {/* ── Safe redirect for legacy /offers route ── */}
        <Route
          path="/offers"
          element={<Navigate to="/" replace />}
        />

        {/* ── Informational & Footer Routes ───────────── */}
        {/* Company */}
        <Route
          path="/about"
          element={
            <PublicLayout allowInternalRoles>
              <AboutPage />
            </PublicLayout>
          }
        />
        <Route
          path="/careers"
          element={
            <PublicLayout allowInternalRoles>
              <CareersPage />
            </PublicLayout>
          }
        />
        <Route
          path="/blog"
          element={
            <PublicLayout allowInternalRoles>
              <BlogPage />
            </PublicLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicLayout allowInternalRoles>
              <ContactPage />
            </PublicLayout>
          }
        />

        {/* Help */}
        <Route
          path="/help"
          element={
            <PublicLayout allowInternalRoles>
              <HelpCenterPage />
            </PublicLayout>
          }
        />
        <Route
          path="/track-order"
          element={
            <PublicLayout allowInternalRoles>
              <TrackOrderPage />
            </PublicLayout>
          }
        />
        <Route
          path="/refund-policy"
          element={
            <PublicLayout allowInternalRoles>
              <RefundPolicyPage />
            </PublicLayout>
          }
        />
        <Route
          path="/delivery-info"
          element={
            <PublicLayout allowInternalRoles>
              <DeliveryInfoPage />
            </PublicLayout>
          }
        />

        {/* Join As */}
        <Route
          path="/join/customer"
          element={
            <PublicLayout allowInternalRoles>
              <JoinCustomerPage />
            </PublicLayout>
          }
        />
        <Route
          path="/join/shop-owner"
          element={
            <PublicLayout allowInternalRoles>
              <JoinShopOwnerPage />
            </PublicLayout>
          }
        />
        <Route
          path="/join/delivery-partner"
          element={
            <PublicLayout allowInternalRoles>
              <JoinDeliveryPartnerPage />
            </PublicLayout>
          }
        />

        {/* Legal */}
        <Route
          path="/privacy-policy"
          element={
            <PublicLayout allowInternalRoles>
              <PrivacyPolicyPage />
            </PublicLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <PublicLayout allowInternalRoles>
              <TermsPage />
            </PublicLayout>
          }
        />
        <Route
          path="/cookie-policy"
          element={
            <PublicLayout allowInternalRoles>
              <CookiePolicyPage />
            </PublicLayout>
          }
        />

        {/* Legacy Footer Redirects */}
        <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
        <Route path="/refunds" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/cookies" element={<Navigate to="/cookie-policy" replace />} />

        {/* ── Customer Routes ─────────────────── */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <CustomerHomePage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/shops"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <ShopDiscoveryPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/shops/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <ShopDetailsPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/products"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <ProductsPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/product/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <ProductDetailsPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/cart"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <CartPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/checkout"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <CheckoutPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/payment"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <PaymentPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/order-confirmation"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <OrderConfirmationPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <CustomerOrdersPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <OrderDetailsPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/orders/:orderId/tracking"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <OrderTrackingPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <CustomerProfilePage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/addresses"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
              <CustomerLayout>
                <AddressPage />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Shop Owner Protected Routes ─────── */}
        <Route
          path="/shop-owner/dashboard"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopDashboard />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/dashboard"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopDashboard />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        <Route
          path="/shop-owner/products"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerProductsPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/products"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerProductsPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        <Route
          path="/shop-owner/inventory"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerInventoryPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/inventory"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerInventoryPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        <Route
          path="/shop-owner/orders"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerOrdersPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop-owner/orders/:orderId"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerOrderDetailsPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/orders"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerOrdersPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/orders/:orderId"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerOrderDetailsPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        <Route
          path="/shop-owner/shop-profile"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerShopProfilePage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/settings"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerShopProfilePage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        <Route
          path="/shop-owner/profile"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerProfilePage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />
        <Route
          path="/shop/profile"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerProfilePage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />

        {/* Module 36 — Shop Owner Reviews */}
        <Route
          path="/shop-owner/reviews"
          element={
            <ShopOwnerProtectedRoute>
              <ShopOwnerLayout>
                <ShopOwnerReviewsPage />
              </ShopOwnerLayout>
            </ShopOwnerProtectedRoute>
          }
        />


        {/* ── Delivery Partner Routes ─────────── */}
        <Route
          path="/delivery/dashboard"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryDashboardPage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/requests"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryRequestsPage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/active"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryExecutionPage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/orders"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryRequestsPage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/profile"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryProfilePage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/delivery/earnings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
              <DeliveryPartnerLayout>
                <DeliveryEarningsPage />
              </DeliveryPartnerLayout>
            </ProtectedRoute>
          }
        />


        {/* ── Admin Routes ────────────────────── */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/users" replace />}
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminUsersPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/shops"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminShopsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminProductsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminCategoriesPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminOrdersPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminOrderDetailsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/delivery"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminDeliveryPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deliveries"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminDeliveryPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/delivery/:deliveryId"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminDeliveryDetailsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Module 36 — Admin Reviews Moderation */}
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLayout>
                <AdminReviewsPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* ── 404 catch-all ───────────────────── */}
        <Route
          path="*"
          element={
            <PublicLayout>
              <PlaceholderPage
                title="Page Not Found"
                description="The page you're looking for doesn't exist or has been moved."
              />
            </PublicLayout>
          }
        />

      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
