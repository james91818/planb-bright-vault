import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Star, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const Watchlist = () => {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: wl }, { data: a }] = await Promise.all([
      supabase.from("watchlist").select("*, assets(id, symbol, name, type, icon_url)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("assets").select("*").eq("enabled", true).order("symbol"),
    ]);
    setWatchlist(wl ?? []);
    setAssets(a ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addToWatchlist = async () => {
    if (!user || !selectedAsset) return;
    await supabase.from("watchlist").insert({ user_id: user.id, asset_id: selectedAsset });
    toast.success("Added to watchlist");
    setAddOpen(false);
    setSelectedAsset("");
    fetchData();
  };

  const remove = async (id: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    toast.success("Removed from watchlist");
    fetchData();
  };

  const watchedIds = watchlist.map((w) => w.asset_id);
  const availableAssets = assets.filter((a) => !watchedIds.includes(a.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Watchlist</h1>
          <p className="text-muted-foreground text-sm">Track your favourite assets</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Asset</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : watchlist.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Your watchlist is empty. Add assets to track them here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((w) => {
            const asset = (w as any).assets;
            return (
              <Card key={w.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {asset?.icon_url ? (
                      <img src={asset.icon_url} alt={asset.symbol} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {asset?.symbol?.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{asset?.symbol}</p>
                      <p className="text-xs text-muted-foreground">{asset?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs">{asset?.type}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(w.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add to Watchlist</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger><SelectValue placeholder="Select an asset" /></SelectTrigger>
              <SelectContent>
                {availableAssets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.symbol} — {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addToWatchlist}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Watchlist;
