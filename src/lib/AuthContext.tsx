import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  // Sync admin mode whenever profile loads/changes
  useEffect(() => {
    if (profile?.role === 'admin') {
      setAdminMode(true);
    } else {
      setAdminMode(false);
    }
  }, [profile]);

  const toggleAdminMode = useCallback(() => {
    // Only admins can toggle modes
    if (profile?.role === 'admin') {
      setAdminMode(prev => !prev);
      
      // Log mode switch attempt
      supabase.from("system_logs").insert({
        user_id: user?.id,
        event: 'ADMIN_MODE_TOGGLED',
        status: 'SUCCESS',
        details: { new_mode: !adminMode ? 'admin' : 'user' }
      }).catch(console.error);
    }
  }, [profile, adminMode, user]);

  const fetchProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error && error.code === "PGRST116") {
        // Profile doesn't exist yet, wait and retry because DB trigger might be slightly delayed
        if (retries > 0) {
          console.log(`Profile not found, retrying... (${retries} retries left)`);
          setTimeout(() => fetchProfile(userId, retries - 1), 1000);
          return;
        } else {
          console.error("Profile creation failed or timed out.");
          // We don't artificially create it on frontend anymore, we rely on the DB trigger.
          setProfile(null);
        }
      } else if (error) {
        throw error;
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      if (retries === 0 || profile || true) {
        // Stop loading once we either found it or ran out of retries
        // Wait, if it's a retry, we shouldn't set loading false yet.
        // Let's just rely on the end of the retry chain.
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id).then(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (event === 'SIGNED_IN' && currentUser) {
        setLoading(true);
        await fetchProfile(currentUser.id);
        if (mounted) setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setAdminMode(false);
        setLoading(false);
      }
    });

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
