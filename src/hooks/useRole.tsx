import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth();
  const [isStaff, setIsStaff] = useState(false);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsStaff(false);
      setRoleName(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        const name = (data as any).roles?.name ?? null;
        setRoleName(name);
        // Staff = Admin, Manager, or Agent
        setIsStaff(["Admin", "Manager", "Agent"].includes(name));
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { isStaff, roleName, loading };
}
