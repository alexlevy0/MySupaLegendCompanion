import { Platform } from "react-native";
import { supabase } from "../client";
import { 
  SignUpUserData, 
  UserType, 
  PasswordChangeData, 
  EmailChangeData,
  ProfileUpdateData,
  MyCompanionUser 
} from "../types";
import { authState$, resetAuthState } from "./auth-state";
import { getRedirectUrl } from "../utils/url-helpers";

// =====================================================
// FONCTIONS D'AUTHENTIFICATION
// =====================================================

// Fonction pour créer un utilisateur complet (auth + business)
export async function signUpMyCompanionUser(
  email: string,
  password: string,
  userData: SignUpUserData
) {
  try {
    console.log("Creating new user:", email, userData.user_type);

    // 1. Créer l'utilisateur dans Supabase Auth avec la bonne URL de confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type,
        },
        // 🔧 CORRECTION : URL de redirection pour la confirmation
        emailRedirectTo: getRedirectUrl("/auth/confirm"),
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

    console.log(
      "✅ User created successfully with redirect URL:",
      getRedirectUrl("/auth/confirm")
    );
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

    // Réinitialiser l'état
    resetAuthState();

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

    // Changer l'email avec URL de redirection
    const { error } = await supabase.auth.updateUser({
      email: emailData.newEmail,
      options: {
        emailRedirectTo: getRedirectUrl("/auth/confirm"),
      },
    });

    if (error) throw error;

    console.log(
      "✅ Email change initiated with redirect:",
      getRedirectUrl("/auth/confirm")
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

    const redirectUrl = getRedirectUrl("/auth/reset-password");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;

    console.log("✅ Password reset email sent with redirect:", redirectUrl);
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