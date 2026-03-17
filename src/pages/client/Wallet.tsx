import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [form, setForm] = useState({ amount: "", currency: "EUR", method: "crypto", wallet_address: "", destination: "" });

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
    setForm({ amount: "", currency: "EUR", method: "crypto", wallet_address: "", destination: "" });
    fetchData();
  };

  const submitWithdrawal = async () => {
    if (!user || !form.amount) return;
    const wallet = wallets.find(w => w.currency === form.currency);
    if (!wallet || Number(wallet.balance) < Number(form.amount)) {
      toast.error("Insufficient balance");
      return;
    }
    await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: Number(form.amount),
      currency: form.currency,
      method: form.method,
      destination: form.destination || null,
    });
    toast.success("Withdrawal request submitted. Awaiting approval.");
    setWithdrawOpen(false);
    setForm({ amount: "", currency: "EUR", method: "crypto", wallet_address: "", destination: "" });
    fetchData();
  };

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Wallet</h1>
          <p className="text-muted-foreground text-sm">Manage your funds</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ amount: "", currency: "EUR", method: "crypto", wallet_address: "", destination: "" }); setDepositOpen(true); }}>
            <ArrowUpRight className="h-4 w-4 mr-1" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => { setForm({ amount: "", currency: "EUR", method: "crypto", wallet_address: "", destination: "" }); setWithdrawOpen(true); }}>
            <ArrowDownRight className="h-4 w-4 mr-1" /> Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          wallets.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium">{w.currency}</p>
                <p className="text-lg font-display font-bold mt-1">
                  {Number(w.balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-display font-bold">€{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </CardContent>
      </Card>

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
                    {["EUR", "USD", "GBP", "CHF", "AUD", "CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EUR", "USD", "GBP", "CHF", "AUD", "CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
            <div className="space-y-1">
              <Label>Destination ({form.method === "crypto" ? "Wallet Address" : "Bank Details"})</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </div>
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
