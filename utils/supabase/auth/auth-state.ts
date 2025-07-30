import { observable } from "@legendapp/state";
import { Platform } from "react-native";
import { AuthState, MyCompanionUser, UserType } from "../types";
import { supabase } from "../client";
import { Storage } from "@/utils/storage";

// =====================================================
// GESTION D'ÉTAT D'AUTHENTIFICATION OPTIMISÉE
// =====================================================

// Observable pour l'état d'authentification global
export const authState$ = observable<AuthState>({
  session: null,
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null,
  isUpdatingProfile: false,
  // Protection anti-doublon
  isLoadingProfile: false,
  profileLoadPromise: null,
  hasInitialized: false,
});

// ✅ Fonction ultra-sécurisée contre les doublons
export async function loadUserProfileSafe(
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
  } catch (error: any) {
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
export async function initializeAuth() {
  try {
    console.log("🚀 Initializing authentication...");

    // ✅ Configurer le listener d'authentification
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

// Fonction pour réinitialiser l'état d'authentification
export function resetAuthState() {
  authState$.user.set(null);
  authState$.isAuthenticated.set(false);
  authState$.loading.set(false);
  authState$.error.set(null);
  authState$.session.set(null);
  
  if (Platform.OS === "web") {
    localStorage.clear();
  } else {
    Storage.clear();
  }
}