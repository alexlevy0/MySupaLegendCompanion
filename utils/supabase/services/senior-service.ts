import { authState$ } from "../auth/auth-state";
import { supabase } from "../client";
import { seniors$ } from "../observables/seniors";
import { FamilyRelationData, SeniorCreateData, SeniorData } from "../types";
import { validateFrenchPhone } from "../utils/validation";

// =====================================================
// SERVICE SENIORS
// =====================================================

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
      .select("id, join_code")
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

    console.log("✅ Senior profile created successfully:", senior.id, "with join code:", senior.join_code);

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
      join_code: senior.join_code,
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

export async function getSeniorById(
  seniorId: string
): Promise<SeniorData | null> {
  try {
    console.log("📊 Loading senior by ID:", seniorId);

    // Vérifier que l'utilisateur connecté a accès à ce senior
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Récupérer le senior avec vérification d'accès
    const { data: senior, error } = await supabase
      .from("seniors")
      .select(
        `
          id,
          user_id,
          first_name,
          last_name,
          phone,
          birth_date,
          preferred_call_time,
          call_frequency,
          personality_profile,
          medical_context,
          interests,
          communication_preferences,
          emergency_contact,
          address,
          created_at,
          updated_at,
          deleted,
          family_members!inner (
            user_id,
            deleted
          )
        `
      )
      .eq("id", seniorId)
      .eq("deleted", false)
      .eq("family_members.user_id", currentUser.id)
      .eq("family_members.deleted", false)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Senior non trouvé ou accès non autorisé");
      }
      throw error;
    }

    // Transformer les données JSON en objets
    const seniorData: SeniorData = {
      ...senior,
      address: senior.address
        ? typeof senior.address === "string"
          ? JSON.parse(senior.address)
          : senior.address
        : null,
      personality_profile: senior.personality_profile
        ? typeof senior.personality_profile === "string"
          ? JSON.parse(senior.personality_profile)
          : senior.personality_profile
        : null,
      medical_context: senior.medical_context
        ? typeof senior.medical_context === "string"
          ? JSON.parse(senior.medical_context)
          : senior.medical_context
        : null,
      interests: senior.interests
        ? typeof senior.interests === "string"
          ? JSON.parse(senior.interests)
          : senior.interests
        : null,
      communication_preferences: senior.communication_preferences
        ? typeof senior.communication_preferences === "string"
          ? JSON.parse(senior.communication_preferences)
          : senior.communication_preferences
        : null,
    };

    console.log(
      "✅ Senior loaded successfully:",
      seniorData.first_name,
      seniorData.last_name
    );
    return seniorData;
  } catch (error) {
    console.error("❌ Failed to get senior by ID:", error);
    throw error;
  }
}

// ✅ Fonction de mise à jour d'un senior (version améliorée)
export async function updateSenior(
  seniorId: string,
  updates: Partial<SeniorCreateData>
): Promise<void> {
  try {
    console.log("🔄 Updating senior profile:", seniorId);

    // Vérifier que l'utilisateur connecté a accès à ce senior
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Vérifier l'accès au senior
    const { data: accessCheck, error: accessError } = await supabase
      .from("family_members")
      .select("id, access_level")
      .eq("senior_id", seniorId)
      .eq("user_id", currentUser.id)
      .eq("deleted", false)
      .single();

    if (accessError) {
      throw new Error("Accès non autorisé à ce senior");
    }

    // Nettoyer le téléphone si fourni
    if (updates.phone) {
      const phoneValidation = validateFrenchPhone(updates.phone);
      if (!phoneValidation.isValid) {
        throw new Error(
          phoneValidation.error || "Format de téléphone invalide"
        );
      }
      updates.phone = phoneValidation.cleaned;
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

    // Vérifier l'unicité du téléphone si modifié
    if (updates.phone) {
      const { data: existingSenior, error: checkError } = await supabase
        .from("seniors")
        .select("id, first_name, last_name")
        .eq("phone", updates.phone)
        .eq("deleted", false)
        .neq("id", seniorId)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingSenior) {
        throw new Error(
          `Ce numéro est déjà utilisé par ${existingSenior.first_name} ${existingSenior.last_name}`
        );
      }
    }

    // Effectuer la mise à jour
    const { error: updateError } = await supabase
      .from("seniors")
      .update(updateData)
      .eq("id", seniorId);

    if (updateError) {
      if (
        updateError.code === "23505" &&
        updateError.message.includes("phone")
      ) {
        throw new Error(
          "Ce numéro de téléphone est déjà utilisé par un autre senior"
        );
      }
      throw updateError;
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

// ✅ Supprimer un senior (soft delete)
export async function deleteSenior(seniorId: string): Promise<void> {
  try {
    console.log("🗑️ Deleting senior:", seniorId);

    // Vérifier que l'utilisateur connecté a accès à ce senior
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Vérifier l'accès au senior et qu'il est contact principal
    const { data: familyRelation, error: accessError } = await supabase
      .from("family_members")
      .select("id, is_primary_contact, access_level")
      .eq("senior_id", seniorId)
      .eq("user_id", currentUser.id)
      .eq("deleted", false)
      .single();

    if (accessError) {
      throw new Error("Accès non autorisé à ce senior");
    }

    // Seul le contact principal ou un utilisateur avec accès "full" peut supprimer
    if (
      !familyRelation.is_primary_contact &&
      familyRelation.access_level !== "full"
    ) {
      throw new Error(
        "Seul le contact principal peut supprimer ce profil senior"
      );
    }

    // Soft delete du senior
    const { error: deleteError } = await supabase
      .from("seniors")
      .update({
        deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", seniorId);

    if (deleteError) {
      throw deleteError;
    }

    // Soft delete de toutes les relations familiales
    const { error: relationsError } = await supabase
      .from("family_members")
      .update({
        deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("senior_id", seniorId);

    if (relationsError) {
      console.warn(
        "Warning: Failed to delete family relations:",
        relationsError
      );
    }

    // Mettre à jour l'observable local
    if (seniors$[seniorId]) {
      seniors$[seniorId].delete();
    }

    console.log("✅ Senior deleted successfully");
  } catch (error) {
    console.error("❌ Failed to delete senior:", error);
    throw error;
  }
}

// ✅ Dupliquer un senior (créer un nouveau profil basé sur un existant)
export async function duplicateSenior(
  seniorId: string,
  newData: { first_name: string; last_name: string; phone: string }
): Promise<string> {
  try {
    console.log("📋 Duplicating senior:", seniorId);

    // Récupérer le senior source
    const sourceSenior = await getSeniorById(seniorId);
    if (!sourceSenior) {
      throw new Error("Senior source non trouvé");
    }

    // Préparer les données du nouveau senior
    const duplicateData: SeniorCreateData = {
      first_name: newData.first_name,
      last_name: newData.last_name,
      phone: newData.phone,
      birth_date: sourceSenior.birth_date,
      preferred_call_time: sourceSenior.preferred_call_time,
      call_frequency: sourceSenior.call_frequency,
      emergency_contact: newData.phone, // Utiliser le nouveau numéro
      address: sourceSenior.address,
      personality_profile: sourceSenior.personality_profile,
      medical_context: null, // Ne pas copier les infos médicales
      interests: sourceSenior.interests,
      communication_preferences: sourceSenior.communication_preferences,
    };

    // Créer le nouveau senior
    const newSeniorId = await addSenior(duplicateData);

    console.log("✅ Senior duplicated successfully:", newSeniorId);
    return newSeniorId;
  } catch (error) {
    console.error("❌ Failed to duplicate senior:", error);
    throw error;
  }
}

export async function getSeniorStats(seniorId: string) {
  try {
    console.log("📊 Loading senior stats for:", seniorId);

    const [callsResult, alertsResult, metricsResult] = await Promise.all([
      // Nombre total d'appels
      supabase
        .from("calls")
        .select("id", { count: "exact" })
        .eq("senior_id", seniorId)
        .eq("deleted", false),

      // Nombre d'alertes par sévérité
      supabase
        .from("alerts")
        .select("severity", { count: "exact" })
        .eq("senior_id", seniorId)
        .eq("deleted", false),

      // Dernière métrique de bien-être
      supabase
        .from("well_being_metrics")
        .select("*")
        .eq("senior_id", seniorId)
        .eq("deleted", false)
        .order("metric_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const stats = {
      totalCalls: callsResult.count || 0,
      totalAlerts: alertsResult.count || 0,
      lastWellBeingScore: metricsResult.data?.overall_score || null,
      lastMetricDate: metricsResult.data?.metric_date || null,
    };

    console.log("✅ Senior stats loaded:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Failed to get senior stats:", error);
    return {
      totalCalls: 0,
      totalAlerts: 0,
      lastWellBeingScore: null,
      lastMetricDate: null,
    };
  }
}

// ✅ Récupérer les membres de famille d'un senior
export async function getFamilyMembers(seniorId: string) {
  try {
    const { data, error } = await supabase
      .from("family_members")
      .select(
        `
        *,
        users (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get family members:", error);
    throw error;
  }
}

// ✅ Modifier le niveau d'accès d'un membre
export async function updateFamilyMemberAccess(
  memberId: string,
  newAccessLevel: "minimal" | "standard" | "full"
) {
  try {
    const { error } = await supabase
      .from("family_members")
      .update({
        access_level: newAccessLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) throw error;
    console.log("✅ Family member access updated");
  } catch (error) {
    console.error("❌ Failed to update family member access:", error);
    throw error;
  }
}

// ✅ Retirer un membre de famille
export async function removeFamilyMember(memberId: string): Promise<void> {
  try {
    console.log("🗑️ Removing family member:", memberId);

    // Vérifier que l'utilisateur actuel a le droit de retirer ce membre
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Vérifier que ce n'est pas le contact principal
    const { data: member, error: fetchError } = await supabase
      .from("family_members")
      .select("is_primary_contact")
      .eq("id", memberId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (member.is_primary_contact) {
      throw new Error("Impossible de retirer le contact principal");
    }

    // Marquer comme supprimé (soft delete)
    const { error } = await supabase
      .from("family_members")
      .update({
        deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) {
      throw error;
    }

    console.log("✅ Family member removed successfully");
  } catch (error) {
    console.error("❌ Failed to remove family member:", error);
    throw error;
  }
}

// ✅ Transférer le rôle de contact principal
export async function transferPrimaryContact(
  seniorId: string,
  newPrimaryContactId: string
): Promise<void> {
  try {
    console.log(
      "👑 Transferring primary contact:",
      seniorId,
      newPrimaryContactId
    );

    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Transaction pour transférer le rôle
    const { error } = await supabase.rpc("transfer_primary_contact", {
      p_senior_id: seniorId,
      p_new_primary_id: newPrimaryContactId,
    });

    if (error) {
      // Si la fonction RPC n'existe pas, faire la transaction manuellement
      // 1. Retirer le rôle principal de l'ancien contact
      await supabase
        .from("family_members")
        .update({ is_primary_contact: false })
        .eq("senior_id", seniorId)
        .eq("is_primary_contact", true);

      // 2. Donner le rôle principal au nouveau contact
      const { error: updateError } = await supabase
        .from("family_members")
        .update({
          is_primary_contact: true,
          access_level: "full", // Le contact principal a toujours un accès complet
        })
        .eq("id", newPrimaryContactId);

      if (updateError) {
        throw updateError;
      }
    }

    console.log("✅ Primary contact transferred successfully");
  } catch (error) {
    console.error("❌ Failed to transfer primary contact:", error);
    throw error;
  }
}

// ✅ Obtenir les statistiques de partage d'un senior
export async function getSeniorSharingStats(seniorId: string) {
  try {
    console.log("📊 Getting sharing stats for senior:", seniorId);

    const [membersResult, reportsResult] = await Promise.all([
      // Nombre de membres de famille
      supabase
        .from("family_members")
        .select("id", { count: "exact" })
        .eq("senior_id", seniorId)
        .eq("deleted", false),

      // Nombre de rapports envoyés ce mois
      supabase
        .from("family_reports")
        .select("id", { count: "exact" })
        .eq("senior_id", seniorId)
        .eq("deleted", false)
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        ),
    ]);

    const stats = {
      totalMembers: membersResult.count || 0,
      reportsThisMonth: reportsResult.count || 0,
    };

    console.log("✅ Sharing stats loaded:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Failed to get sharing stats:", error);
    return {
      totalMembers: 0,
      reportsThisMonth: 0,
    };
  }
}

// ✅ Obtenir l'historique des modifications d'un senior
export async function getSeniorHistory(seniorId: string) {
  try {
    console.log("📊 Loading senior history:", seniorId);

    // Pour l'instant, on retourne des données mock
    // Dans une vraie implémentation, vous auriez une table d'audit
    const mockHistory = [
      {
        id: "1",
        action: "updated",
        field: "preferred_call_time",
        old_value: "08:00",
        new_value: "09:00",
        updated_by: "Marie Dubois",
        updated_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "2",
        action: "created",
        field: null,
        old_value: null,
        new_value: null,
        updated_by: "Marie Dubois",
        updated_at: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    return mockHistory;
  } catch (error) {
    console.error("❌ Failed to get senior history:", error);
    return [];
  }
}

// ✅ Exporter les données d'un senior (pour sauvegarde)
export async function exportSeniorData(seniorId: string) {
  try {
    console.log("📤 Exporting senior data:", seniorId);

    const senior = await getSeniorById(seniorId);
    if (!senior) {
      throw new Error("Senior non trouvé");
    }

    // Récupérer les données associées
    const [familyMembers, callsStats, alertsStats] = await Promise.all([
      getFamilyMembers(seniorId),
      getSeniorStats(seniorId),
      // Vous pourriez ajouter d'autres données ici
    ]);

    const exportData = {
      senior,
      family_members: familyMembers,
      statistics: callsStats,
      exported_at: new Date().toISOString(),
      export_version: "1.0",
    };

    console.log("✅ Senior data exported successfully");
    return exportData;
  } catch (error) {
    console.error("❌ Failed to export senior data:", error);
    throw error;
  }
}
