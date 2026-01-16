import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/lib/cart-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/admin-route";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Suspense, lazy, memo } from "react";

// Loading fallback component - lightweight for low-end devices
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
));
PageLoader.displayName = "PageLoader";

// Lazy load pages for better code splitting
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const Auth = lazy(() => import("@/pages/auth"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const OrderTracking = lazy(() => import("@/pages/order-tracking"));
const OrbitSaas = lazy(() => import("@/pages/orbit-saas"));

// Customer Pages - lazy loaded
const CustomerShop = lazy(() => import("@/pages/customer/shop"));
const Cart = lazy(() => import("@/pages/customer/cart"));
const Checkout = lazy(() => import("@/pages/customer/checkout"));
const OrderConfirmation = lazy(() => import("@/pages/customer/order-confirmation"));
const CustomerOrders = lazy(() => import("@/pages/customer/orders"));
const ProductDetail = lazy(() => import("@/pages/customer/product-detail"));
const Profile = lazy(() => import("@/pages/customer/profile"));

// Seller Pages - lazy loaded
const SellerDashboard = lazy(() => import("@/pages/seller/dashboard"));
const AddProduct = lazy(() => import("@/pages/seller/add-product"));
const EditProduct = lazy(() => import("@/pages/seller/edit-product"));
const SellerVerification = lazy(() => import("@/pages/seller/verification"));

// Admin Pages - lazy loaded
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const SellerVerificationDetail = lazy(() => import("@/pages/admin/seller-verification"));
const ProductVerificationDetail = lazy(() => import("@/pages/admin/product-verification"));
const FixDatabase = lazy(() => import("@/pages/fix-db"));
const ShopProfile = lazy(() => import("@/pages/shop-profile"));

// Wrapped lazy component with Suspense
const LazyRoute = memo(({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType<any>> }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
));
LazyRoute.displayName = "LazyRoute";

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={() => <LazyRoute component={Home} />} />
        <Route path="/auth" component={() => <LazyRoute component={Auth} />} />
        <Route path="/privacy-policy" component={() => <LazyRoute component={PrivacyPolicy} />} />
        <Route path="/terms-of-service" component={() => <LazyRoute component={TermsOfService} />} />
        <Route path="/track-order" component={() => <LazyRoute component={OrderTracking} />} />
        <Route path="/track-order/:id" component={() => <LazyRoute component={OrderTracking} />} />
        <Route path="/orbit-saas" component={() => <LazyRoute component={OrbitSaas} />} />

        {/* Customer Routes */}
        <Route path="/shop" component={() => <LazyRoute component={CustomerShop} />} />
        <Route path="/shop/cart" component={() => <LazyRoute component={Cart} />} />
        <Route path="/shop/checkout" component={() => <LazyRoute component={Checkout} />} />
        <Route path="/shop/order-confirmation/:id" component={() => <LazyRoute component={OrderConfirmation} />} />
        <Route path="/shop/product/:id" component={() => <LazyRoute component={ProductDetail} />} />
        <Route path="/shop/orders" component={() => <LazyRoute component={CustomerOrders} />} />
        <Route path="/orders" component={() => <LazyRoute component={CustomerOrders} />} />
        <Route path="/shops/:id" component={() => <LazyRoute component={ShopProfile} />} />
        <Route path="/profile" component={() => <LazyRoute component={Profile} />} />

        {/* Seller Routes */}
        <Route path="/seller" component={() => <LazyRoute component={SellerDashboard} />} />
        <Route path="/seller/orders" component={() => <LazyRoute component={SellerDashboard} />} />
        <Route path="/seller/products" component={() => <LazyRoute component={SellerDashboard} />} />
        <Route path="/seller/earnings" component={() => <LazyRoute component={SellerDashboard} />} />
        <Route path="/seller/account" component={() => <LazyRoute component={SellerDashboard} />} />
        <Route path="/seller/add-product" component={() => <LazyRoute component={AddProduct} />} />
        <Route path="/seller/edit-product/:id" component={() => <LazyRoute component={EditProduct} />} />
        <Route path="/seller/verification" component={() => <LazyRoute component={SellerVerification} />} />

        {/* Admin Routes */}
        <Route path="/admin">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/sellers">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/products">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/users">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/orders">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/admins">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/verify-seller/:id">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <SellerVerificationDetail />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/verify-product/:id">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <ProductVerificationDetail />
            </Suspense>
          </AdminRoute>
        </Route>
        <Route path="/admin/db-fix">
          <AdminRoute>
            <Suspense fallback={<PageLoader />}>
              <FixDatabase />
            </Suspense>
          </AdminRoute>
        </Route>

        {/* 404 */}
        <Route component={() => <LazyRoute component={NotFound} />} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
