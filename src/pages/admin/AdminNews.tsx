import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminNews = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", source: "", source_url: "", image_url: "", is_admin_post: true });

  const fetchNews = async () => {
    const { data } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    setNews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const saveNews = async () => {
    if (editItem?.id) {
      await supabase.from("news").update(form).eq("id", editItem.id);
      toast.success("Article updated");
    } else {
      await supabase.from("news").insert(form);
      toast.success("Article published");
    }
    setEditItem(null);
    fetchNews();
  };

  const deleteNews = async (id: string) => {
    await supabase.from("news").delete().eq("id", id);
    toast.success("Article deleted");
    fetchNews();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">News</h1>
          <p className="text-muted-foreground text-sm">Manage market news and announcements</p>
        </div>
        <Button onClick={() => { setForm({ title: "", content: "", source: "", source_url: "", image_url: "", is_admin_post: true }); setEditItem({}); }}>
          <Plus className="h-4 w-4 mr-2" /> New Article
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Title</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Published</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : news.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No news articles</td></tr>
                ) : (
                  news.map((n) => (
                    <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium max-w-[300px] truncate">{n.title}</td>
                      <td className="p-3 text-muted-foreground">{n.source || "PlanB"}</td>
                      <td className="p-3 text-muted-foreground">{n.is_admin_post ? "Admin Post" : "External"}</td>
                      <td className="p-3 text-muted-foreground text-xs">{new Date(n.published_at).toLocaleDateString()}</td>
                      <td className="p-3 text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => { setForm(n); setEditItem(n); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteNews(n.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem?.id ? "Edit Article" : "New Article"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Content</Label>
              <Textarea rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Reuters" />
              </div>
              <div className="space-y-1">
                <Label>Source URL</Label>
                <Input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={saveNews}>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
