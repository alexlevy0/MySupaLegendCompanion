import { supabase } from "../client";
import { authState$ } from "../auth/auth-state";

// =====================================================
// SERVICE CODES DE JOINTURE FAMILLE
// =====================================================

/**
 * Rejoindre une famille avec un code à 4 chiffres
 */
export async function joinFamilyWithCode(joinCode: string): Promise<{ success: boolean; seniorId?: string; error?: string }> {
  try {
    console.log("🔢 Joining family with code:", joinCode);

    // Vérifier que l'utilisateur est connecté
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("Vous devez être connecté pour rejoindre une famille");
    }

    // Nettoyer le code (enlever espaces, tirets, etc.)
    const cleanCode = joinCode.replace(/\s|-/g, "").toUpperCase();

    // Vérifier que le code fait 4 caractères
    if (cleanCode.length !== 4 || !/^\d{4}$/.test(cleanCode)) {
      return {
        success: false,
        error: "Le code doit contenir exactement 4 chiffres",
      };
    }

    // Appeler la fonction SQL pour rejoindre la famille
    const { data, error } = await supabase.rpc("join_family_with_code", {
      p_user_id: currentUser.id,
      p_join_code: cleanCode,
    });

    if (error) {
      console.error("❌ Error joining family:", error);
      throw error;
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Impossible de rejoindre la famille",
      };
    }

    console.log("✅ Successfully joined family");
    return {
      success: true,
      seniorId: data.senior_id,
    };
  } catch (error) {
    console.error("❌ Failed to join family with code:", error);
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez réessayer.",
    };
  }
}

/**
 * Obtenir le code de jointure d'un senior
 */
export async function getSeniorJoinCode(seniorId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("seniors")
      .select("join_code")
      .eq("id", seniorId)
      .eq("deleted", false)
      .single();

    if (error) {
      console.error("❌ Error getting join code:", error);
      return null;
    }

    return data?.join_code || null;
  } catch (error) {
    console.error("❌ Failed to get senior join code:", error);
    return null;
  }
}

/**
 * Régénérer le code de jointure d'un senior
 */
export async function regenerateJoinCode(seniorId: string): Promise<string | null> {
  try {
    console.log("🔄 Regenerating join code for senior:", seniorId);

    // Vérifier que l'utilisateur a le droit de régénérer le code
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("Vous devez être connecté");
    }

    // Vérifier que l'utilisateur est bien membre de la famille
    const { data: familyMember, error: memberError } = await supabase
      .from("family_members")
      .select("id, access_level")
      .eq("user_id", currentUser.id)
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .single();

    if (memberError || !familyMember) {
      throw new Error("Vous n'avez pas accès à ce senior");
    }

    // Seuls les membres avec accès complet peuvent régénérer le code
    if (familyMember.access_level !== "full") {
      throw new Error("Vous devez avoir un accès complet pour régénérer le code");
    }

    // Appeler la fonction SQL pour régénérer le code
    const { data, error } = await supabase.rpc("generate_join_code_for_senior", {
      senior_id: seniorId,
    });

    if (error) {
      console.error("❌ Error regenerating join code:", error);
      throw error;
    }

    console.log("✅ Join code regenerated successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Failed to regenerate join code:", error);
    throw error;
  }
}

/**
 * Vérifier si un code existe (pour la validation en temps réel)
 */
export async function checkJoinCodeExists(joinCode: string): Promise<boolean> {
  try {
    const cleanCode = joinCode.replace(/\s|-/g, "").toUpperCase();

    if (cleanCode.length !== 4 || !/^\d{4}$/.test(cleanCode)) {
      return false;
    }

    const { data, error } = await supabase
      .from("seniors")
      .select("id")
      .eq("join_code", cleanCode)
      .eq("deleted", false)
      .maybeSingle();

    if (error) {
      console.error("❌ Error checking join code:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("❌ Failed to check join code:", error);
    return false;
  }
}

/**
 * Obtenir les informations du senior à partir d'un code (pour prévisualisation)
 */
export async function getSeniorInfoByCode(joinCode: string): Promise<{
  firstName?: string;
  lastName?: string;
} | null> {
  try {
    const cleanCode = joinCode.replace(/\s|-/g, "").toUpperCase();

    if (cleanCode.length !== 4 || !/^\d{4}$/.test(cleanCode)) {
      return null;
    }

    const { data, error } = await supabase
      .from("seniors")
      .select(`
        users!inner(
          first_name,
          last_name
        )
      `)
      .eq("join_code", cleanCode)
      .eq("deleted", false)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      firstName: data.users.first_name,
      lastName: data.users.last_name,
    };
  } catch (error) {
    console.error("❌ Failed to get senior info by code:", error);
    return null;
  }
}