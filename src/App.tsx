import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import AccountTypes from "./pages/AccountTypes";
import Investments from "./pages/Investments";
import Impressum from "./pages/Impressum";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import GeneralTerms from "./pages/legal/GeneralTerms";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import RiskWarning from "./pages/legal/RiskWarning";
import TermsConditions from "./pages/legal/TermsConditions";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import SupportCenter from "./pages/SupportCenter";
import TradingHours from "./pages/TradingHours";
import InstrumentsPage from "./pages/Instruments";
import Dashboard from "./pages/Dashboard";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminDeposits from "./pages/admin/AdminDeposits";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminTrades from "./pages/admin/AdminTrades";
import AdminAssets from "./pages/admin/AdminAssets";
import AdminNews from "./pages/admin/AdminNews";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminDepositors from "./pages/admin/AdminDepositors";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminStaking from "./pages/admin/AdminStaking";
import AdminBalance from "./pages/admin/AdminBalance";
import AdminCopyTrading from "./pages/admin/AdminCopyTrading";
import AdminCalendar from "./pages/admin/AdminCalendar";

// Client pages
import Trading from "./pages/client/Trading";
import WalletPage from "./pages/client/Wallet";
import Staking from "./pages/client/Staking";
import Watchlist from "./pages/client/Watchlist";
import CopyTrading from "./pages/client/CopyTrading";
import PnlSummary from "./pages/client/PnlSummary";

// Shared pages
import Notifications from "./pages/shared/Notifications";
import Support from "./pages/shared/Support";
import Settings from "./pages/shared/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
          <Route path="/investments" element={<Investments />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/general-terms" element={<GeneralTerms />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/risk-warning" element={<RiskWarning />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/support-center" element={<SupportCenter />} />
          <Route path="/trading-hours" element={<TradingHours />} />
          <Route path="/instruments" element={<InstrumentsPage />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Client routes */}
            <Route path="/trading" element={<Trading />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/copy-trading" element={<CopyTrading />} />
            {/* Admin routes */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
            <Route path="/admin/depositors" element={<AdminDepositors />} />
            <Route path="/admin/balance" element={<AdminBalance />} />
            <Route path="/admin/deposits" element={<AdminDeposits />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
            <Route path="/admin/trades" element={<AdminTrades />} />
            <Route path="/admin/staking" element={<AdminStaking />} />
            <Route path="/admin/assets" element={<AdminAssets />} />
            <Route path="/admin/agents" element={<AdminAgents />} />
            <Route path="/admin/affiliates" element={<AdminAffiliates />} />
            <Route path="/admin/news" element={<AdminNews />} />
            <Route path="/admin/copy-trading" element={<AdminCopyTrading />} />
            <Route path="/admin/roles" element={<AdminRoles />} />
            <Route path="/admin/calendar" element={<AdminCalendar />} />
            {/* Shared routes */}
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
