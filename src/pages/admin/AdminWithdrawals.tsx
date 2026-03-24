import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-yellow-500/10 text-yellow-600",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewItem, setReviewItem] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase
      .from("withdrawals")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    setWithdrawals(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateWithdrawal = async (id: string, status: string) => {
    if (saving) return;
    setSaving(true);
    try {
      if (status === "approved" && reviewItem) {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("id, balance")
          .eq("user_id", reviewItem.user_id)
          .eq("currency", reviewItem.currency)
          .maybeSingle();
        if (wallet) {
          const newBalance = Number(wallet.balance) - Number(reviewItem.amount);
          if (newBalance < 0) {
            toast.error("Insufficient balance");
            return;
          }
          await supabase.from("wallets").update({ balance: newBalance }).eq("id", wallet.id);
        }
      }
      await supabase.from("withdrawals").update({ status, admin_notes: adminNotes, processed_by: user?.id }).eq("id", id);
      toast.success(`Withdrawal ${status}`);
      setReviewItem(null);
      setAdminNotes("");
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Withdrawals</h1>
        <p className="text-muted-foreground text-sm">Review and process client withdrawals</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Destination</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : withdrawals.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No withdrawals yet</td></tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{(w as any).profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{(w as any).profiles?.email}</p>
                      </td>
                      <td className="p-3 font-semibold">{w.currency} {Number(w.amount).toLocaleString()}</td>
                      <td className="p-3 capitalize text-muted-foreground">{w.method}</td>
                      <td className="p-3 text-muted-foreground text-xs max-w-[150px] truncate">{w.destination || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[w.status] ?? "bg-muted"}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {w.status === "pending" ? (
                          <Button size="sm" variant="outline" onClick={() => { setReviewItem(w); setAdminNotes(w.admin_notes ?? ""); }}>
                            Review
                          </Button>
                        ) : (
                          <Badge variant="outline" className="capitalize">{w.status}</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!reviewItem} onOpenChange={() => setReviewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Withdrawal</DialogTitle></DialogHeader>
          {reviewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{(reviewItem as any).profiles?.full_name}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold">{reviewItem.currency} {Number(reviewItem.amount).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Method:</span> <span className="capitalize">{reviewItem.method}</span></div>
                <div><span className="text-muted-foreground">Destination:</span> {reviewItem.destination || "—"}</div>
              </div>
              <div className="space-y-1">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" disabled={saving} onClick={() => updateWithdrawal(reviewItem.id, "rejected")}>{saving ? "Processing..." : "Reject"}</Button>
            <Button disabled={saving} onClick={() => updateWithdrawal(reviewItem.id, "approved")}>{saving ? "Processing..." : "Approve & Debit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;
