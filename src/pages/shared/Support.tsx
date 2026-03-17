import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, MessageSquare } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-600",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

const Support = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  const openTicket = async (ticket: any) => {
    setActiveTicket(ticket);
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", ticket.id).order("created_at");
    setMessages(data ?? []);
  };

  const createTicket = async () => {
    if (!user || !newSubject || !newMessage) return;
    const { data: ticket } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: newSubject,
    }).select().single();

    if (ticket) {
      await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        message: newMessage,
      });
    }
    toast.success("Ticket created");
    setCreateOpen(false);
    setNewSubject("");
    setNewMessage("");
    fetchTickets();
  };

  const sendReply = async () => {
    if (!user || !activeTicket || !replyText) return;
    await supabase.from("ticket_messages").insert({
      ticket_id: activeTicket.id,
      sender_id: user.id,
      message: replyText,
    });
    setReplyText("");
    openTicket(activeTicket);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Support</h1>
          <p className="text-muted-foreground text-sm">Get help from our team</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : tickets.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No tickets yet</CardContent></Card>
          ) : (
            tickets.map((t) => (
              <Card
                key={t.id}
                className={`cursor-pointer transition-colors hover:bg-muted/30 ${activeTicket?.id === t.id ? "ring-1 ring-primary" : ""}`}
                onClick={() => openTicket(t)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm truncate">{t.subject}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColors[t.status] ?? "bg-muted"}`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(t.updated_at).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Conversation */}
        <div className="lg:col-span-2">
          {activeTicket ? (
            <Card className="flex flex-col h-[500px]">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">{activeTicket.subject}</CardTitle>
                  <Badge variant="outline" className="capitalize">{activeTicket.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      m.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p>{m.message}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="border-t p-3 flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                />
                <Button onClick={sendReply}>Send</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Select a ticket to view the conversation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="What do you need help with?" />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea rows={4} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Describe your issue..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
