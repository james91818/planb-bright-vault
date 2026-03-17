import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: { id: string; email: string | null; full_name: string | null; avatar_url: string | null } | null;
  role: string | null;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .eq("id", userId)
      .single();
    setProfile(profileData);

    // Fetch user role
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", userId);

    if (userRoles && userRoles.length > 0) {
      const roleName = (userRoles[0].roles as any)?.name ?? null;
      setRole(roleName);

      // Fetch permissions for user's role(s)
      const roleIds = userRoles.map((ur) => ur.role_id);
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permission_id, permissions(key)")
        .in("role_id", roleIds);

      if (rolePerms) {
        const permKeys = rolePerms.map((rp) => (rp.permissions as any)?.key).filter(Boolean);
        setPermissions([...new Set(permKeys)]);
      }
    } else {
      setRole(null);
      setPermissions([]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setPermissions([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (key: string) => permissions.includes(key);

  return (
    <AuthContext.Provider value={{ user, session, profile, role, permissions, loading, signIn, signUp, signOut, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
