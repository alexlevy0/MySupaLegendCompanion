import { supabase } from "../client";
import { MyCompanionUser } from "../types";
import { authState$ } from "../auth/auth-state";

// =====================================================
// SERVICE UTILISATEURS
// =====================================================

// Récupérer un utilisateur par ID
export async function getUserById(userId: string): Promise<MyCompanionUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

// Récupérer un utilisateur par email
export async function getUserByEmail(email: string): Promise<MyCompanionUser | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Aucun utilisateur trouvé
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

// Vérifier si un email existe déjà
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .eq("deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false; // Aucun utilisateur trouvé
      }
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error("Error checking email exists:", error);
    return false;
  }
}

// Récupérer les utilisateurs actifs
export async function getActiveUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("is_active", true)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching active users:", error);
    return [];
  }
}

// Récupérer les utilisateurs par type
export async function getUsersByType(userType: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_type", userType)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching users by type:", error);
    return [];
  }
}

// Désactiver un utilisateur
export async function deactivateUser(userId: string) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    
    console.log("✅ User deactivated successfully");
    return true;
  } catch (error) {
    console.error("❌ Error deactivating user:", error);
    throw error;
  }
}

// Réactiver un utilisateur
export async function reactivateUser(userId: string) {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;
    
    console.log("✅ User reactivated successfully");
    return true;
  } catch (error) {
    console.error("❌ Error reactivating user:", error);
    throw error;
  }
}

// Rechercher des utilisateurs
export async function searchUsers(query: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("deleted", false)
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}