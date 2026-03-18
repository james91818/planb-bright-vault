import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface StatusChangerProps {
  userId: string;
  currentStatus: string;
  onStatusChanged: () => void;
}

interface LeadStatus {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

// Shared cache for statuses
let cachedStatuses: LeadStatus[] | null = null;
let cachePromise: Promise<LeadStatus[]> | null = null;

const fetchStatuses = async (): Promise<LeadStatus[]> => {
  if (cachedStatuses) return cachedStatuses;
  if (cachePromise) return cachePromise;
  cachePromise = (async () => {
    const { data } = await supabase
      .from("lead_statuses")
      .select("*")
      .order("sort_order");
    cachedStatuses = (data as LeadStatus[]) ?? [];
    return cachedStatuses;
  })();
  return cachePromise;
};

export const invalidateStatusCache = () => {
  cachedStatuses = null;
  cachePromise = null;
};

export const getStatusColor = (status: string, statuses: LeadStatus[]): string => {
  const found = statuses.find(s => s.name === status);
  return found?.color ?? "bg-muted text-muted-foreground";
};

export const useLeadStatuses = () => {
  const [statuses, setStatuses] = useState<LeadStatus[]>(cachedStatuses ?? []);

  useEffect(() => {
    fetchStatuses().then(setStatuses);
  }, []);

  return statuses;
};

const StatusChanger = ({ userId, currentStatus, onStatusChanged }: StatusChangerProps) => {
  const statuses = useLeadStatuses();

  const handleChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    await supabase.from("profiles").update({ status: newStatus }).eq("id", userId);
    toast.success(`Status changed to "${newStatus}"`);
    onStatusChanged();
  };

  const currentColor = getStatusColor(currentStatus, statuses);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity ${currentColor}`}
          onClick={(e) => e.stopPropagation()}
        >
          {currentStatus}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => handleChange(s.name)}
            className="flex items-center gap-2"
          >
            <span className={`h-2 w-2 rounded-full ${s.color.split(" ")[0]}`} />
            <span className={currentStatus === s.name ? "font-semibold" : ""}>{s.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusChanger;
