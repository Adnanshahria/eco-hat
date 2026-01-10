import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/lib/cart-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/admin-route";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import OrderTracking from "@/pages/order-tracking";

// Customer Pages
import CustomerShop from "@/pages/customer/shop";
import Cart from "@/pages/customer/cart";
import Checkout from "@/pages/customer/checkout";
import OrderConfirmation from "@/pages/customer/order-confirmation";
import CustomerOrders from "@/pages/customer/orders";
import ProductDetail from "@/pages/customer/product-detail";
import Profile from "@/pages/customer/profile";

// Seller Pages
import SellerDashboard from "@/pages/seller/dashboard";
import AddProduct from "@/pages/seller/add-product";
import EditProduct from "@/pages/seller/edit-product";
import SellerVerification from "@/pages/seller/verification";


// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import SellerVerificationDetail from "@/pages/admin/seller-verification";
import ProductVerificationDetail from "@/pages/admin/product-verification";
import FixDatabase from "@/pages/fix-db";
import ShopProfile from "@/pages/shop-profile";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/track-order" component={OrderTracking} />
      <Route path="/track-order/:id" component={OrderTracking} />

      {/* Customer Routes */}
      <Route path="/shop" component={CustomerShop} />
      <Route path="/shop/cart" component={Cart} />
      <Route path="/shop/checkout" component={Checkout} />
      <Route path="/shop/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/shop/product/:id" component={ProductDetail} />
      <Route path="/shop/orders" component={CustomerOrders} />
      <Route path="/orders" component={CustomerOrders} />
      <Route path="/shops/:id" component={ShopProfile} />
      <Route path="/profile" component={Profile} />

      {/* Seller Routes */}
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller/orders" component={SellerDashboard} />
      <Route path="/seller/products" component={SellerDashboard} />
      <Route path="/seller/earnings" component={SellerDashboard} />
      <Route path="/seller/account" component={SellerDashboard} />
      <Route path="/seller/add-product" component={AddProduct} />
      <Route path="/seller/edit-product/:id" component={EditProduct} />
      <Route path="/seller/verification" component={SellerVerification} />


      {/* Admin Routes */}
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/sellers">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/products">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/orders">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/admins">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/verify-seller/:id">
        <AdminRoute>
          <SellerVerificationDetail />
        </AdminRoute>
      </Route>
      <Route path="/admin/verify-product/:id">
        <AdminRoute>
          <ProductVerificationDetail />
        </AdminRoute>
      </Route>
      <Route path="/admin/db-fix">
        <AdminRoute>
          <FixDatabase />
        </AdminRoute>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}



// ... (existing imports)

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
