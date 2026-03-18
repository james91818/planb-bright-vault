import { useEffect, useState, useCallback } from "react";
import { fetchLivePrices, computeLivePnl } from "@/lib/tradePnl";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Save, Ban, CheckCircle, DollarSign, TrendingUp, Wallet, Shield, MessageSquare, Send, Plus, Eye, EyeOff, KeyRound, Landmark, Lock, Clock, TrendingDown, CalendarDays, Phone, FileText, Download, Paperclip, Image, X, File } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-600",
};

const AdminUserDetail = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoleId, setUserRoleId] = useState<string>("none");
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: "", phone: "", country: "", kyc_status: "" });
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [uploadingComment, setUploadingComment] = useState(false);
  const [manualDepositOpen, setManualDepositOpen] = useState(false);
  const [depForm, setDepForm] = useState({ amount: "", currency: "EUR", method: "manual", notes: "", crypto_asset: "BTC" });
  const [manualWithdrawOpen, setManualWithdrawOpen] = useState(false);
  const [wdForm, setWdForm] = useState({ amount: "", currency: "EUR", method: "manual", notes: "" });
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [cryptoPricesEur, setCryptoPricesEur] = useState<Record<string, number>>({});
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  // Stakes
  const [stakes, setStakes] = useState<any[]>([]);
  const [stakingPlans, setStakingPlans] = useState<any[]>([]);
  const [editStake, setEditStake] = useState<any>(null);
  const [rewardsInput, setRewardsInput] = useState("");
  const [claimedInput, setClaimedInput] = useState("false");
  // Bank details
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ bank_name: "", account_holder: "", iban: "", swift_bic: "", reference: "", notes: "" });
  const [savingBank, setSavingBank] = useState(false);
  // Crypto addresses
  const [cryptoAddresses, setCryptoAddresses] = useState<any[]>([]);
  const [cryptoForm, setCryptoForm] = useState({ currency: "BTC", address: "", network: "", label: "" });
  const [savingCrypto, setSavingCrypto] = useState(false);
  // Report settings
  const [reportType, setReportType] = useState("custom");
  const [reportDateRange, setReportDateRange] = useState("all");
  const [reportSections, setReportSections] = useState<Record<string, boolean>>({ wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true });
  const [reportFrequency, setReportFrequency] = useState("manual");
  const [reportEnabled, setReportEnabled] = useState(false);
  const [reportLastSent, setReportLastSent] = useState<string | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const reportTemplates: Record<string, { label: string; description: string; sections: Record<string, boolean> }> = {
    custom: { label: "Custom Report", description: "Select sections manually", sections: { wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true } },
    pnl_report: { label: "Profit & Loss Report", description: "Portfolio performance, trades and P&L summary", sections: { wallets: true, trades: true, deposits: false, withdrawals: false, staking: false, pnl: true } },
    account_summary: { label: "Account Summary", description: "Full overview of all account activity", sections: { wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true } },
    deposit_banking: { label: "Deposit & Banking Details", description: "Deposit history and bank information", sections: { wallets: true, trades: false, deposits: true, withdrawals: true, staking: false, pnl: false } },
    staking_report: { label: "Staking Report", description: "Active stakes, rewards earned and plan details", sections: { wallets: false, trades: false, deposits: false, withdrawals: false, staking: true, pnl: false } },
    trading_activity: { label: "Trading Activity Report", description: "Detailed trading history with entry/exit prices", sections: { wallets: false, trades: true, deposits: false, withdrawals: false, staking: false, pnl: true } },
  };

  const fetchAll = async () => {
    if (!userId) return;
    const [
      { data: prof },
      { data: rolesData },
      { data: urData },
      { data: deps },
      { data: wds },
      { data: trs },
      { data: wals },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("roles").select("*"),
      supabase.from("user_roles").select("user_id, role_id, roles(name)").eq("user_id", userId),
      supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", userId).order("opened_at", { ascending: false }).limit(50),
      supabase.from("wallets").select("*").eq("user_id", userId),
    ]);

    // Fetch admin notes, stakes, and bank details
    const [{ data: notes }, { data: userStakes }, { data: plans }, { data: bankData }] = await Promise.all([
      (supabase as any).from("admin_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("user_stakes").select("*, staking_plans(name, asset, apy)").eq("user_id", userId).order("started_at", { ascending: false }),
      supabase.from("staking_plans").select("*").order("apy"),
      (supabase as any).from("client_bank_details").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    setProfile(prof);
    setRoles(rolesData ?? []);
    setUserRoleId((urData && urData.length > 0) ? urData[0].role_id : "none");
    setDeposits(deps ?? []);
    setWithdrawals(wds ?? []);
    setTrades(trs ?? []);
    setWallets(wals ?? []);
    setAdminNotes(notes ?? []);
    setStakes(userStakes ?? []);
    setStakingPlans(plans ?? []);
    setBankDetails(bankData);
    if (bankData) {
      setBankForm({
        bank_name: bankData.bank_name ?? "",
        account_holder: bankData.account_holder ?? "",
        iban: bankData.iban ?? "",
        swift_bic: bankData.swift_bic ?? "",
        reference: bankData.reference ?? "",
        notes: bankData.notes ?? "",
      });
    }

    // Fetch crypto addresses
    const { data: cryptoData } = await (supabase as any).from("client_crypto_addresses").select("*").eq("user_id", userId).order("currency");
    setCryptoAddresses(cryptoData ?? []);

    // Fetch report settings
    const { data: reportData } = await (supabase as any).from("report_settings").select("*").eq("user_id", userId).maybeSingle();
    if (reportData) {
      setReportSections(reportData.sections ?? { wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true });
      setReportFrequency(reportData.frequency ?? "manual");
      setReportEnabled(reportData.enabled ?? false);
      setReportLastSent(reportData.last_sent_at ?? null);
    }

    if (prof) {
      setEditProfile({
        full_name: prof.full_name ?? "",
        phone: prof.phone ?? "",
        country: prof.country ?? "",
        kyc_status: prof.kyc_status ?? "not_submitted",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [userId]);

  const saveStakeOverride = async () => {
    if (!editStake) return;
    const { error } = await supabase.from("user_stakes").update({
      rewards_earned: Number(rewardsInput),
      claimed: claimedInput === "true",
    }).eq("id", editStake.id);
    if (error) { toast.error("Failed to update"); return; }
    if (claimedInput === "true" && !editStake.claimed) {
      const reward = Number(rewardsInput) || 0;
      const totalReturn = Number(editStake.amount) + reward;
      const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", editStake.user_id).eq("currency", "EUR").maybeSingle();
      if (wallet) {
        await supabase.from("wallets").update({ balance: Number(wallet.balance) + totalReturn }).eq("id", wallet.id);
      }
    }
    toast.success("Stake updated");
    setEditStake(null);
    fetchAll();
  };

  // Fetch crypto prices on load for EUR conversion
  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,dogecoin,cardano,polkadot,chainlink,avalanche-2&vs_currencies=eur")
      .then(r => r.json())
      .then(data => {
        const map: Record<string, number> = {};
        const idToSymbol: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", binancecoin: "BNB", dogecoin: "DOGE", cardano: "ADA", polkadot: "DOT", chainlink: "LINK", "avalanche-2": "AVAX" };
        Object.entries(data).forEach(([id, val]: any) => { map[idToSymbol[id]] = val.eur; });
        setCryptoPricesEur(map);
      })
      .catch(() => {});
  }, []);

  // Fetch live asset prices for trade P&L
  const refreshLivePrices = useCallback(async () => {
    if (!trades.length) return;
    const symbols = [...new Set(trades.map((t: any) => t.assets?.symbol).filter(Boolean))] as string[];
    if (symbols.length) {
      const prices = await fetchLivePrices(symbols);
      if (Object.keys(prices).length) setLivePrices(prices);
    }
  }, [trades]);

  useEffect(() => { refreshLivePrices(); }, [refreshLivePrices]);
  useEffect(() => {
    if (!trades.length) return;
    const interval = setInterval(refreshLivePrices, 30000);
    return () => clearInterval(interval);
  }, [trades, refreshLivePrices]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update(editProfile).eq("id", userId);
    toast.success("Profile updated");
    setSaving(false);
    fetchAll();
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "change_password", user_id: userId, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Password updated successfully");
      setNewPassword("");
    } catch (err: any) {
      toast.error(`Failed to change password: ${err.message}`);
    }
    setChangingPassword(false);
  };

  const updateStatus = async (status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`User ${status === "suspended" ? "suspended" : "activated"}`);
    fetchAll();
  };

  const assignRole = async (roleId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId!);
    if (roleId !== "none") {
      await supabase.from("user_roles").insert({ user_id: userId!, role_id: roleId });
    }
    setUserRoleId(roleId);
    toast.success("Role updated");
  };

  const updateWalletBalance = async (walletId: string, newBalance: number) => {
    await supabase.from("wallets").update({ balance: newBalance }).eq("id", walletId);
    toast.success("Wallet balance updated");
    fetchAll();
  };

  const saveBankDetails = async () => {
    if (!userId) return;
    setSavingBank(true);
    if (bankDetails) {
      await (supabase as any).from("client_bank_details").update(bankForm).eq("user_id", userId);
    } else {
      await (supabase as any).from("client_bank_details").insert({ ...bankForm, user_id: userId });
    }
    toast.success("Bank details saved");
    setSavingBank(false);
    fetchAll();
  };

  const saveCryptoAddress = async () => {
    if (!userId || !cryptoForm.address.trim()) { toast.error("Enter wallet address"); return; }
    setSavingCrypto(true);
    const existing = cryptoAddresses.find(a => a.currency === cryptoForm.currency);
    if (existing) {
      await (supabase as any).from("client_crypto_addresses").update({ address: cryptoForm.address, network: cryptoForm.network, label: cryptoForm.label }).eq("id", existing.id);
    } else {
      await (supabase as any).from("client_crypto_addresses").insert({ ...cryptoForm, user_id: userId });
    }
    toast.success(`${cryptoForm.currency} address saved`);
    setCryptoForm({ currency: "BTC", address: "", network: "", label: "" });
    setSavingCrypto(false);
    fetchAll();
  };

  const deleteCryptoAddress = async (id: string) => {
    await (supabase as any).from("client_crypto_addresses").delete().eq("id", id);
    toast.success("Address removed");
    fetchAll();
  };

  const submitNote = async () => {
    if (!currentUser || !userId || (!newNote.trim() && commentFiles.length === 0)) return;
    setUploadingComment(true);

    // Upload files first
    const uploadedUrls: string[] = [];
    for (const file of commentFiles) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("comment-attachments").upload(path, file);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("comment-attachments").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    await (supabase as any).from("admin_notes").insert({
      user_id: userId,
      author_id: currentUser.id,
      content: newNote.trim(),
      attachments: uploadedUrls,
    });
    setNewNote("");
    setCommentFiles([]);
    setUploadingComment(false);
    toast.success("Comment added");
    fetchAll();
  };

  const submitManualDeposit = async () => {
    if (!depForm.amount || Number(depForm.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const amount = Number(depForm.amount);
    const isCrypto = depForm.method === "crypto";
    const creditCurrency = isCrypto ? depForm.crypto_asset : depForm.currency;

    const { error: depError } = await supabase.from("deposits").insert({
      user_id: userId!,
      amount,
      currency: creditCurrency,
      method: depForm.method,
      status: "approved",
      admin_notes: depForm.notes || "Manual deposit by admin",
      processed_by: currentUser?.id,
    });

    if (depError) {
      toast.error("Failed to create deposit: " + depError.message);
      return;
    }

    // Credit the appropriate wallet (crypto or fiat)
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId!)
      .eq("currency", creditCurrency)
      .maybeSingle();

    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + amount }).eq("id", wallet.id);
    } else {
      // Create wallet if it doesn't exist (e.g. crypto wallets)
      await supabase.from("wallets").insert({ user_id: userId!, currency: creditCurrency, balance: amount });
    }

    if (amount >= 1) {
      await supabase.from("profiles").update({ is_lead: false }).eq("id", userId!);
    }

    toast.success("Manual deposit created and credited");
    setManualDepositOpen(false);
    setDepForm({ amount: "", currency: "EUR", method: "manual", notes: "", crypto_asset: "BTC" });
    fetchAll();
  };

  const submitManualWithdraw = async () => {
    if (!wdForm.amount || Number(wdForm.amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const amount = Number(wdForm.amount);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId!)
      .eq("currency", wdForm.currency)
      .maybeSingle();

    if (wallet && Number(wallet.balance) < amount) {
      toast.error("Insufficient wallet balance");
      return;
    }

    const { error: wdError } = await supabase.from("withdrawals").insert({
      user_id: userId!,
      amount,
      currency: wdForm.currency,
      method: wdForm.method,
      status: "approved",
      admin_notes: wdForm.notes || "Manual withdrawal by admin",
      processed_by: currentUser?.id,
    });

    if (wdError) {
      toast.error("Failed to create withdrawal: " + wdError.message);
      return;
    }

    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) - amount }).eq("id", wallet.id);
    }

    toast.success("Manual withdrawal created and deducted");
    setManualWithdrawOpen(false);
    setWdForm({ amount: "", currency: "EUR", method: "manual", notes: "" });
    fetchAll();
  };

  const FIAT_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD"];
  const totalDeposited = deposits.filter(d => d.status === "approved").reduce((s, d) => {
    const amt = Number(d.amount);
    if (FIAT_CURRENCIES.includes(d.currency)) return s + amt;
    // Crypto: convert to EUR using live price
    const eurPrice = cryptoPricesEur[d.currency];
    return s + (eurPrice ? amt * eurPrice : amt);
  }, 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "approved").reduce((s, w) => {
    const amt = Number(w.amount);
    if (FIAT_CURRENCIES.includes(w.currency)) return s + amt;
    const eurPrice = cryptoPricesEur[w.currency];
    return s + (eurPrice ? amt * eurPrice : amt);
  }, 0);
  const totalPnl = trades.filter(t => t.status === "closed").reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const openTradesCount = trades.filter(t => t.status === "open").length;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading user...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">User not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{profile.full_name || profile.email}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.email}</span>
            {profile.phone && (
              <>
                <span>•</span>
                <span>{profile.phone}</span>
              </>
            )}
          </div>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[profile.status] ?? "bg-muted text-muted-foreground"}`}>
          {profile.status}
        </span>
        {profile.phone && (
          <Button variant="outline" size="sm" className="text-success border-success/30 hover:bg-success/10" onClick={() => window.open(`tel:${profile.phone}`, "_self")}>
            <Phone className="h-4 w-4 mr-1" /> Call
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate(`/admin/calendar?client=${userId}&clientName=${encodeURIComponent(profile.full_name || profile.email)}`)}>
          <CalendarDays className="h-4 w-4 mr-1" /> Schedule Appointment
        </Button>
        <Badge variant={profile.is_lead ? "secondary" : "default"} className="text-xs">
          {profile.is_lead ? "Lead" : "Depositor"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-lg font-display font-bold">€{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Withdrawn</p>
              <p className="text-lg font-display font-bold">€{totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <p className={`text-lg font-display font-bold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                €{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Trades</p>
              <p className="text-lg font-display font-bold">{openTradesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="stakes">Stakes ({stakes.length})</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="crypto">Crypto</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="notes">Comments ({adminNotes.length})</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editProfile.full_name} onChange={e => setEditProfile({ ...editProfile, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={editProfile.phone} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input value={editProfile.country} onChange={e => setEditProfile({ ...editProfile, country: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>KYC Status</Label>
                  <Select value={editProfile.kyc_status} onValueChange={v => setEditProfile({ ...editProfile, kyc_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_submitted">Not Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
                <div className="border-t pt-4 mt-4 space-y-2">
                  <Label className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="New password (min 6 chars)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline" className="w-full">
                    <KeyRound className="h-4 w-4 mr-2" /> {changingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Account Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send email alerts for deposits, withdrawals, trades</p>
                  </div>
                  <button
                    onClick={async () => {
                      const newVal = !profile.email_notifications;
                      await supabase.from("profiles").update({ email_notifications: newVal }).eq("id", userId);
                      setProfile({ ...profile, email_notifications: newVal });
                      toast.success(`Email notifications ${newVal ? "enabled" : "disabled"}`);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.email_notifications ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.email_notifications ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="space-y-2 pt-4">
                  <Label>Status Actions</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-success border-success/30 hover:bg-success/10" onClick={() => updateStatus("active")}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Activate
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus("suspended")}>
                      <Ban className="h-4 w-4 mr-2" /> Suspend
                    </Button>
                  </div>
                </div>
                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Joined</span><span>{new Date(profile.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>2FA</span><span>{profile.two_factor_enabled ? "Enabled" : "Disabled"}</span></div>
                  <div className="flex justify-between"><span>Type</span><span>{profile.is_lead ? "Lead" : "Depositor"}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Currency</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map(w => (
                    <WalletRow key={w.id} wallet={w} onUpdate={updateWalletBalance} cryptoPricesEur={cryptoPricesEur} />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => {
              setManualDepositOpen(true);
              // Fetch crypto prices in EUR
              fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,binancecoin,dogecoin,cardano,polkadot,chainlink,avalanche-2&vs_currencies=eur")
                .then(r => r.json())
                .then(data => {
                  const map: Record<string, number> = {};
                  const idToSymbol: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", ripple: "XRP", binancecoin: "BNB", dogecoin: "DOGE", cardano: "ADA", polkadot: "DOT", chainlink: "LINK", "avalanche-2": "AVAX" };
                  Object.entries(data).forEach(([id, val]: any) => { map[idToSymbol[id]] = val.eur; });
                  setCryptoPricesEur(map);
                })
                .catch(() => {});
            }}>
              <Plus className="h-4 w-4 mr-1" /> Manual Deposit
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No deposits</td></tr>
                  ) : deposits.map(d => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">{d.currency} {Number(d.amount).toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground capitalize">{d.method}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-xs">{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Manual Deposit Dialog */}
          <Dialog open={manualDepositOpen} onOpenChange={setManualDepositOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Deposit for {profile?.full_name || profile?.email}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Method</Label>
                  <Select value={depForm.method} onValueChange={(v) => setDepForm({ ...depForm, method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="bank_wire">Bank Wire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input type="number" value={depForm.amount} onChange={(e) => setDepForm({ ...depForm, amount: e.target.value })} placeholder="1000" />
                  </div>
                  {depForm.method === "crypto" ? (
                    <div className="space-y-1">
                      <Label>Crypto Asset</Label>
                      <Select value={depForm.crypto_asset} onValueChange={(v) => setDepForm({ ...depForm, crypto_asset: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "DOT", "LINK", "AVAX"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Label>Currency</Label>
                      <Select value={depForm.currency} onValueChange={(v) => setDepForm({ ...depForm, currency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["EUR", "USD", "GBP", "CHF", "AUD", "CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                {depForm.method === "crypto" && depForm.amount && cryptoPricesEur[depForm.crypto_asset] ? (
                  <p className="text-sm text-muted-foreground">
                    ≈ €{(Number(depForm.amount) * cryptoPricesEur[depForm.crypto_asset]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR
                    <span className="text-xs ml-1">(1 {depForm.crypto_asset} = €{cryptoPricesEur[depForm.crypto_asset].toLocaleString()})</span>
                  </p>
                ) : null}
                <div className="space-y-1">
                  <Label>Notes (optional)</Label>
                  <Textarea value={depForm.notes} onChange={(e) => setDepForm({ ...depForm, notes: e.target.value })} placeholder="Reason for manual deposit..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setManualDepositOpen(false)}>Cancel</Button>
                <Button onClick={submitManualDeposit}>Create & Credit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-display">Withdrawals</CardTitle>
              <Button size="sm" onClick={() => { setWdForm({ amount: "", currency: "EUR", method: "manual", notes: "" }); setManualWithdrawOpen(true); }}>
                <Plus className="h-4 w-4 mr-1" /> Manual Withdraw
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No withdrawals</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w.id} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">€{Number(w.amount).toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground capitalize">{w.method}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-xs">{w.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Asset</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Direction</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Qty</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Entry</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">P&L</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No trades</td></tr>
                    ) : trades.map(t => {
                      const symbol = (t.assets as any)?.symbol;
                      const pnl = computeLivePnl(t, livePrices[symbol]);
                      const entryPrice = Number(t.entry_price);
                      const size = Number(t.size);
                      const qty = entryPrice > 0 ? size / entryPrice : 0;
                      const assetBase = symbol?.replace(/\/.*$/, "").replace("EUR", "").replace("USD", "").replace("USDT", "") || "";
                      return (
                        <tr key={t.id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{symbol ?? "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={`text-xs capitalize ${t.direction === "buy" ? "text-success" : "text-destructive"}`}>
                              {t.direction}
                            </Badge>
                          </td>
                          <td className="p-3">€{size.toLocaleString()}</td>
                          <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                            {qty < 1 ? qty.toFixed(6) : qty.toFixed(4)} {assetBase}
                          </td>
                          <td className="p-3">{entryPrice.toLocaleString()}</td>
                          <td className={`p-3 font-semibold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                          </td>
                          <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{t.status}</Badge></td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(t.opened_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakes Tab */}
        <TabsContent value="stakes">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Stakes ({stakes.length})
                </h3>
              </div>
              {stakes.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">No stakes</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">APY</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Rewards</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Unlocks</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stakes.map((s) => {
                        const unlocked = new Date(s.unlocks_at) <= new Date();
                        const reward = Number(s.rewards_earned ?? 0);
                        return (
                          <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3 font-medium">{(s as any).staking_plans?.name}</td>
                            <td className="p-3 font-semibold">€{Number(s.amount).toLocaleString()}</td>
                            <td className="p-3 text-success font-semibold">{(s as any).staking_plans?.apy}%</td>
                            <td className="p-3">
                              <span className={reward >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                                {reward >= 0 ? "+" : ""}€{reward.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-muted-foreground">{new Date(s.unlocks_at).toLocaleDateString()}</td>
                            <td className="p-3">
                              {s.claimed ? (
                                <Badge variant="outline">Claimed</Badge>
                              ) : unlocked ? (
                                <Badge className="bg-success/10 text-success border-success/30">Ready</Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Locked</Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditStake(s);
                                setRewardsInput(String(s.rewards_earned ?? 0));
                                setClaimedInput(s.claimed ? "true" : "false");
                              }}>
                                <DollarSign className="h-3.5 w-3.5 mr-1" /> Manage
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Bank Details for Deposits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <p className="text-sm text-muted-foreground">
                These bank details will be shown to the client when they choose to deposit via bank wire.
              </p>
              <div className="space-y-1">
                <Label>Bank Name</Label>
                <Input value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })} placeholder="Deutsche Bank AG" />
              </div>
              <div className="space-y-1">
                <Label>Account Holder</Label>
                <Input value={bankForm.account_holder} onChange={e => setBankForm({ ...bankForm, account_holder: e.target.value })} placeholder="PlanB Trading Ltd." />
              </div>
              <div className="space-y-1">
                <Label>IBAN</Label>
                <Input value={bankForm.iban} onChange={e => setBankForm({ ...bankForm, iban: e.target.value })} placeholder="DE89 3704 0044 0532 0130 00" />
              </div>
              <div className="space-y-1">
                <Label>SWIFT / BIC</Label>
                <Input value={bankForm.swift_bic} onChange={e => setBankForm({ ...bankForm, swift_bic: e.target.value })} placeholder="COBADEFFXXX" />
              </div>
              <div className="space-y-1">
                <Label>Reference / Note for Client</Label>
                <Input value={bankForm.reference} onChange={e => setBankForm({ ...bankForm, reference: e.target.value })} placeholder="Use your account ID as reference" />
              </div>
              <div className="space-y-1">
                <Label>Internal Notes (not shown to client)</Label>
                <Textarea value={bankForm.notes} onChange={e => setBankForm({ ...bankForm, notes: e.target.value })} placeholder="Internal notes..." rows={2} />
              </div>
              <Button onClick={saveBankDetails} disabled={savingBank} className="w-full">
                <Save className="h-4 w-4 mr-2" /> {savingBank ? "Saving..." : bankDetails ? "Update Bank Details" : "Save Bank Details"}
              </Button>
              {bankDetails && (
                <p className="text-xs text-muted-foreground">Last updated: {new Date(bankDetails.updated_at).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Addresses Tab */}
        <TabsContent value="crypto">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Crypto Deposit Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Add wallet addresses for each cryptocurrency. Clients will see these when making crypto deposits.
              </p>

              {/* Existing addresses */}
              {cryptoAddresses.length > 0 && (
                <div className="space-y-2">
                  {cryptoAddresses.map(a => (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs font-mono">{a.currency}</Badge>
                          {a.network && <span className="text-xs text-muted-foreground">({a.network})</span>}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mt-1 break-all">{a.address}</p>
                        {a.label && <p className="text-xs text-muted-foreground mt-0.5">{a.label}</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCryptoAddress(a.id)}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new address */}
              <div className="border-t pt-4 space-y-3 max-w-lg">
                <Label className="font-semibold">Add / Update Address</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Currency</Label>
                    <Select value={cryptoForm.currency} onValueChange={v => setCryptoForm({ ...cryptoForm, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "DOT", "LINK", "AVAX", "USDT", "USDC"].map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Network (optional)</Label>
                    <Input value={cryptoForm.network} onChange={e => setCryptoForm({ ...cryptoForm, network: e.target.value })} placeholder="ERC-20, TRC-20, etc." />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Wallet Address</Label>
                  <Input value={cryptoForm.address} onChange={e => setCryptoForm({ ...cryptoForm, address: e.target.value })} placeholder="0x..." className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label>Label / Note for Client (optional)</Label>
                  <Input value={cryptoForm.label} onChange={e => setCryptoForm({ ...cryptoForm, label: e.target.value })} placeholder="Main deposit address" />
                </div>
                <Button onClick={saveCryptoAddress} disabled={savingCrypto} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> {savingCrypto ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Client Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Type Selector */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Report Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(reportTemplates).map(([key, tpl]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setReportType(key);
                        if (key !== "custom") {
                          setReportSections(tpl.sections);
                        }
                      }}
                      className={`text-left p-3 rounded-lg border-2 transition-colors ${reportType === key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
                    >
                      <p className="text-sm font-semibold">{tpl.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section toggles */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Report Sections {reportType !== "custom" && <span className="text-xs text-muted-foreground font-normal ml-1">(preset by template — switch to Custom to edit)</span>}</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: "wallets", label: "Wallets / Portfolio" },
                    { key: "pnl", label: "Profit & Loss" },
                    { key: "trades", label: "Trades" },
                    { key: "deposits", label: "Deposits" },
                    { key: "withdrawals", label: "Withdrawals" },
                    { key: "staking", label: "Staking" },
                  ].map((s) => (
                    <label key={s.key} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${reportType !== "custom" ? "opacity-60" : "hover:bg-muted/50"}`}>
                      <input
                        type="checkbox"
                        checked={reportSections[s.key] ?? true}
                        onChange={() => {
                          if (reportType !== "custom") {
                            setReportType("custom");
                          }
                          setReportSections(prev => ({ ...prev, [s.key]: !prev[s.key] }));
                        }}
                        className="rounded border-input"
                      />
                      <span className="text-sm font-medium">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              {/* Date Range & Frequency */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={reportDateRange} onValueChange={setReportDateRange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="last_week">Last Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="this_year">This Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Auto-Send Frequency</Label>
                  <Select value={reportFrequency} onValueChange={setReportFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Auto-Send Enabled</Label>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="checkbox"
                      checked={reportEnabled}
                      onChange={() => setReportEnabled(!reportEnabled)}
                      className="rounded border-input h-4 w-4"
                    />
                    <span className="text-sm text-muted-foreground">{reportEnabled ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>

              {reportLastSent && (
                <p className="text-xs text-muted-foreground">Last sent: {new Date(reportLastSent).toLocaleString()}</p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  disabled={savingReport}
                  variant="outline"
                  onClick={async () => {
                    setSavingReport(true);
                    const { error } = await (supabase as any).from("report_settings").upsert({
                      user_id: userId,
                      sections: reportSections,
                      frequency: reportFrequency,
                      enabled: reportEnabled,
                    }, { onConflict: "user_id" });
                    setSavingReport(false);
                    if (error) { toast.error("Failed to save settings"); return; }
                    toast.success("Report settings saved");
                  }}
                >
                  <Save className="h-4 w-4 mr-1" /> Save Settings
                </Button>

                <Button
                  disabled={sendingReport}
                  variant="outline"
                  onClick={async () => {
                    setSendingReport(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-client-report", {
                        body: { user_id: userId, sections: reportSections, action: "download", date_range: reportDateRange },
                      });
                      if (error) throw error;
                      // data is the HTML string
                      const blob = new Blob([data], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `report-${profile.full_name || "client"}-${new Date().toISOString().slice(0, 10)}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Report downloaded");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to generate report");
                    }
                    setSendingReport(false);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" /> Download Report
                </Button>

                <Button
                  disabled={sendingReport || !profile.email}
                  onClick={async () => {
                    setSendingReport(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-client-report", {
                        body: { user_id: userId, sections: reportSections, action: "email", date_range: reportDateRange },
                      });
                      if (error) throw error;
                      const result = typeof data === "string" ? JSON.parse(data) : data;
                      if (result.success) {
                        setReportLastSent(new Date().toISOString());
                        toast.success(`Report generated for ${profile.email}`);
                      }
                    } catch (err: any) {
                      toast.error(err.message || "Failed to send report");
                    }
                    setSendingReport(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-1" /> Send to Client Email
                </Button>

                <Button
                  disabled={sendingReport}
                  variant="outline"
                  onClick={async () => {
                    setSendingReport(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("generate-client-report", {
                        body: { user_id: userId, sections: reportSections, action: "download" },
                      });
                      if (error) throw error;
                      setPreviewHtml(typeof data === "string" ? data : JSON.stringify(data));
                    } catch (err: any) {
                      toast.error(err.message || "Failed to generate preview");
                    }
                    setSendingReport(false);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" /> Preview Report
                </Button>
              </div>
              {!profile.email && <p className="text-xs text-destructive">No email address on file.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Internal Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add comment */}
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add an internal comment about this user..."
                  rows={2}
                />
                {/* File previews */}
                {commentFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {commentFiles.map((file, idx) => {
                      const isImage = file.type.startsWith("image/");
                      return (
                        <div key={idx} className="relative group border rounded-lg p-1.5 flex items-center gap-2 bg-muted/30 text-xs">
                          {isImage ? (
                            <img src={URL.createObjectURL(file)} alt="" className="h-10 w-10 object-cover rounded" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="max-w-[100px] truncate">{file.name}</span>
                          <button
                            onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                        e.target.value = "";
                      }}
                    />
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Paperclip className="h-3.5 w-3.5" /> Attach
                    </div>
                  </label>
                  <div className="flex-1" />
                  <Button
                    onClick={submitNote}
                    disabled={(!newNote.trim() && commentFiles.length === 0) || uploadingComment}
                    size="sm"
                  >
                    {uploadingComment ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span className="ml-1">Send</span>
                  </Button>
                </div>
              </div>

              {/* Comments list */}
              {adminNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {adminNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      {/* Attachments */}
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {note.attachments.map((url: string, i: number) => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
                            const filename = url.split("/").pop() || "file";
                            return isImage ? (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                              </a>
                            ) : (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1.5 border rounded-md text-xs text-primary hover:bg-muted/50 transition-colors"
                              >
                                <File className="h-3.5 w-3.5" />
                                <span className="max-w-[120px] truncate">{filename}</span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>Staff</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Manual Withdraw Dialog */}
      <Dialog open={manualWithdrawOpen} onOpenChange={setManualWithdrawOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manual Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" value={wdForm.amount} onChange={e => setWdForm({ ...wdForm, amount: e.target.value })} placeholder="500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={wdForm.currency} onValueChange={v => setWdForm({ ...wdForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EUR", "USD", "GBP", "CHF", "AUD", "CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={wdForm.method} onValueChange={v => setWdForm({ ...wdForm, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="bank_wire">Bank Wire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Admin Notes</Label>
              <Textarea value={wdForm.notes} onChange={e => setWdForm({ ...wdForm, notes: e.target.value })} placeholder="Reason for manual withdrawal..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualWithdrawOpen(false)}>Cancel</Button>
            <Button onClick={submitManualWithdraw}>Submit Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Stake Dialog */}
      <Dialog open={!!editStake} onOpenChange={() => setEditStake(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Manage Stake
            </DialogTitle>
          </DialogHeader>
          {editStake && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Plan:</span> {(editStake as any).staking_plans?.name}</p>
                <p><span className="text-muted-foreground">Staked:</span> €{Number(editStake.amount).toLocaleString()}</p>
                <p><span className="text-muted-foreground">APY:</span> {(editStake as any).staking_plans?.apy}%</p>
                <p><span className="text-muted-foreground">Unlocks:</span> {new Date(editStake.unlocks_at).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <Label>Rewards Earned (€)</Label>
                <p className="text-xs text-muted-foreground">Set positive for profit, negative for loss</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-success" onClick={() => setRewardsInput(String(Math.abs(Number(rewardsInput) || 0)))}>
                    <TrendingUp className="h-3.5 w-3.5 mr-1" /> Profit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRewardsInput(String(-Math.abs(Number(rewardsInput) || 0)))}>
                    <TrendingDown className="h-3.5 w-3.5 mr-1" /> Loss
                  </Button>
                </div>
                <Input type="number" value={rewardsInput} onChange={(e) => setRewardsInput(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={claimedInput} onValueChange={setClaimedInput}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Active (not claimed)</SelectItem>
                    <SelectItem value="true">Claimed (return funds + rewards to wallet)</SelectItem>
                  </SelectContent>
                </Select>
                {claimedInput === "true" && !editStake.claimed && (
                  <p className="text-xs text-success">Will credit €{(Number(editStake.amount) + Number(rewardsInput || 0)).toFixed(2)} to user's EUR wallet</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStake(null)}>Cancel</Button>
            <Button onClick={saveStakeOverride}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Report Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto px-2 pb-2" style={{ maxHeight: "calc(90vh - 80px)" }}>
            <iframe
              srcDoc={previewHtml || ""}
              className="w-full border rounded-lg"
              style={{ minHeight: "600px", height: "100%" }}
              title="Report Preview"
              sandbox=""
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* Inline wallet row with editable balance */
const FIAT_LIST = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD"];
const WalletRow = ({ wallet, onUpdate, cryptoPricesEur }: { wallet: any; onUpdate: (id: string, bal: number) => void; cryptoPricesEur: Record<string, number> }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(wallet.balance));
  const isCrypto = !FIAT_LIST.includes(wallet.currency);
  const eurValue = isCrypto && cryptoPricesEur[wallet.currency] ? Number(wallet.balance) * cryptoPricesEur[wallet.currency] : null;

  return (
    <tr className="border-b last:border-0">
      <td className="p-3 font-medium">{wallet.currency}</td>
      <td className="p-3">
        {editing ? (
          <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-32 h-8 text-sm" autoFocus />
        ) : (
          <div>
            <span className="font-semibold">{Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            {eurValue !== null && Number(wallet.balance) > 0 && (
              <span className="text-xs text-muted-foreground ml-2">≈ €{eurValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </div>
        )}
      </td>
      <td className="p-3 text-right">
        {editing ? (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onUpdate(wallet.id, Number(val)); setEditing(false); }}>Save</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setVal(String(wallet.balance)); setEditing(true); }}>Edit</Button>
        )}
      </td>
    </tr>
  );
};

export default AdminUserDetail;
