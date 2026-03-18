import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Trash2, Pencil, CalendarDays, User,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO,
} from "date-fns";

interface Appointment {
  id: string;
  agent_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  color: string;
  created_at: string;
}

const COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
];

const AdminCalendar = () => {
  const { user } = useAuth();
  const { roleName } = useRole();
  const canViewOthers = roleName === "Admin" || roleName === "Manager";
  const [searchParams, setSearchParams] = useSearchParams();
  const autoOpenDone = useRef(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("mine");
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", start_time: "09:00", end_time: "10:00", color: "#3b82f6", client_id: "",
  });

  // Day detail
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [detailDate, setDetailDate] = useState<Date | null>(null);

  // Clients for linking
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgentsAndClients = async () => {
      if (!canViewOthers) return;
      const [{ data: profiles }, { data: urData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id"),
      ]);
      const staffIds = new Set((urData ?? []).map((ur: any) => ur.user_id));
      setAgents((profiles ?? []).filter(p => staffIds.has(p.id)));
      setClients((profiles ?? []).filter(p => !staffIds.has(p.id)));
    };
    fetchAgentsAndClients();
  }, [canViewOthers]);

  // Fetch non-staff clients for agent users
  useEffect(() => {
    if (canViewOthers) return;
    const fetchClients = async () => {
      const [{ data: profiles }, { data: urData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id"),
      ]);
      const staffIds = new Set((urData ?? []).map((ur: any) => ur.user_id));
      setClients((profiles ?? []).filter(p => !staffIds.has(p.id)));
    };
    fetchClients();
  }, [canViewOthers]);

  // Auto-open create dialog when coming from user detail with ?client=...
  useEffect(() => {
    if (autoOpenDone.current) return;
    const clientId = searchParams.get("client");
    const clientName = searchParams.get("clientName");
    if (clientId && user) {
      autoOpenDone.current = true;
      setSelectedDate(new Date());
      setEditing(null);
      setForm({
        title: clientName ? `Meeting with ${clientName}` : "",
        description: "",
        start_time: "09:00",
        end_time: "10:00",
        color: "#3b82f6",
        client_id: clientId,
      });
      setDialogOpen(true);
      // Clean URL params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user]);

  const fetchAppointments = async () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

    let query = supabase
      .from("appointments")
      .select("*")
      .gte("start_at", start.toISOString())
      .lte("start_at", end.toISOString())
      .order("start_at");

    if (selectedAgent !== "all" && selectedAgent !== "mine") {
      query = query.eq("agent_id", selectedAgent);
    } else if (selectedAgent === "mine" || !canViewOthers) {
      query = query.eq("agent_id", user?.id);
    }

    const { data } = await query;
    setAppointments((data ?? []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user, currentMonth, selectedAgent]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(apt => {
      const dayKey = format(parseISO(apt.start_at), "yyyy-MM-dd");
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(apt);
    });
    return map;
  }, [appointments]);

  const openCreateDialog = (date: Date) => {
    setEditing(null);
    setSelectedDate(date);
    setForm({ title: "", description: "", start_time: "09:00", end_time: "10:00", color: "#3b82f6", client_id: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (apt: Appointment) => {
    setEditing(apt);
    setSelectedDate(parseISO(apt.start_at));
    setForm({
      title: apt.title,
      description: apt.description || "",
      start_time: format(parseISO(apt.start_at), "HH:mm"),
      end_time: format(parseISO(apt.end_at), "HH:mm"),
      color: apt.color || "#3b82f6",
      client_id: apt.client_id || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!selectedDate || !user) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const start_at = new Date(`${dateStr}T${form.start_time}:00`).toISOString();
    const end_at = new Date(`${dateStr}T${form.end_time}:00`).toISOString();

    const payload = {
      title: form.title,
      description: form.description || null,
      start_at,
      end_at,
      color: form.color,
      client_id: form.client_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("appointments").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Appointment updated");
    } else {
      const { error } = await supabase.from("appointments").insert({ ...payload, agent_id: user.id });
      if (error) { toast.error(error.message); return; }
      toast.success("Appointment created");
    }
    setDialogOpen(false);
    fetchAppointments();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    toast.success("Appointment deleted");
    setDialogOpen(false);
    setDayDetailOpen(false);
    fetchAppointments();
  };

  const openDayDetail = (date: Date) => {
    setDetailDate(date);
    setDayDetailOpen(true);
  };

  const dayAppointments = detailDate
    ? appointmentsByDay[format(detailDate, "yyyy-MM-dd")] ?? []
    : [];

  const getAgentName = (agentId: string) => {
    if (agentId === user?.id) return "You";
    const agent = agents.find(a => a.id === agentId);
    return agent?.full_name || agent?.email || "Unknown";
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.full_name || client?.email || "Unknown Client";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm">Manage your appointments and schedule</p>
        </div>
        <Button onClick={() => openCreateDialog(new Date())}>
          <Plus className="h-4 w-4 mr-2" /> New Appointment
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
        </div>
        {canViewOthers && (
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My Calendar</SelectItem>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.full_name || a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-b bg-muted/30">
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayApts = appointmentsByDay[dayKey] ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-muted/20 ${
                    !inMonth ? "bg-muted/10 opacity-50" : ""
                  } ${today ? "bg-primary/5" : ""}`}
                  onClick={() => openDayDetail(day)}
                  onDoubleClick={() => openCreateDialog(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      today ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </span>
                    {dayApts.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] h-4 px-1">
                        {dayApts.length}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayApts.slice(0, 3).map(apt => (
                      <div
                        key={apt.id}
                        className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: apt.color || "#3b82f6" }}
                        onClick={(e) => { e.stopPropagation(); openEditDialog(apt); }}
                      >
                        {format(parseISO(apt.start_at), "HH:mm")} {apt.title}
                      </div>
                    ))}
                    {dayApts.length > 3 && (
                      <p className="text-[10px] text-muted-foreground pl-1">+{dayApts.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog open={dayDetailOpen} onOpenChange={setDayDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {detailDate && format(detailDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {dayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No appointments on this day</p>
            ) : (
              dayAppointments.map(apt => (
                <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="w-1 h-full min-h-[40px] rounded-full shrink-0" style={{ backgroundColor: apt.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{apt.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(apt.start_at), "HH:mm")} — {format(parseISO(apt.end_at), "HH:mm")}
                      </span>
                    </div>
                    {apt.description && (
                      <p className="text-xs text-muted-foreground mt-1">{apt.description}</p>
                    )}
                    {apt.client_id && (
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{getClientName(apt.client_id)}</span>
                      </div>
                    )}
                    {canViewOthers && selectedAgent !== "mine" && apt.agent_id !== user?.id && (
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">Agent: {getAgentName(apt.agent_id)}</span>
                    )}
                  </div>
                  {apt.agent_id === user?.id && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDayDetailOpen(false); openEditDialog(apt); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(apt.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => { setDayDetailOpen(false); if (detailDate) openCreateDialog(detailDate); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Appointment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Appointment" : "New Appointment"}
              {selectedDate && ` — ${format(selectedDate, "MMM d, yyyy")}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Call with client" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Notes..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Time</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>End Time</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Client (optional)</Label>
              <Select value={form.client_id || "none"} onValueChange={v => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.full_name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      form.color === c.value ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setForm({ ...form, color: c.value })}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" size="sm" onClick={() => handleDelete(editing.id)} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCalendar;
