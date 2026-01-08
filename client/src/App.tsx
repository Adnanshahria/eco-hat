import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/lib/cart-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminRoute } from "@/components/admin-route";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Auth from "@/pages/auth";

// Customer Pages
import CustomerShop from "@/pages/customer/shop";
import Cart from "@/pages/customer/cart";
import Checkout from "@/pages/customer/checkout";
import OrderConfirmation from "@/pages/customer/order-confirmation";
import CustomerOrders from "@/pages/customer/orders";
import Profile from "@/pages/customer/profile";

// Seller Pages
import SellerDashboard from "@/pages/seller/dashboard";
import AddProduct from "@/pages/seller/add-product";
import SellerProfile from "@/pages/seller/profile";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />

      {/* Customer Routes */}
      <Route path="/shop" component={CustomerShop} />
      <Route path="/shop/cart" component={Cart} />
      <Route path="/shop/checkout" component={Checkout} />
      <Route path="/shop/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/shop/orders" component={CustomerOrders} />
      <Route path="/profile" component={Profile} />

      {/* Seller Routes */}
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller/add-product" component={AddProduct} />
      <Route path="/seller/profile" component={SellerProfile} />

      {/* Admin Routes */}
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
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
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <WouterRouter base={import.meta.env.BASE_URL}>
              <Router />
            </WouterRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
