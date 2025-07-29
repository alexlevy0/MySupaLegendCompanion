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
import "whatwg-fetch"; // ou un autre polyfill fetch si besoin

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
// FONCTIONS D'AUTHENTIFICATION MYCOMPANION - VERSION CORRIGÉE
// =====================================================

// Observable pour l'état d'authentification global
export const authState$ = observable({
  session: null as Session | null,
  user: null as MyCompanionUser | null,
  loading: true,
  isAuthenticated: false,
  error: null as string | null,
  isUpdatingProfile: false,
  isLoadingProfile: false,
  profileLoadPromise: null as Promise<void> | null,
});

async function loadUserProfileSafe(userId: string, retryCount = 0) {
  // Si déjà en cours de chargement, attendre la promesse existante
  if (
    authState$.isLoadingProfile.get() &&
    authState$.profileLoadPromise.get()
  ) {
    console.log("Profile loading already in progress, waiting...");
    return authState$.profileLoadPromise.get();
  }

  // Marquer comme en cours de chargement
  authState$.isLoadingProfile.set(true);

  // Créer la promesse de chargement
  const loadPromise = loadUserProfileInternal(userId, retryCount);
  authState$.profileLoadPromise.set(loadPromise);

  try {
    await loadPromise;
  } finally {
    authState$.isLoadingProfile.set(false);
    authState$.profileLoadPromise.set(null);
  }
}

async function loadUserProfileInternal(userId: string, retryCount = 0) {
  const maxRetries = 3;
  try {
    console.log(
      `Loading user profile for ${userId} (attempt ${retryCount + 1})`
    );

    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`;
    const headers = {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
      Accept: "application/json",
    };

    const res = await fetch(url, { headers });
    const userData = await res.json();

    console.log("Raw query result:", { userData });

    if (!userData || userData.length === 0) {
      if (retryCount < maxRetries) {
        console.log("User not found, attempting to create profile...");
        await createMissingUserProfile(userId);
        return loadUserProfileInternal(userId, retryCount + 1);
      }
      throw new Error("User profile not found after creation attempts");
    }

    console.log(
      "✅ User profile loaded successfully:",
      userData[0].email,
      userData[0].user_type
    );

    authState$.user.set(userData[0]);
    authState$.isAuthenticated.set(true);
    authState$.error.set(null);
    authState$.loading.set(false);
  } catch (error) {
    console.error("Error loading user profile:", error);

    if (retryCount < maxRetries) {
      console.log(
        `Retrying user profile load (${retryCount + 1}/${maxRetries})`
      );
      setTimeout(() => loadUserProfileInternal(userId, retryCount + 1), 1000);
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

// Variables pour les timeouts
let loadingTimeout: NodeJS.Timeout;

// Initialiser l'état d'authentification avec timeout de sécurité
async function initializeAuth() {
  try {
    console.log("Initializing authentication...");

    // Timeout de sécurité
    const loadingTimeout = setTimeout(() => {
      console.warn("Auth loading timeout - forcing loading to false");
      authState$.loading.set(false);
      authState$.error.set("Authentication timeout");
    }, 10000);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      authState$.error.set(error.message);
      authState$.loading.set(false);
      clearTimeout(loadingTimeout);
      return;
    }

    authState$.session.set(session);

    if (session?.user) {
      console.log(
        "Session found, loading user profile for:",
        session.user.email
      );
      // ✅ Utiliser la fonction safe
      await loadUserProfileSafe(session.user.id);
    } else {
      console.log("No session found");
      authState$.loading.set(false);
    }

    clearTimeout(loadingTimeout);
  } catch (error) {
    console.error("Auth initialization error:", error);
    authState$.error.set("Failed to initialize authentication");
    authState$.loading.set(false);
  }
}

// Charger le profil utilisateur depuis la table users avec retry et création automatique
async function loadUserProfile(userId: string, retryCount = 0) {
  const maxRetries = 3;
  try {
    console.log(
      `Loading user profile for ${userId} (attempt ${retryCount + 1})`
    );

    // 1. D'abord, vérifier avec une requête simple
    // const { data: userData, error: userError } = await supabase
    //   .from("users")
    //   .select("*")
    //   .eq("id", userId);

    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`;
    const headers = {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
      Accept: "application/json",
    };
    const res = await fetch(url, { headers });
    const userData = await res.json();
    const userError = null;

    console.log("Raw query result:", { userData, userError });
    console.log("userData", userData);

    // 2. Si erreur RLS, essayer une requête avec email
    if (userError && userError.code === "PGRST116") {
      console.log("Trying to find user by email...");

      // Récupérer l'email depuis auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (!authError && user?.email) {
        const { data: userByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email);

        console.log("Search by email result:", { userByEmail, emailError });

        if (userByEmail && userByEmail.length > 0) {
          // Utilisateur trouvé par email mais pas par ID = problème de RLS
          console.warn("🚨 RLS ISSUE: User found by email but not by ID");
          console.warn("This indicates Row Level Security is blocking access");
          console.warn("User data:", userByEmail[0]);

          // Utiliser les données trouvées
          authState$.user.set(userByEmail[0]);
          authState$.isAuthenticated.set(true);
          authState$.error.set(null);
          authState$.loading.set(false);
          return;
        }
      }
    }

    // 3. Requête normale avec .single()
    // const { data, error } = await supabase
    //   .from("users")
    //   .select("*")
    //   .eq("id", userId)
    //   .single();

    // // const _url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`;

    // const _headers = {
    //   apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    //   Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!}`,
    //   Accept: "application/json",
    // };
    const _res = await fetch(url, { headers });
    const data = await _res.json();
    const error = null;

    if (error) {
      console.error("User profile query error:", error);

      // Debug info supplémentaire
      if (error.code === "PGRST116") {
        console.log("🔍 Debug info:");
        console.log("- User ID:", userId);
        console.log("- Error code:", error.code);
        console.log(
          "- This usually means RLS is blocking access or user doesn't exist"
        );

        // Essayer de créer le profil seulement si retry count < maxRetries
        if (retryCount < maxRetries) {
          console.log("Attempting to create missing user profile...");
          await createMissingUserProfile(userId);
          return loadUserProfile(userId, retryCount + 1);
        }
      }

      throw error;
    }

    if (!data) {
      throw new Error("User profile not found");
    }

    console.log(
      "✅ User profile loaded successfully:",
      data[0].email,
      data[0].user_type
    );
    authState$.user.set(data[0]);
    // authState$.user.set(data);
    authState$.isAuthenticated.set(true);
    authState$.error.set(null);
  } catch (error) {
    console.error("Error loading user profile:", error);

    if (retryCount < maxRetries) {
      console.log(
        `Retrying user profile load (${retryCount + 1}/${maxRetries})`
      );
      setTimeout(() => loadUserProfile(userId, retryCount + 1), 1000);
      return;
    }

    // Après tous les retries, définir l'état d'erreur
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.error.set(
      `Failed to load user profile: ${error.message || error}`
    );
  } finally {
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

// Initialiser l'authentification
initializeAuth();

// Écouter les changements d'authentification
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log(
    "Auth state changed. Event:",
    event,
    "Session user:",
    session?.user?.email
  );

  authState$.session.set(session);

  if (session?.user) {
    // ✅ Ne charger le profil que pour certains événements
    if (
      event === "SIGNED_IN" ||
      (event === "INITIAL_SESSION" && !authState$.user.get())
    ) {
      console.log("Loading user profile for:", session.user.id);
      authState$.loading.set(true);

      try {
        await loadUserProfileSafe(session.user.id);
      } catch (err) {
        console.error("Error in loadUserProfile:", err);
        authState$.user.set(null);
        authState$.isAuthenticated.set(false);
        authState$.error.set("Failed to load user profile");
      } finally {
        authState$.loading.set(false);
      }
    } else {
      console.log("Skipping profile load for event:", event);
    }
  } else {
    console.log("No session user. Resetting auth state.");
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.loading.set(false);
    authState$.error.set(null);
  }
});

export async function updateUserProfileNoAuth(updates: ProfileUpdateData) {
  console.log("updateUserProfileNoAuth: Starting update process...");
  try {
    authState$.isUpdatingProfile.set(true);
    console.log("updateUserProfileNoAuth: isUpdatingProfile set to true.");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("updateUserProfileNoAuth: User not authenticated.");
      throw new Error("User not authenticated");
    }
    console.log("updateUserProfileNoAuth: User authenticated, ID:", user.id);

    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("updateUserProfileNoAuth: Supabase update error:", error);
      throw error;
    }

    authState$.user.set(data);
    // Ensure isAuthenticated remains true if it was already true
    if (authState$.isAuthenticated.get()) {
      authState$.isAuthenticated.set(true);
    }
    authState$.loading.set(false);
    authState$.error.set(null);

    console.log(
      "updateUserProfileNoAuth: Profile updated successfully. New user data:",
      data
    );
    return data;
  } catch (error) {
    console.error("updateUserProfileNoAuth: Error during update:", error);
    throw error;
  } finally {
    console.log(
      "updateUserProfileNoAuth: Finally block - setting isUpdatingProfile to false."
    );
    authState$.isUpdatingProfile.set(false);
  }
}

// Hook personnalisé pour l'authentification avec gestion d'erreur
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

      console.log("useMyCompanionAuth: authState$ changed.", {
        hasSession: !!currentState.session,
        hasUserProfile: !!currentState.userProfile,
        loading: currentState.loading,
        error: currentState.error,
        isUpdatingProfile: currentState.isUpdatingProfile,
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
      console.log("Manual profile reload requested");
      authState$.loading.set(true);
      await loadUserProfileSafe(session.user.id);
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
    // Mais on peut aussi le faire manuellement pour être sûr
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

// Fonction pour se connecter avec gestion d'erreur améliorée
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
    // Redirection only if not already on the login page (to prevent loop)
    if (Platform.OS === "web" && window.location.pathname !== "/") {
      console.log("signOut: Redirecting to / due to sign out.");
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion :", error);
    // Tu peux throw ici si tu veux déclencher une alerte UI
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
// HELPER FUNCTIONS POUR LES DONNÉES
// =====================================================

// Garder les fonctions todos existantes
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

// Nouvelles fonctions MyCompanion
export function addSenior(
  seniorData: Partial<Database["public"]["Tables"]["seniors"]["Insert"]>
) {
  const id = generateId();
  seniors$[id].assign({
    id,
    ...seniorData,
  });
}

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

// =====================================================
// FONCTIONS DE GESTION DU PROFIL
// =====================================================

// Mettre à jour le profil utilisateur
let isUpdatingProfile = false;

export async function updateUserProfile(updates: ProfileUpdateData) {
  try {
    isUpdatingProfile = true; // Marquer le début de l'update
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
        .catch(console.warn); // Pas d'await, pas de blocage
    }

    return data;
  } catch (error) {
    console.error("❌ Profile update failed:", error);
    throw error;
  } finally {
    setTimeout(() => {
      isUpdatingProfile = false;
      authState$.isUpdatingProfile.set(false);
    }, 2000);
  }
}

// Changer le mot de passe
export async function changePassword(passwordData: PasswordChangeData) {
  try {
    console.log("Changing password...");

    // Vérifier d'abord le mot de passe actuel en tentant une re-auth
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

    // Vérifier le mot de passe actuel
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

    // Supprimer le compte auth (optionnel - voir avec votre politique)
    // const { error: deleteError } = await supabase.auth.admin.deleteUser(currentUser.id);

    // Pour l'instant, on se contente de se déconnecter
    await signOut();

    console.log("✅ Account deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Account deletion failed:", error);
    throw error;
  }
}

// Récupérer les statistiques du profil (pour affichage)
export async function getUserStats(userId: string) {
  try {
    const [callsCount, alertsCount] = await Promise.all([
      // Nombre d'appels (si c'est un senior)
      supabase
        .from("calls")
        .select("id", { count: "exact" })
        .eq("senior_id", userId),

      // Nombre d'alertes
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
