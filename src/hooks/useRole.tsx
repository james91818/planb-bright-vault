import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
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
        setIsAdmin(name === "Admin");
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { isAdmin, roleName, loading };
}
