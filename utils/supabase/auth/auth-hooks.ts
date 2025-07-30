import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { MyCompanionUser } from "../types";
import { authState$, loadUserProfileSafe } from "./auth-state";

// =====================================================
// HOOK D'AUTHENTIFICATION
// =====================================================

// ✅ Hook optimisé
export function useMyCompanionAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<MyCompanionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = authState$.onChange(() => {
      const currentState = {
        session: authState$.session.get(),
        userProfile: authState$.user.get(),
        loading: authState$.loading.get(),
        error: authState$.error.get(),
        isUpdatingProfile: authState$.isUpdatingProfile.get(),
      };

      // Debug plus propre
      console.log("📊 useMyCompanionAuth: authState$ changed.", {
        hasSession: !!currentState.session,
        hasUserProfile: !!currentState.userProfile,
        loading: currentState.loading,
        error: currentState.error,
        isUpdatingProfile: currentState.isUpdatingProfile,
        email: currentState.userProfile?.email || "none",
      });

      setSession(currentState.session);
      setUserProfile(currentState.userProfile);
      setLoading(currentState.loading);
      setError(currentState.error);
      setIsUpdatingProfile(currentState.isUpdatingProfile);
    });

    // Initial values
    const initialState = {
      session: authState$.session.get(),
      userProfile: authState$.user.get(),
      loading: authState$.loading.get(),
      error: authState$.error.get(),
      isUpdatingProfile: authState$.isUpdatingProfile.get(),
    };

    setSession(initialState.session);
    setUserProfile(initialState.userProfile);
    setLoading(initialState.loading);
    setError(initialState.error);
    setIsUpdatingProfile(initialState.isUpdatingProfile);

    return unsubscribe;
  }, []);

  const reloadProfile = async () => {
    if (session?.user && !isUpdatingProfile) {
      console.log("🔄 Manual profile reload requested");
      authState$.loading.set(true);
      await loadUserProfileSafe(session.user.id, "MANUAL_RELOAD", 0);
    }
  };

  return {
    session,
    userProfile,
    loading,
    error,
    isAuthenticated: !!session && !!userProfile,
    isAdmin: userProfile?.user_type === "admin",
    isSenior: userProfile?.user_type === "senior",
    isFamily: userProfile?.user_type === "family",
    isSAAD: ["saad_admin", "saad_worker"].includes(
      userProfile?.user_type || ""
    ),
    reloadProfile,
    isUpdatingProfile,
    // Propriétés admin supplémentaires
    canAccessAllData: userProfile?.user_type === "admin" && userProfile?.is_active === true,
    adminPermissions: {
      canManageUsers: userProfile?.user_type === "admin",
      canViewAllSeniors: userProfile?.user_type === "admin",
      canAccessGlobalStats: userProfile?.user_type === "admin",
      canManageAlerts: userProfile?.user_type === "admin",
    },
  };
}