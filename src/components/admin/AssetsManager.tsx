import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AssetsManager = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAsset, setEditAsset] = useState<any>(null);
  const [form, setForm] = useState({ name: "", symbol: "", type: "crypto", leverage_max: 100, icon_url: "" });

  const fetchAssets = async () => {
    const { data } = await supabase.from("assets").select("*").order("type").order("symbol");
    setAssets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("assets").update({ enabled }).eq("id", id);
    toast.success(enabled ? "Asset enabled" : "Asset disabled");
    fetchAssets();
  };

  const saveAsset = async () => {
    if (editAsset?.id) {
      await supabase.from("assets").update(form).eq("id", editAsset.id);
      toast.success("Asset updated");
    } else {
      await supabase.from("assets").insert(form);
      toast.success("Asset created");
    }
    setEditAsset(null);
    fetchAssets();
  };

  const openCreate = () => {
    setForm({ name: "", symbol: "", type: "crypto", leverage_max: 100, icon_url: "" });
    setEditAsset({});
  };

  const openEdit = (a: any) => {
    setForm({ name: a.name, symbol: a.symbol, type: a.type, leverage_max: a.leverage_max, icon_url: a.icon_url ?? "" });
    setEditAsset(a);
  };

  const assetTypes = [...new Set(assets.map(a => a.type))].sort();

  if (loading) return <div className="flex items-center justify-center h-32"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const renderTable = (filtered: any[]) => (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Symbol</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Max Leverage</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Enabled</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No assets in this category</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3 font-semibold">{a.symbol}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3">{a.leverage_max}×</td>
                <td className="p-3">
                  <Switch checked={a.enabled} onCheckedChange={(val) => toggleEnabled(a.id, val)} />
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => openEdit(a)}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-base font-display">Tradeable Assets</CardTitle>
          <CardDescription>{assets.length} assets configured</CardDescription>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Asset</Button>
      </div>

      <Tabs defaultValue={assetTypes[0] ?? "crypto"}>
        <TabsList>
          {assetTypes.map(t => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
        {assetTypes.map(t => (
          <TabsContent key={t} value={t}>
            {renderTable(assets.filter(a => a.type === t))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editAsset} onOpenChange={() => setEditAsset(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editAsset?.id ? "Edit Asset" : "Add Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Symbol</Label>
                <Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="BTC" />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="index">Index</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bitcoin" />
            </div>
            <div className="space-y-1">
              <Label>Max Leverage</Label>
              <Input type="number" value={form.leverage_max} onChange={(e) => setForm({ ...form, leverage_max: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label>Icon URL</Label>
              <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAsset(null)}>Cancel</Button>
            <Button onClick={saveAsset}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetsManager;
