import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-yellow-500/10 text-yellow-600",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminDeposits = () => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewDeposit, setReviewDeposit] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({ user_id: "", amount: "", currency: "EUR", method: "manual", notes: "" });

  const fetchDeposits = async () => {
    const { data } = await supabase
      .from("deposits")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });
    setDeposits(data ?? []);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email").order("full_name");
    setUsers(data ?? []);
  };

  useEffect(() => { fetchDeposits(); fetchUsers(); }, []);

  const submitManualDeposit = async () => {
    if (!manualForm.user_id || !manualForm.amount || Number(manualForm.amount) <= 0) {
      toast.error("Select a user and enter a valid amount");
      return;
    }
    const amount = Number(manualForm.amount);

    // Insert deposit as approved
    await supabase.from("deposits").insert({
      user_id: manualForm.user_id,
      amount,
      currency: manualForm.currency,
      method: manualForm.method,
      status: "approved",
      admin_notes: manualForm.notes || "Manual deposit by admin",
      processed_by: user?.id,
    });

    // Credit the user's wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", manualForm.user_id)
      .eq("currency", manualForm.currency)
      .maybeSingle();

    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + amount }).eq("id", wallet.id);
    }

    // Auto-convert to depositor if amount >= 1
    if (amount >= 1) {
      await supabase.from("profiles").update({ is_lead: false }).eq("id", manualForm.user_id);
    }

    toast.success("Manual deposit created and credited");
    setManualOpen(false);
    setManualForm({ user_id: "", amount: "", currency: "EUR", method: "manual", notes: "" });
    fetchDeposits();
  };

  const updateDeposit = async (id: string, status: string) => {
    const updates: any = { status, admin_notes: adminNotes, processed_by: user?.id };
    
    // If approving, also credit the user's wallet
    if (status === "approved" && reviewDeposit) {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", reviewDeposit.user_id)
        .eq("currency", reviewDeposit.currency)
        .maybeSingle();
      
      if (wallet) {
        await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(reviewDeposit.amount) }).eq("id", wallet.id);
      }

      // Update is_lead to false (user is now a depositor)
      await supabase.from("profiles").update({ is_lead: false }).eq("id", reviewDeposit.user_id);
    }

    await supabase.from("deposits").update(updates).eq("id", id);
    toast.success(`Deposit ${status}`);
    setReviewDeposit(null);
    setAdminNotes("");
    fetchDeposits();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Deposits</h1>
        <p className="text-muted-foreground text-sm">Review and manage client deposits</p>
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
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : deposits.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No deposits yet</td></tr>
                ) : (
                  deposits.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{(d as any).profiles?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{(d as any).profiles?.email}</p>
                      </td>
                      <td className="p-3 font-semibold">{d.currency} {Number(d.amount).toLocaleString()}</td>
                      <td className="p-3 capitalize text-muted-foreground">{d.method}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[d.status] ?? "bg-muted"}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        {d.status === "pending" ? (
                          <Button size="sm" variant="outline" onClick={() => { setReviewDeposit(d); setAdminNotes(d.admin_notes ?? ""); }}>
                            Review
                          </Button>
                        ) : (
                          <Badge variant="outline" className="capitalize">{d.status}</Badge>
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

      {/* Review Dialog */}
      <Dialog open={!!reviewDeposit} onOpenChange={() => setReviewDeposit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Deposit</DialogTitle>
          </DialogHeader>
          {reviewDeposit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{(reviewDeposit as any).profiles?.full_name}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="font-bold">{reviewDeposit.currency} {Number(reviewDeposit.amount).toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Method:</span> <span className="capitalize">{reviewDeposit.method}</span></div>
                <div><span className="text-muted-foreground">Date:</span> {new Date(reviewDeposit.created_at).toLocaleString()}</div>
              </div>
              {reviewDeposit.proof_url && (
                <div>
                  <Label>Proof</Label>
                  <a href={reviewDeposit.proof_url} target="_blank" rel="noreferrer" className="text-primary underline text-sm">View proof</a>
                </div>
              )}
              <div className="space-y-1">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => updateDeposit(reviewDeposit.id, "rejected")}>Reject</Button>
            <Button onClick={() => updateDeposit(reviewDeposit.id, "approved")}>Approve & Credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeposits;
