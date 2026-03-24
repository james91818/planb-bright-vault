import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Phone, Eye, Mail, KeyRound, Send, Ban, LogIn } from "lucide-react";
import StatusChanger from "@/components/admin/StatusChanger";
import ReorderableHeader from "@/components/admin/ReorderableHeader";
import { useColumnOrder, ColumnDef } from "@/hooks/useColumnOrder";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "display_id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
  { key: "registration", label: "Registration" },
  { key: "affiliate", label: "Affiliate" },
  { key: "funnel", label: "Funnel" },
  { key: "agent", label: "Agent" },
  { key: "status", label: "Status" },
  { key: "last_note", label: "Last Note" },
  { key: "notes_count", label: "#Notes" },
];

interface Props {
  loading: boolean;
  filtered: any[];
  notesMap: Record<string, { content: string; created_at: string; count: number }>;
  agents: any[];
  navigate: (path: string) => void;
  assignAgent: (userId: string, agentId: string | null) => void;
  fetchData: () => void;
  openPasswordDialog: (userId: string, name: string) => void;
  handleSendResetLink: (userId: string, email: string) => void;
  handleLoginAsClient: (userId: string) => void;
  updateStatus: (userId: string, status: string) => void;
  canAssignAgent?: boolean;
}

const LeadsTable = ({
  loading, filtered, notesMap, agents, navigate,
  assignAgent, fetchData, openPasswordDialog,
  handleSendResetLink, handleLoginAsClient, updateStatus,
  canAssignAgent = true,
}: Props) => {
  const { columns, moveColumn } = useColumnOrder("leads_col_order", DEFAULT_COLUMNS);

  const renderCell = (key: string, u: any, note: any): ReactNode => {
    switch (key) {
      case "display_id": return <span className="font-mono text-xs text-muted-foreground">{u.display_id ?? "—"}</span>;
      case "name": return <p className="font-medium whitespace-nowrap">{u.full_name || "—"}</p>;
      case "phone": return (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground whitespace-nowrap">{u.phone || "—"}</span>
          {u.phone && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
              onClick={(e) => { e.stopPropagation(); window.open(`tel:${u.phone}`, "_self"); }}>
              <Phone className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
        </div>
      );
      case "email": return <span className="text-muted-foreground">{u.email || "—"}</span>;
      case "country": return <span className="text-muted-foreground">{u.country || "—"}</span>;
      case "registration": return (
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {new Date(u.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
        </span>
      );
      case "affiliate": return <span className="text-muted-foreground whitespace-nowrap">{u.affiliate || "—"}</span>;
      case "funnel": return <span className="text-muted-foreground whitespace-nowrap">{u.funnel || "—"}</span>;
      case "agent": {
        const agentName = agents.find(a => a.id === u.assigned_agent)?.full_name || agents.find(a => a.id === u.assigned_agent)?.email;
        if (!canAssignAgent) return <span className="text-muted-foreground text-xs whitespace-nowrap">{agentName || "Unassigned"}</span>;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select value={u.assigned_agent || "none"} onValueChange={(v) => assignAgent(u.id, v === "none" ? null : v)}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        );
      }
      case "status": return <StatusChanger userId={u.id} currentStatus={u.status} onStatusChanged={fetchData} />;
      case "last_note": return <p className="text-xs text-muted-foreground max-w-[160px] truncate">{note?.content || "—"}</p>;
      case "notes_count": return <Badge variant="outline" className="text-xs">{note?.count ?? 0}</Badge>;
      default: return null;
    }
  };

  const colCount = columns.length + 1; // +1 for actions

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col, idx) => (
                  <ReorderableHeader key={col.key} column={col} isFirst={idx === 0} isLast={idx === columns.length - 1} onMove={moveColumn} />
                ))}
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={colCount} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={colCount} className="p-8 text-center text-muted-foreground">No leads found</td></tr>
              ) : (
                filtered.map((u) => {
                  const note = notesMap[u.id];
                  return (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                      {columns.map(col => (
                        <td key={col.key} className="p-3">{renderCell(col.key, u, note)}</td>
                      ))}
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> View Profile
                            </DropdownMenuItem>
                            {u.email && (
                              <DropdownMenuItem onClick={() => window.open(`mailto:${u.email}`)}>
                                <Mail className="h-4 w-4 mr-2" /> Send Email
                              </DropdownMenuItem>
                            )}
                            {u.phone && (
                              <DropdownMenuItem onClick={() => window.open(`tel:${u.phone}`, "_self")}>
                                <Phone className="h-4 w-4 mr-2" /> Call
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openPasswordDialog(u.id, u.full_name || u.email)}>
                              <KeyRound className="h-4 w-4 mr-2" /> Change Password
                            </DropdownMenuItem>
                            {u.email && (
                              <DropdownMenuItem onClick={() => handleSendResetLink(u.id, u.email)}>
                                <Send className="h-4 w-4 mr-2" /> Send Reset Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleLoginAsClient(u.id)}>
                              <LogIn className="h-4 w-4 mr-2" /> Login as Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "active")}>
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "suspended")} className="text-destructive">
                              <Ban className="h-4 w-4 mr-2" /> Suspend
                            </DropdownMenuItem>
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
  );
};

export default LeadsTable;
