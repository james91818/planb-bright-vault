import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AccountTypes from "./pages/AccountTypes";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/backoffice" element={<AdminLogin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account-types" element={<AccountTypes />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Client routes */}
            <Route path="/trading" element={<PlaceholderPage />} />
            <Route path="/wallet" element={<PlaceholderPage />} />
            <Route path="/staking" element={<PlaceholderPage />} />
            <Route path="/watchlist" element={<PlaceholderPage />} />
            {/* Admin routes */}
            <Route path="/admin/users" element={<PlaceholderPage />} />
            <Route path="/admin/deposits" element={<PlaceholderPage />} />
            <Route path="/admin/withdrawals" element={<PlaceholderPage />} />
            <Route path="/admin/trades" element={<PlaceholderPage />} />
            <Route path="/admin/assets" element={<PlaceholderPage />} />
            <Route path="/admin/news" element={<PlaceholderPage />} />
            <Route path="/admin/roles" element={<PlaceholderPage />} />
            {/* Shared routes */}
            <Route path="/notifications" element={<PlaceholderPage />} />
            <Route path="/support" element={<PlaceholderPage />} />
            <Route path="/settings" element={<PlaceholderPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
