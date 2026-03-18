import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, DollarSign, Phone } from "lucide-react";
import StatusChanger from "@/components/admin/StatusChanger";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const AdminDepositors = () => {
  const navigate = useNavigate();
  const [depositors, setDepositors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notesMap, setNotesMap] = useState<Record<string, { content: string; created_at: string; count: number }>>({});

  const fetchData = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_lead", false)
      .order("created_at", { ascending: false });

    if (!profiles || profiles.length === 0) {
      setDepositors([]);
      setLoading(false);
      return;
    }

    const userIds = profiles.map(p => p.id);

    const [{ data: deposits }, { data: wallets }, { data: notes }] = await Promise.all([
      supabase.from("deposits").select("user_id, amount, status").eq("status", "approved").in("user_id", userIds),
      supabase.from("wallets").select("user_id, balance, currency").eq("currency", "EUR").in("user_id", userIds),
      supabase.from("admin_notes").select("user_id, content, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
    ]);

    const depositTotals: Record<string, number> = {};
    const depositCounts: Record<string, number> = {};
    (deposits ?? []).forEach((d: any) => {
      depositTotals[d.user_id] = (depositTotals[d.user_id] ?? 0) + Number(d.amount);
      depositCounts[d.user_id] = (depositCounts[d.user_id] ?? 0) + 1;
    });

    const balanceMap: Record<string, number> = {};
    (wallets ?? []).forEach((w: any) => { balanceMap[w.user_id] = Number(w.balance); });

    const nMap: Record<string, { content: string; created_at: string; count: number }> = {};
    (notes ?? []).forEach((n: any) => {
      if (!nMap[n.user_id]) {
        nMap[n.user_id] = { content: n.content, created_at: n.created_at, count: 0 };
      }
      nMap[n.user_id].count += 1;
    });
    setNotesMap(nMap);

    const enriched = profiles.map(p => ({
      ...p,
      total_deposited: depositTotals[p.id] ?? 0,
      deposit_count: depositCounts[p.id] ?? 0,
      balance: balanceMap[p.id] ?? 0,
    }));

    setDepositors(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`User status updated to ${status}`);
    fetchData();
  };

  const filtered = depositors.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalDeposited = depositors.reduce((sum, d) => sum + d.total_deposited, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Depositors</h1>
        <p className="text-muted-foreground text-sm">
          {depositors.length} depositors · €{totalDeposited.toLocaleString()} total deposited
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Depositors</p>
              <p className="text-xl font-display font-bold">{depositors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-xl font-display font-bold">€{totalDeposited.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Deposit</p>
              <p className="text-xl font-display font-bold">
                €{depositors.length > 0 ? Math.round(totalDeposited / depositors.length).toLocaleString() : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search depositors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Country</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Registration</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Deposits</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Note</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">#Notes</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={12} className="p-8 text-center text-muted-foreground">No depositors found</td></tr>
                ) : (
                  filtered.map(u => {
                    const note = notesMap[u.id];
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <td className="p-3">
                          <p className="font-medium whitespace-nowrap">{u.full_name || "—"}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground whitespace-nowrap">{u.phone || "—"}</span>
                            {u.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${u.phone}`, "_self");
                                }}
                              >
                                <Phone className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.country || "—"}</td>
                        <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(u.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">{u.deposit_count}</Badge>
                        </td>
                        <td className="p-3 font-semibold text-success whitespace-nowrap">€{u.total_deposited.toLocaleString()}</td>
                        <td className="p-3 whitespace-nowrap">€{u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[u.status] ?? "bg-muted text-muted-foreground"}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-muted-foreground max-w-[160px] truncate">
                            {note?.content || "—"}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">{note?.count ?? 0}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(u.id, "active"); }}>Set Active</DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); updateStatus(u.id, "suspended"); }}>Suspend</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDepositors;