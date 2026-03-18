import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownRight, Landmark, Bitcoin } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FIAT_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD"];
const CRYPTO_CURRENCIES = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "DOT", "LINK", "AVAX"];

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-yellow-500/10 text-yellow-600",
  rejected: "bg-destructive/10 text-destructive",
};

const WalletPage = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", currency: "EUR", method: "bank_wire", wallet_address: "", destination: "", bank_name: "", iban: "", swift: "" });
  const [cryptoPricesEur, setCryptoPricesEur] = useState<Record<string, number>>({});

  const fetchData = async () => {
    if (!user) return;
    const [{ data: w }, { data: d }, { data: wd }] = await Promise.all([
      supabase.from("wallets").select("*").eq("user_id", user.id).order("currency"),
      supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);
    setWallets(w ?? []);
    setDeposits(d ?? []);
    setWithdrawals(wd ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

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

  const submitDeposit = async () => {
    if (!user || !form.amount) return;
    await supabase.from("deposits").insert({
      user_id: user.id,
      amount: Number(form.amount),
      currency: form.currency,
      method: form.method,
      wallet_address: form.wallet_address || null,
    });
    toast.success("Deposit request submitted. Awaiting approval.");
    setDepositOpen(false);
    resetForm();
    fetchData();
  };

  const submitWithdrawal = async () => {
    if (!user || !form.amount) return;
    const isCrypto = form.method === "crypto";
    if (isCrypto && !form.destination.trim()) {
      toast.error("Please enter your wallet address");
      return;
    }
    if (!isCrypto && (!form.bank_name.trim() || !form.iban.trim())) {
      toast.error("Please enter your bank details (bank name and IBAN)");
      return;
    }
    const wallet = wallets.find(w => w.currency === form.currency);
    if (!wallet || Number(wallet.balance) < Number(form.amount)) {
      toast.error("Insufficient balance");
      return;
    }
    const destination = isCrypto
      ? form.destination.trim()
      : `Bank: ${form.bank_name.trim()}, IBAN: ${form.iban.trim()}${form.swift.trim() ? `, SWIFT: ${form.swift.trim()}` : ""}`;

    const { data: insertedWd } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: Number(form.amount),
      currency: form.currency,
      method: form.method,
      destination,
    }).select("id").single();

    // Send notifications to assigned agent, admins, and managers
    try {
      // Get the user's profile to find assigned agent
      const { data: profile } = await supabase
        .from("profiles")
        .select("assigned_agent, full_name, email")
        .eq("id", user.id)
        .single();

      // Get all admin and manager user IDs
      const { data: staffRoles } = await supabase
        .from("roles")
        .select("id, name")
        .in("name", ["Admin", "Manager"]);

      const staffRoleIds = (staffRoles ?? []).map(r => r.id);
      const { data: staffMembers } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role_id", staffRoleIds);

      const recipientIds = new Set<string>();
      // Add assigned agent
      if (profile?.assigned_agent) recipientIds.add(profile.assigned_agent);
      // Add admins and managers
      (staffMembers ?? []).forEach(sm => recipientIds.add(sm.user_id));
      // Don't notify self
      recipientIds.delete(user.id);

      const clientName = profile?.full_name || profile?.email || "A client";
      const notifications = Array.from(recipientIds).map(uid => ({
        user_id: uid,
        title: "New Withdrawal Request",
        message: `${clientName} requested a ${form.currency} ${Number(form.amount).toLocaleString()} withdrawal via ${form.method === "crypto" ? "crypto" : "bank wire"}.`,
        type: "withdrawal",
      }));

      if (notifications.length > 0) {
        await supabase.from("notifications").insert(notifications);
      }
    } catch (e) {
      // Non-critical — don't block the withdrawal
      console.error("Failed to send notifications:", e);
    }

    toast.success("Withdrawal request submitted. Awaiting approval.");
    setWithdrawOpen(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => setForm({ amount: "", currency: "EUR", method: "bank_wire", wallet_address: "", destination: "", bank_name: "", iban: "", swift: "" });

  const fiatWallets = wallets.filter(w => FIAT_CURRENCIES.includes(w.currency));
  const cryptoWallets = wallets.filter(w => CRYPTO_CURRENCIES.includes(w.currency) && Number(w.balance) > 0);
  const totalBalanceEur = wallets.reduce((sum, wallet) => {
    const balance = Number(wallet.balance);
    if (FIAT_CURRENCIES.includes(wallet.currency)) return sum + balance;
    const rate = cryptoPricesEur[wallet.currency];
    return sum + (rate ? balance * rate : balance);
  }, 0);
  const hasCrypto = cryptoWallets.length > 0;

  const allCurrencies = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Wallet</h1>
          <p className="text-muted-foreground text-sm">Manage your funds</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { resetForm(); setDepositOpen(true); }}>
            <ArrowUpRight className="h-4 w-4 mr-1" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => { resetForm(); setWithdrawOpen(true); }}>
            <ArrowDownRight className="h-4 w-4 mr-1" /> Withdraw
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Total Balance */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground font-medium">Total Balance</p>
              <p className="text-3xl font-display font-bold mt-1">
                €{totalBalanceEur.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          {/* Fiat Assets */}
          <div>
            <h2 className="text-base font-display font-semibold flex items-center gap-2 mb-3">
              <Landmark className="h-4 w-4 text-muted-foreground" /> Fiat Assets
            </h2>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {fiatWallets.map((w) => (
                <Card key={w.id} className={Number(w.balance) > 0 ? "border-primary/20" : ""}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground font-medium">{w.currency}</p>
                    <p className="text-lg font-display font-bold mt-1">
                      {Number(w.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {fiatWallets.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground">No fiat wallets found.</p>
              )}
            </div>
          </div>

          {/* Crypto Assets — only show if user holds any */}
          {hasCrypto && (
            <div>
              <h2 className="text-base font-display font-semibold flex items-center gap-2 mb-3">
                <Bitcoin className="h-4 w-4 text-muted-foreground" /> Crypto Assets
              </h2>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {cryptoWallets.map((w) => {
                  const eurValue = cryptoPricesEur[w.currency] ? Number(w.balance) * cryptoPricesEur[w.currency] : null;
                  return (
                    <Card key={w.id} className="border-primary/20">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground font-medium">{w.currency}</p>
                        <p className="text-lg font-display font-bold mt-1">
                          {Number(w.balance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </p>
                        {eurValue !== null && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ≈ €{eurValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction History */}
          <Tabs defaultValue="deposits">
            <TabsList>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>
            <TabsContent value="deposits">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deposits.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No deposits yet</td></tr>
                      ) : deposits.map((d) => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="p-3 font-semibold">{d.currency} {Number(d.amount).toLocaleString()}</td>
                          <td className="p-3 capitalize text-muted-foreground">{d.method}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[d.status] ?? "bg-muted"}`}>{d.status}</span></td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="withdrawals">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No withdrawals yet</td></tr>
                      ) : withdrawals.map((w) => (
                        <tr key={w.id} className="border-b last:border-0">
                          <td className="p-3 font-semibold">{w.currency} {Number(w.amount).toLocaleString()}</td>
                          <td className="p-3 capitalize text-muted-foreground">{w.method}</td>
                          <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[w.status] ?? "bg-muted"}`}>{w.status}</span></td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Deposit Funds</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allCurrencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="bank_wire">Bank Wire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.method === "crypto" && (
              <div className="space-y-1">
                <Label>Wallet Address (sending from)</Label>
                <Input value={form.wallet_address} onChange={(e) => setForm({ ...form, wallet_address: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={submitDeposit}>Submit Deposit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => {
                  const isCrypto = CRYPTO_CURRENCIES.includes(v);
                  setForm({ ...form, currency: v, method: isCrypto ? "crypto" : "bank_wire" });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {wallets.filter(w => Number(w.balance) > 0).map(w => (
                      <SelectItem key={w.currency} value={w.currency}>{w.currency} ({Number(w.balance).toLocaleString()})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CRYPTO_CURRENCIES.includes(form.currency) && <SelectItem value="crypto">Crypto Wallet</SelectItem>}
                    {FIAT_CURRENCIES.includes(form.currency) && <SelectItem value="bank_wire">Bank Wire</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.method === "crypto" ? (
              <div className="space-y-1">
                <Label>Destination Wallet Address *</Label>
                <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. 0x1a2b3c... or bc1q..." />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Bank Name *</Label>
                  <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. Deutsche Bank" />
                </div>
                <div className="space-y-1">
                  <Label>IBAN *</Label>
                  <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} placeholder="e.g. DE89370400440532013000" />
                </div>
                <div className="space-y-1">
                  <Label>SWIFT/BIC (optional)</Label>
                  <Input value={form.swift} onChange={(e) => setForm({ ...form, swift: e.target.value })} placeholder="e.g. DEUTDEDB" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button onClick={submitWithdrawal}>Submit Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
