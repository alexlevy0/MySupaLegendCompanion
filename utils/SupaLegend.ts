import { observable } from "@legendapp/state";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import { configureSynced } from "@legendapp/state/sync";
import { syncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import { createClient, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { v4 as uuidv4 } from "uuid";
import "whatwg-fetch";

import { Database } from "@/utils/database.types";
import { Storage } from "@/utils/storage";

// =====================================================
// CONFIGURATION SUPABASE CLIENT
// =====================================================

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "http://localhost:54321",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
  {
    auth: {
      // Utiliser notre storage universel
      ...(Platform.OS !== "web" ? { storage: Storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Auto-refresh pour mobile
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

const generateId = () => uuidv4();

// Configuration de base pour toutes les tables
const customSynced = configureSynced(syncedSupabase, {
  persist: {
    plugin: observablePersistAsyncStorage({
      AsyncStorage: Storage,
    }),
  },
  generateId,
  supabase,
  changesSince: "last-sync",
  fieldCreatedAt: "created_at",
  fieldUpdatedAt: "updated_at",
  fieldDeleted: "deleted",
});

// =====================================================
// TYPES D'AUTHENTIFICATION
// =====================================================

export type UserType =
  Database["public"]["Tables"]["users"]["Row"]["user_type"];
export type MyCompanionUser = Database["public"]["Tables"]["users"]["Row"];
export type Senior = Database["public"]["Tables"]["seniors"]["Row"];
export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];

// =====================================================
// OBSERVABLES MYCOMPANION
// =====================================================

// 👥 USERS
export const users$ = observable(
  customSynced({
    supabase,
    collection: "users",
    select: (from) =>
      from.select(
        "id,counter,email,user_type,first_name,last_name,phone,created_at,updated_at,deleted,is_active"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "users",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// 👴 SENIORS
export const seniors$ = observable(
  customSynced({
    supabase,
    collection: "seniors",
    select: (from) =>
      from.select(
        "id,counter,user_id,birth_date,preferred_call_time,call_frequency,personality_profile,medical_context,interests,communication_preferences,emergency_contact,address,created_at,updated_at,deleted"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "seniors",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// 📞 CALLS
export const calls$ = observable(
  customSynced({
    supabase,
    collection: "calls",
    select: (from) =>
      from.select(
        "id,counter,senior_id,call_type,status,started_at,ended_at,duration_seconds,quality_score,conversation_summary,mood_detected,created_at,updated_at,deleted"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "calls",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// 🚨 ALERTS
export const alerts$ = observable(
  customSynced({
    supabase,
    collection: "alerts",
    select: (from) =>
      from.select(
        "id,counter,senior_id,call_id,alert_type,severity,title,description,detected_indicators,confidence_score,status,acknowledged_by,acknowledged_at,resolved_at,resolution_notes,created_at,updated_at,deleted"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "alerts",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// 📨 FAMILY_REPORTS
export const familyReports$ = observable(
  customSynced({
    supabase,
    collection: "family_reports",
    select: (from) =>
      from.select(
        "id,counter,senior_id,family_member_id,report_type,report_period_start,report_period_end,content,delivery_method,sent_at,opened_at,status,created_at,updated_at,deleted"
      ),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "family_reports",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// Garder les todos pour les tests
export const todos$ = observable(
  customSynced({
    supabase,
    collection: "todos",
    select: (from) =>
      from.select("id,counter,text,done,created_at,updated_at,deleted"),
    actions: ["read", "create", "update", "delete"],
    realtime: true,
    persist: {
      name: "todos",
      retrySync: true,
    },
    retry: {
      infinite: true,
    },
  })
);

// =====================================================
// GESTION D'ÉTAT D'AUTHENTIFICATION OPTIMISÉE
// =====================================================

// Observable pour l'état d'authentification global
export const authState$ = observable({
  session: null as Session | null,
  user: null as MyCompanionUser | null,
  loading: true,
  isAuthenticated: false,
  error: null as string | null,
  isUpdatingProfile: false,
  // Protection anti-doublon
  isLoadingProfile: false,
  profileLoadPromise: null as Promise<void> | null,
  hasInitialized: false,
});

// ✅ Fonction ultra-sécurisée contre les doublons
async function loadUserProfileSafe(
  userId: string,
  source: string,
  retryCount = 0
) {
  // Si déjà en cours de chargement, attendre la promesse existante
  if (
    authState$.isLoadingProfile.get() &&
    authState$.profileLoadPromise.get()
  ) {
    console.log(`[${source}] Profile loading already in progress, waiting...`);
    return authState$.profileLoadPromise.get();
  }

  console.log(`[${source}] Starting profile load for ${userId}`);

  // Marquer comme en cours de chargement
  authState$.isLoadingProfile.set(true);

  // Créer la promesse de chargement
  const loadPromise = loadUserProfileInternal(userId, source, retryCount);
  authState$.profileLoadPromise.set(loadPromise);

  try {
    await loadPromise;
    console.log(`[${source}] Profile load completed successfully`);
  } catch (error) {
    console.error(`[${source}] Profile load failed:`, error);
    throw error;
  } finally {
    authState$.isLoadingProfile.set(false);
    authState$.profileLoadPromise.set(null);
  }
}

// Fonction interne de chargement
async function loadUserProfileInternal(
  userId: string,
  source: string,
  retryCount = 0
) {
  const maxRetries = 3;
  try {
    console.log(
      `[${source}] Loading user profile for ${userId} (attempt ${
        retryCount + 1
      })`
    );

    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`;
    const headers = {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
      Accept: "application/json",
    };

    const res = await fetch(url, { headers });
    const userData = await res.json();

    console.log(`[${source}] Raw query result:`, { userData });

    if (!userData || userData.length === 0) {
      if (retryCount < maxRetries) {
        console.log(
          `[${source}] User not found, attempting to create profile...`
        );
        await createMissingUserProfile(userId);
        return loadUserProfileInternal(userId, source, retryCount + 1);
      }
      throw new Error("User profile not found after creation attempts");
    }

    console.log(
      `[${source}] ✅ User profile loaded successfully:`,
      userData[0].email,
      userData[0].user_type
    );

    authState$.user.set(userData[0]);
    authState$.isAuthenticated.set(true);
    authState$.error.set(null);
    authState$.loading.set(false);
  } catch (error) {
    console.error(`[${source}] Error loading user profile:`, error);

    if (retryCount < maxRetries) {
      console.log(
        `[${source}] Retrying user profile load (${
          retryCount + 1
        }/${maxRetries})`
      );
      setTimeout(
        () => loadUserProfileInternal(userId, source, retryCount + 1),
        1000
      );
      return;
    }

    // Après tous les retries, définir l'état d'erreur
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.error.set(
      `Failed to load user profile: ${error.message || error}`
    );
    authState$.loading.set(false);
  }
}

// Créer un profil utilisateur manquant
async function createMissingUserProfile(userId: string) {
  try {
    // Récupérer les infos de auth.users
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Cannot get auth user data");
    }

    // Données par défaut plus robustes
    const userData = {
      id: userId,
      email: user.email!,
      user_type: (user.user_metadata?.user_type || "family") as UserType,
      first_name:
        user.user_metadata?.first_name || user.email?.split("@")[0] || "",
      last_name: user.user_metadata?.last_name || "",
      is_active: true,
    };

    console.log("Creating missing user profile:", userData);

    // Utiliser UPSERT au lieu d'INSERT pour éviter les doublons
    const { data, error: insertError } = await supabase
      .from("users")
      .upsert(userData, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create user profile:", insertError);

      // Si c'est toujours un problème de contrainte unique, essayer de mettre à jour
      if (insertError.code === "23505") {
        console.log("Trying to update existing profile...");
        const { error: updateError } = await supabase
          .from("users")
          .update({
            user_type: userData.user_type,
            first_name: userData.first_name,
            last_name: userData.last_name,
            is_active: true,
          })
          .eq("email", userData.email);

        if (updateError) {
          throw updateError;
        }
        console.log("✅ User profile updated successfully");
        return;
      }

      throw insertError;
    }

    console.log("✅ User profile created successfully:", data);
  } catch (error) {
    console.error("Error creating missing user profile:", error);
    throw error;
  }
}

// ✅ Initialisation optimisée
async function initializeAuth() {
  try {
    console.log("🚀 Initializing authentication...");

    // Timeout de sécurité
    const loadingTimeout = setTimeout(() => {
      console.warn("⚠️ Auth loading timeout - forcing loading to false");
      authState$.loading.set(false);
      authState$.error.set("Authentication timeout");
    }, 10000);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Session error:", error);
      authState$.error.set(error.message);
      authState$.loading.set(false);
      clearTimeout(loadingTimeout);
      return;
    }

    authState$.session.set(session);

    if (session?.user) {
      console.log("📧 Session found for:", session.user.email);
      console.log("⏳ Waiting for onAuthStateChange to load profile...");
    } else {
      console.log("🚫 No session found");
      authState$.loading.set(false);
    }

    // Marquer comme initialisé
    authState$.hasInitialized.set(true);
    clearTimeout(loadingTimeout);
  } catch (error) {
    console.error("❌ Auth initialization error:", error);
    authState$.error.set("Failed to initialize authentication");
    authState$.loading.set(false);
    authState$.hasInitialized.set(true);
  }
}

// ✅ Listener ultra-optimisé
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(
    `🔄 Auth state changed. Event: ${event}, Session user: ${
      session?.user?.email || "none"
    }`
  );

  authState$.session.set(session);

  if (session?.user) {
    // ✅ Charger le profil SEULEMENT dans certains cas précis
    const shouldLoadProfile =
      event === "SIGNED_IN" ||
      (event === "INITIAL_SESSION" && !authState$.user.get());

    if (shouldLoadProfile) {
      console.log(`📥 Loading user profile for event: ${event}`);
      authState$.loading.set(true);

      try {
        await loadUserProfileSafe(session.user.id, `AUTH_${event}`, 0);
      } catch (err) {
        console.error(`❌ Error in loadUserProfile for ${event}:`, err);
        authState$.user.set(null);
        authState$.isAuthenticated.set(false);
        authState$.error.set("Failed to load user profile");
        authState$.loading.set(false);
      }
    } else {
      console.log(`⏭️ Skipping profile load for event: ${event}`);
      // Si on a déjà un utilisateur, s'assurer que loading=false
      if (authState$.user.get()) {
        authState$.loading.set(false);
      }
    }
  } else {
    console.log("🧹 No session user. Resetting auth state.");
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.loading.set(false);
    authState$.error.set(null);
  }
});

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
  };
}

// =====================================================
// FONCTIONS D'AUTHENTIFICATION
// =====================================================

// Fonction pour créer un utilisateur complet (auth + business)
export async function signUpMyCompanionUser(
  email: string,
  password: string,
  userData: {
    user_type: UserType;
    first_name: string;
    last_name: string;
    phone?: string;
  }
) {
  try {
    console.log("Creating new user:", email, userData.user_type);

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // 2. Créer le profil business (sera fait automatiquement par le trigger)
    if (authData.session) {
      const { error: userError } = await supabase.from("users").upsert({
        id: authData.user.id,
        email: authData.user.email!,
        user_type: userData.user_type,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        is_active: true,
      });

      if (userError) console.warn("User profile creation warning:", userError);
    }

    console.log("User created successfully");
    return {
      authUser: authData.user,
      session: authData.session,
    };
  } catch (error) {
    console.error("SignUp Error:", error);
    throw error;
  }
}

// Fonction pour se connecter
export async function signInWithEmail(email: string, password: string) {
  try {
    console.log("Signing in with email:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }

    console.log("Sign in successful");
    return data;
  } catch (error) {
    console.error("SignIn Error:", error);
    throw error;
  }
}

// Fonction pour se déconnecter
export async function signOut() {
  try {
    console.log("Signing out...");

    const {
      data: { session },
      error: getSessionError,
    } = await supabase.auth.getSession();

    if (getSessionError) {
      console.warn(
        "Erreur lors de la récupération de la session :",
        getSessionError
      );
    }

    if (session) {
      console.log("Session détectée :", session);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        if (
          signOutError.name === "AuthSessionMissingError" ||
          (signOutError.status === 403 &&
            signOutError.message?.includes("session_not_found"))
        ) {
          console.warn("Session déjà expirée ou inexistante.");
        } else {
          throw signOutError;
        }
      }
    } else {
      console.warn(
        "Aucune session active. L'utilisateur est probablement déjà déconnecté."
      );
    }

    console.log("Déconnexion réussie ou session déjà absente.");

    if (Platform.OS === "web") {
      localStorage.clear();
    } else {
      Storage.clear();
    }

    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.loading.set(false);
    authState$.error.set(null);
    authState$.session.set(null);

    if (Platform.OS === "web" && window.location.pathname !== "/") {
      console.log("signOut: Redirecting to / due to sign out.");
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
  }
}

// Fonction pour récupérer le profil de l'utilisateur connecté
export async function getCurrentUserProfile(): Promise<MyCompanionUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Get user profile error:", error);
    return null;
  }
}

// =====================================================
// FONCTIONS DE GESTION DU PROFIL
// =====================================================

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: UserType;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeData {
  newEmail: string;
  password: string;
}

// Mettre à jour le profil utilisateur
export async function updateUserProfile(updates: ProfileUpdateData) {
  try {
    authState$.isUpdatingProfile.set(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Update database
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;

    // ✅ Mise à jour immédiate de l'état local
    authState$.user.set(data);

    // ✅ Auth metadata en async (ne pas attendre)
    if (updates.first_name || updates.last_name || updates.user_type) {
      supabase.auth
        .updateUser({
          data: {
            first_name: updates.first_name,
            last_name: updates.last_name,
            user_type: updates.user_type,
          },
        })
        .catch(console.warn);
    }

    return data;
  } catch (error) {
    console.error("❌ Profile update failed:", error);
    throw error;
  } finally {
    setTimeout(() => {
      authState$.isUpdatingProfile.set(false);
    }, 2000);
  }
}

// Changer le mot de passe
export async function changePassword(passwordData: PasswordChangeData) {
  try {
    console.log("Changing password...");

    const currentUser = authState$.user.get();
    if (!currentUser?.email) throw new Error("No current user email");

    // Test du mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: passwordData.currentPassword,
    });

    if (signInError) {
      throw new Error("Current password is incorrect");
    }

    // Changer le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) throw error;

    console.log("✅ Password changed successfully");
    return true;
  } catch (error) {
    console.error("❌ Password change failed:", error);
    throw error;
  }
}

// Changer l'email
export async function changeEmail(emailData: EmailChangeData) {
  try {
    console.log("Changing email to:", emailData.newEmail);

    const currentUser = authState$.user.get();
    if (!currentUser?.email) throw new Error("No current user email");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: emailData.password,
    });

    if (signInError) {
      throw new Error("Password is incorrect");
    }

    // Changer l'email (nécessite confirmation)
    const { error } = await supabase.auth.updateUser({
      email: emailData.newEmail,
    });

    if (error) throw error;

    console.log(
      "✅ Email change initiated - check your inbox for confirmation"
    );
    return true;
  } catch (error) {
    console.error("❌ Email change failed:", error);
    throw error;
  }
}

// Reset password (envoi d'email)
export async function sendPasswordResetEmail(email: string) {
  try {
    console.log("Sending password reset email to:", email);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${
        process.env.EXPO_PUBLIC_SITE_URL || "http://localhost:3000"
      }/auth/reset-password`,
    });

    if (error) throw error;

    console.log("✅ Password reset email sent");
    return true;
  } catch (error) {
    console.error("❌ Password reset email failed:", error);
    throw error;
  }
}

// Supprimer le compte utilisateur
export async function deleteUserAccount(password: string) {
  try {
    console.log("Deleting user account...");

    const currentUser = authState$.user.get();
    if (!currentUser?.email) throw new Error("No current user email");

    // Vérifier le mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: password,
    });

    if (signInError) {
      throw new Error("Password is incorrect");
    }

    // Marquer l'utilisateur comme supprimé dans public.users
    const { error: updateError } = await supabase
      .from("users")
      .update({
        deleted: true,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.id);

    if (updateError) throw updateError;

    await signOut();

    console.log("✅ Account deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Account deletion failed:", error);
    throw error;
  }
}

// Récupérer les statistiques du profil
export async function getUserStats(userId: string) {
  try {
    const [callsCount, alertsCount] = await Promise.all([
      supabase
        .from("calls")
        .select("id", { count: "exact" })
        .eq("senior_id", userId),
      supabase
        .from("alerts")
        .select("id", { count: "exact" })
        .eq("senior_id", userId),
    ]);

    return {
      totalCalls: callsCount.count || 0,
      totalAlerts: alertsCount.count || 0,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      totalCalls: 0,
      totalAlerts: 0,
    };
  }
}

// =====================================================
// HELPER FUNCTIONS POUR LES DONNÉES
// =====================================================

// Fonctions todos (pour les tests)
export function addTodo(text: string) {
  const id = generateId();
  todos$[id].assign({
    id,
    text,
  });
}

export function toggleDone(id: string) {
  todos$[id].done.set((prev) => !prev);
}

// Fonctions MyCompanion
// export function addSenior(
//   seniorData: Partial<Database["public"]["Tables"]["seniors"]["Insert"]>
// ) {
//   const id = generateId();
//   seniors$[id].assign({
//     id,
//     ...seniorData,
//   });
// }

export function createAlert(
  alertData: Partial<Database["public"]["Tables"]["alerts"]["Insert"]>
) {
  const id = generateId();
  alerts$[id].assign({
    id,
    status: "new",
    ...alertData,
  });
}

export function acknowledgeAlert(alertId: string, userId: string) {
  alerts$[alertId].assign({
    status: "acknowledged",
    acknowledged_by: userId,
    acknowledged_at: new Date().toISOString(),
  });
}

// Initialiser l'authentification
initializeAuth();

// =====================================================
// FONCTIONS CORRIGÉES POUR LA GESTION DES SENIORS
// À remplacer dans votre SupaLegend.ts
// =====================================================

// Types mis à jour pour correspondre au schéma
export interface SeniorCreateData {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string | null;
  preferred_call_time?: string;
  call_frequency?: number;
  emergency_contact?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
  };
  personality_profile?: any;
  medical_context?: any;
  interests?: any;
  communication_preferences?: any;
}

export interface FamilyRelationData {
  user_id: string;
  senior_id: string;
  relationship: string;
  is_primary_contact?: boolean;
  notification_preferences?: {
    dailyReports?: boolean;
    emergencyAlerts?: boolean;
    weeklyReports?: boolean;
    smsAlerts?: boolean;
  };
  access_level?: "minimal" | "standard" | "full";
}

// ✅ Fonction corrigée pour créer un senior
export async function addSenior(seniorData: SeniorCreateData): Promise<string> {
  try {
    console.log(
      "🧓 Creating senior profile...",
      seniorData.first_name,
      seniorData.last_name
    );

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Nettoyer le numéro de téléphone (supprimer les espaces, points, tirets)
    const cleanPhone = seniorData.phone.replace(/[\s\.\-]/g, "");

    // Vérifier le format du téléphone français
    const phoneRegex = /^(\+33|0)[1-9][0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      throw new Error(
        "Format de téléphone invalide. Utilisez un numéro français valide."
      );
    }

    // Vérifier si un senior avec ce téléphone existe déjà
    const { data: existingSenior, error: checkError } = await supabase
      .from("seniors")
      .select("id, first_name, last_name")
      .eq("phone", cleanPhone)
      .eq("deleted", false)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingSenior) {
      throw new Error(
        `Un senior avec ce numéro existe déjà : ${existingSenior.first_name} ${existingSenior.last_name}`
      );
    }

    // Préparer les données pour l'insertion
    const insertData = {
      // Informations personnelles (nouvelles colonnes)
      first_name: seniorData.first_name.trim(),
      last_name: seniorData.last_name.trim(),
      phone: cleanPhone,

      // Informations existantes
      user_id: null, // Le senior n'a pas encore de compte utilisateur
      birth_date: seniorData.birth_date || null,
      preferred_call_time: seniorData.preferred_call_time || "09:00:00", // Format time
      call_frequency: seniorData.call_frequency || 1,
      emergency_contact: seniorData.emergency_contact || cleanPhone,
      address: seniorData.address ? JSON.stringify(seniorData.address) : null,
      personality_profile: seniorData.personality_profile
        ? JSON.stringify(seniorData.personality_profile)
        : null,
      medical_context: seniorData.medical_context
        ? JSON.stringify(seniorData.medical_context)
        : null,
      interests: seniorData.interests
        ? JSON.stringify(seniorData.interests)
        : null,
      communication_preferences: seniorData.communication_preferences
        ? JSON.stringify(seniorData.communication_preferences)
        : null,
    };

    console.log("📤 Inserting senior data:", insertData);

    // Créer le profil senior dans la base de données
    const { data: senior, error: insertError } = await supabase
      .from("seniors")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Error creating senior:", insertError);

      // Messages d'erreur plus explicites
      if (
        insertError.code === "23505" &&
        insertError.message.includes("phone")
      ) {
        throw new Error(
          "Ce numéro de téléphone est déjà utilisé par un autre senior."
        );
      }

      throw new Error(
        `Erreur lors de la création du profil : ${insertError.message}`
      );
    }

    console.log("✅ Senior profile created successfully:", senior.id);

    // Mettre à jour l'observable local pour Legend-State
    seniors$[senior.id].assign({
      id: senior.id,
      user_id: null,
      first_name: seniorData.first_name,
      last_name: seniorData.last_name,
      phone: cleanPhone,
      birth_date: seniorData.birth_date,
      preferred_call_time: seniorData.preferred_call_time || "09:00:00",
      call_frequency: seniorData.call_frequency || 1,
      personality_profile: seniorData.personality_profile || null,
      medical_context: seniorData.medical_context || null,
      interests: seniorData.interests || null,
      communication_preferences: seniorData.communication_preferences || null,
      emergency_contact: seniorData.emergency_contact || cleanPhone,
      address: seniorData.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
    });

    return senior.id;
  } catch (error) {
    console.error("❌ Failed to create senior:", error);
    throw error;
  }
}

// ✅ Fonction corrigée pour créer une relation familiale
export async function createFamilyRelation(
  relationData: FamilyRelationData
): Promise<string> {
  try {
    console.log("👨‍👩‍👧‍👦 Creating family relation...", relationData);

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Vérifier si la relation existe déjà
    const { data: existingRelation, error: checkError } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", relationData.user_id)
      .eq("senior_id", relationData.senior_id)
      .eq("deleted", false)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingRelation) {
      throw new Error("Cette relation familiale existe déjà");
    }

    // Préparer les données de notification par défaut
    const defaultNotifications = {
      dailyReports: true,
      emergencyAlerts: true,
      weeklyReports: false,
      smsAlerts: true,
      ...relationData.notification_preferences,
    };

    // Créer la relation familiale
    const { data: relation, error: insertError } = await supabase
      .from("family_members")
      .insert({
        user_id: relationData.user_id,
        senior_id: relationData.senior_id,
        relationship: relationData.relationship,
        is_primary_contact: relationData.is_primary_contact || false,
        notification_preferences: JSON.stringify(defaultNotifications),
        access_level: relationData.access_level || "standard",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("❌ Error creating family relation:", insertError);
      throw new Error(
        `Erreur lors de la création de la relation : ${insertError.message}`
      );
    }

    console.log("✅ Family relation created successfully:", relation.id);
    return relation.id;
  } catch (error) {
    console.error("❌ Failed to create family relation:", error);
    throw error;
  }
}

// ✅ Fonction corrigée pour récupérer les seniors d'un utilisateur
export async function getUserSeniors(userId?: string): Promise<any[]> {
  try {
    const targetUserId = userId || authState$.user.get()?.id;
    if (!targetUserId) {
      throw new Error("No user ID provided");
    }

    console.log("📊 Loading seniors for user:", targetUserId);

    // Requête corrigée avec les nouvelles colonnes
    const { data: relations, error } = await supabase
      .from("family_members")
      .select(
        `
          id,
          relationship,
          is_primary_contact,
          access_level,
          created_at,
          seniors!inner (
            id,
            first_name,
            last_name,
            phone,
            birth_date,
            preferred_call_time,
            call_frequency,
            address,
            emergency_contact,
            created_at
          )
        `
      )
      .eq("user_id", targetUserId)
      .eq("deleted", false)
      .eq("seniors.deleted", false);

    if (error) {
      console.error("❌ Error loading seniors:", error);
      throw error;
    }

    console.log("✅ Loaded seniors successfully:", relations?.length || 0);
    return relations || [];
  } catch (error) {
    console.error("❌ Failed to get user seniors:", error);
    throw error;
  }
}

// ✅ Fonction corrigée pour mettre à jour un senior
export async function updateSenior(
  seniorId: string,
  updates: Partial<SeniorCreateData>
): Promise<void> {
  try {
    console.log("🔄 Updating senior profile:", seniorId);

    // Nettoyer le téléphone si fourni
    if (updates.phone) {
      updates.phone = updates.phone.replace(/[\s\.\-]/g, "");
      const phoneRegex = /^(\+33|0)[1-9][0-9]{8}$/;
      if (!phoneRegex.test(updates.phone)) {
        throw new Error("Format de téléphone invalide");
      }
    }

    // Préparer les données pour la mise à jour
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Convertir les objets en JSON si nécessaire
    if (updates.address) {
      updateData.address = JSON.stringify(updates.address);
    }
    if (updates.personality_profile) {
      updateData.personality_profile = JSON.stringify(
        updates.personality_profile
      );
    }
    if (updates.medical_context) {
      updateData.medical_context = JSON.stringify(updates.medical_context);
    }
    if (updates.interests) {
      updateData.interests = JSON.stringify(updates.interests);
    }
    if (updates.communication_preferences) {
      updateData.communication_preferences = JSON.stringify(
        updates.communication_preferences
      );
    }

    const { error } = await supabase
      .from("seniors")
      .update(updateData)
      .eq("id", seniorId);

    if (error) {
      throw error;
    }

    // Mettre à jour l'observable local
    if (seniors$[seniorId]) {
      seniors$[seniorId].assign({
        ...updates,
        updated_at: new Date().toISOString(),
      });
    }

    console.log("✅ Senior profile updated successfully");
  } catch (error) {
    console.error("❌ Failed to update senior:", error);
    throw error;
  }
}

// ✅ Fonction pour valider un numéro de téléphone français
export function validateFrenchPhone(phone: string): {
  isValid: boolean;
  cleaned: string;
  error?: string;
} {
  try {
    // Nettoyer le numéro
    const cleaned = phone.replace(/[\s\.\-\(\)]/g, "");

    // Vérifier le format français
    const phoneRegex = /^(\+33|0033|0)[1-9][0-9]{8}$/;

    if (!phoneRegex.test(cleaned)) {
      return {
        isValid: false,
        cleaned: "",
        error:
          "Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)",
      };
    }

    // Normaliser au format français standard
    let normalized = cleaned;
    if (normalized.startsWith("+33")) {
      normalized = "0" + normalized.substring(3);
    } else if (normalized.startsWith("0033")) {
      normalized = "0" + normalized.substring(4);
    }

    return {
      isValid: true,
      cleaned: normalized,
    };
  } catch (error) {
    return {
      isValid: false,
      cleaned: "",
      error: "Format de téléphone invalide",
    };
  }
}
