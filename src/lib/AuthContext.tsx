import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  adminMode: boolean;
  toggleAdminMode: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  adminMode: false,
  toggleAdminMode: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);

  // Track whether initial session has been resolved to prevent double-fetch
  const initializedRef = useRef(false);

  // Sync adminMode whenever profile changes
  useEffect(() => {
    setAdminMode(profile?.role === "admin");
  }, [profile]);

  const toggleAdminMode = useCallback(() => {
    if (profile?.role === "admin") {
      setAdminMode((prev) => !prev);
      // Fire-and-forget audit log
      supabase.from("system_logs").insert({
        user_id: profile.id,
        event: "ADMIN_MODE_TOGGLED",
        status: "SUCCESS",
        details: {},
      }).catch(() => {});
    }
  }, [profile]);

  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code === "PGRST116") {
        // Profile not yet created by trigger — retry with 1s backoff
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 1000));
          return fetchProfile(userId, retries - 1);
        }
        console.warn("Profile not found after retries.");
        setProfile(null);
      } else if (error) {
        console.error("Profile fetch error:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Unexpected profile fetch error:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Session init error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          initializedRef.current = true;
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // Skip events that fire during the initial session load
        if (!initializedRef.current) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (event === "SIGNED_IN" && currentUser) {
          setLoading(true);
          try {
            await fetchProfile(currentUser.id);
          } finally {
            if (mounted) setLoading(false);
          }
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          setAdminMode(false);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, adminMode, toggleAdminMode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
