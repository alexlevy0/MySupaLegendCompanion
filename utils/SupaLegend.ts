import { observable } from "@legendapp/state";
import { observablePersistAsyncStorage } from "@legendapp/state/persist-plugins/async-storage";
import { configureSynced } from "@legendapp/state/sync";
import { syncedSupabase } from "@legendapp/state/sync-plugins/supabase";
import { createClient, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

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
});

// Variables pour les timeouts
let loadingTimeout: NodeJS.Timeout;

// Initialiser l'état d'authentification avec timeout de sécurité
async function initializeAuth() {
  try {
    console.log("Initializing authentication...");

    // Timeout de sécurité de 10 secondes
    loadingTimeout = setTimeout(() => {
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
      return;
    }

    authState$.session.set(session);

    if (session?.user) {
      console.log(
        "Session found, loading user profile for:",
        session.user.email
      );
      await loadUserProfile(session.user.id);
    } else {
      console.log("No session found");
      authState$.loading.set(false);
    }

    clearTimeout(loadingTimeout);
  } catch (error) {
    console.error("Auth initialization error:", error);
    authState$.error.set("Failed to initialize authentication");
    authState$.loading.set(false);
    clearTimeout(loadingTimeout);
  }
}

// Charger le profil utilisateur depuis la table users avec retry et création automatique
async function loadUserProfile(userId: string, retryCount = 0) {
  const maxRetries = 3;

  try {
    console.log(
      `Loading user profile for ${userId} (attempt ${retryCount + 1})`
    );

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("User profile query error:", error);

      // Si l'utilisateur n'existe pas dans public.users, essayer de le créer
      if (error.code === "PGRST116" && retryCount < maxRetries) {
        console.log(
          "User not found in public.users, attempting to create profile..."
        );
        await createMissingUserProfile(userId);
        return loadUserProfile(userId, retryCount + 1);
      }

      throw error;
    }

    if (!data) {
      throw new Error("User profile not found");
    }

    console.log(
      "User profile loaded successfully:",
      data.email,
      data.user_type
    );
    authState$.user.set(data);
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

    // Après tous les retries, soit on crée un profil par défaut, soit on échoue
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.error.set("Failed to load user profile");
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

    const userData = {
      id: userId,
      email: user.email!,
      user_type: (user.user_metadata?.user_type || "family") as UserType,
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      is_active: true,
    };

    console.log("Creating missing user profile:", userData);

    const { error: insertError } = await supabase
      .from("users")
      .insert(userData);

    if (insertError) {
      console.error("Failed to create user profile:", insertError);
      throw insertError;
    }

    console.log("User profile created successfully");
  } catch (error) {
    console.error("Error creating missing user profile:", error);
    throw error;
  }
}

// Initialiser l'authentification
initializeAuth();

// Écouter les changements d'authentification
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log("Auth state changed:", event, session?.user?.email);

  authState$.session.set(session);

  if (session?.user) {
    authState$.loading.set(true);
    await loadUserProfile(session.user.id);
  } else {
    authState$.user.set(null);
    authState$.isAuthenticated.set(false);
    authState$.loading.set(false);
    authState$.error.set(null);
  }
});

// Hook personnalisé pour l'authentification avec gestion d'erreur
export function useMyCompanionAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<MyCompanionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Observer les changements d'état d'authentification
    const unsubscribe = authState$.onChange(() => {
      setSession(authState$.session.get());
      setUserProfile(authState$.user.get());
      setLoading(authState$.loading.get());
      setError(authState$.error.get());
    });

    // Valeurs initiales
    setSession(authState$.session.get());
    setUserProfile(authState$.user.get());
    setLoading(authState$.loading.get());
    setError(authState$.error.get());

    return unsubscribe;
  }, []);

  // Fonction pour forcer le rechargement du profil
  const reloadProfile = async () => {
    if (session?.user) {
      authState$.loading.set(true);
      authState$.error.set(null);
      await loadUserProfile(session.user.id);
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log("Sign out successful");
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
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
