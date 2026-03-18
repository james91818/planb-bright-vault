import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If session-only flag is set, clear session on page load if browser was closed
    const sessionOnly = localStorage.getItem("planb-session-only");
    const tabActive = sessionStorage.getItem("planb-tab-active");

    if (sessionOnly === "true" && !tabActive) {
      // Browser was closed and reopened — sign out
      supabase.auth.signOut().then(() => {
        localStorage.removeItem("planb-session-only");
        setLoading(false);
      });
    } else if (sessionOnly === "true") {
      // Tab is still active, keep session
    }

    // Mark tab as active
    sessionStorage.setItem("planb-tab-active", "true");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
}
