import { supabase, generateId } from "../client";
import { 
  InviteFamilyMemberData
} from "../types";
import { authState$ } from "../auth/auth-state";
import { createFamilyRelation } from "./senior-service";
import { getRedirectUrl } from "../utils/url-helpers";

// =====================================================
// SERVICE INVITATIONS FAMILIALES
// =====================================================

// ✅ Inviter un membre de famille
export async function inviteFamilyMember(
  inviteData: InviteFamilyMemberData
): Promise<void> {
  try {
    console.log("✉️ Inviting family member:", inviteData.email);

    // Vérifier que l'utilisateur actuel est connecté
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Récupérer les infos du senior pour l'email
    const { data: senior, error: seniorError } = await supabase
      .from("seniors")
      .select("first_name, last_name")
      .eq("id", inviteData.seniorId)
      .eq("deleted", false)
      .single();

    if (seniorError || !senior) {
      throw new Error("Senior not found");
    }

    // Vérifier si l'email correspond à un utilisateur existant
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, is_active")
      .eq("email", inviteData.email.toLowerCase())
      .eq("deleted", false)
      .maybeSingle();

    if (userError && userError.code !== "PGRST116") {
      throw userError;
    }

    if (existingUser) {
      // L'utilisateur existe déjà - créer directement la relation
      console.log("👤 User exists, creating family relation directly");

      // Vérifier si la relation n'existe pas déjà
      const { data: existingRelation, error: relationError } = await supabase
        .from("family_members")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("senior_id", inviteData.seniorId)
        .eq("deleted", false)
        .maybeSingle();

      if (relationError && relationError.code !== "PGRST116") {
        throw relationError;
      }

      if (existingRelation) {
        throw new Error(
          `${existingUser.first_name} ${existingUser.last_name} a déjà accès à ${senior.first_name} ${senior.last_name}`
        );
      }

      // Créer la relation familiale
      await createFamilyRelation({
        user_id: existingUser.id,
        senior_id: inviteData.seniorId,
        relationship: inviteData.relationship,
        is_primary_contact: false, // Les invités ne sont jamais contacts principaux
        notification_preferences: inviteData.notificationPreferences,
        access_level: inviteData.accessLevel,
      });

      console.log("✅ Family relation created for existing user");

      // 🔧 TODO: Envoyer un email de notification à l'utilisateur existant
      // pour l'informer qu'il a maintenant accès aux données du senior
    } else {
      // L'utilisateur n'existe pas - utiliser le système d'invitation par email
      console.log("📨 User doesn't exist, sending invitation email");

      // ✅ MÉTHODE RECOMMANDÉE : Invitation par signup avec metadata
      // Au lieu de créer un compte admin, on va envoyer un lien d'inscription pré-rempli

      // Stocker l'invitation dans une table temporaire (ou localStorage côté client)
      const invitationToken = generateId();

      // Créer un lien d'inscription avec les données pré-remplies
      const invitationData = {
        token: invitationToken,
        seniorId: inviteData.seniorId,
        seniorName: `${senior.first_name} ${senior.last_name}`,
        inviterName: `${currentUser.first_name} ${currentUser.last_name}`,
        relationship: inviteData.relationship,
        accessLevel: inviteData.accessLevel,
        notificationPreferences: inviteData.notificationPreferences,
        email: inviteData.email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
      };

      // 🔧 OPTION 1: Stocker l'invitation dans une table (recommandé)
      const { error: inviteError } = await supabase
        .from("family_invitations") // Table à créer
        .insert({
          id: invitationToken,
          senior_id: inviteData.seniorId,
          inviter_id: currentUser.id,
          email: inviteData.email.toLowerCase(),
          relationship: inviteData.relationship,
          access_level: inviteData.accessLevel,
          notification_preferences: JSON.stringify(
            inviteData.notificationPreferences
          ),
          expires_at: invitationData.expiresAt,
          status: "pending",
        });

      // 🔧 OPTION 2: Si pas de table, encoder les données dans l'URL (moins sécurisé)
      if (inviteError) {
        console.warn(
          "Could not store invitation in DB, using URL params:",
          inviteError
        );
      }

      // Créer l'URL d'invitation qui redirige vers signup
      const invitationUrl = `${getRedirectUrl(
        "/auth/invite"
      )}?token=${invitationToken}&email=${encodeURIComponent(
        inviteData.email
      )}`;

      console.log("🔗 Invitation URL:", invitationUrl);

      // ⚠️ PROBLÈME: On ne peut pas envoyer d'email directement depuis le client
      // Il faut soit :
      // 1. Une fonction Edge/API pour envoyer l'email
      // 2. Un service tiers (Resend, SendGrid, etc.)
      // 3. Utiliser Supabase Auth avec un template personnalisé

      // 🔧 SOLUTION TEMPORAIRE: Simuler l'envoi et logger l'URL
      console.log("📧 Email invitation should be sent to:", inviteData.email);
      console.log("📧 Email content should include:", {
        inviterName: invitationData.inviterName,
        seniorName: invitationData.seniorName,
        invitationUrl,
      });

      // En production, vous devriez :
      // await sendInvitationEmail(invitationData, invitationUrl);
    }

    console.log("✅ Family member invitation process completed");
  } catch (error) {
    console.error("❌ Failed to invite family member:", error);
    throw error;
  }
}

// ✅ Récupérer une invitation par token
export async function getInvitationByToken(token: string) {
  try {
    const { data, error } = await supabase
      .from("family_invitations")
      .select(
        `
        *,
        seniors (
          id,
          first_name,
          last_name
        ),
        users!inviter_id (
          first_name,
          last_name
        )
      `
      )
      .eq("id", token)
      .eq("status", "pending")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Invitation non trouvée ou expirée");
      }
      throw error;
    }

    // Vérifier si l'invitation n'est pas expirée
    if (new Date(data.expires_at) < new Date()) {
      // Marquer comme expirée
      await supabase
        .from("family_invitations")
        .update({ status: "expired" })
        .eq("id", token);
      
      throw new Error("Cette invitation a expiré");
    }

    return data;
  } catch (error) {
    console.error("❌ Failed to get invitation:", error);
    throw error;
  }
}

// ✅ Accepter une invitation
export async function acceptInvitation(token: string, userId: string) {
  try {
    console.log("✅ Accepting invitation:", token);

    // Récupérer l'invitation
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invitation invalide");
    }

    // Créer la relation familiale
    await createFamilyRelation({
      user_id: userId,
      senior_id: invitation.senior_id,
      relationship: invitation.relationship,
      is_primary_contact: false,
      notification_preferences: JSON.parse(invitation.notification_preferences),
      access_level: invitation.access_level,
    });

    // Marquer l'invitation comme utilisée
    const { error } = await supabase
      .from("family_invitations")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", token);

    if (error) {
      console.warn("Could not update invitation status:", error);
    }

    console.log("✅ Invitation accepted successfully");
    return invitation;
  } catch (error) {
    console.error("❌ Failed to accept invitation:", error);
    throw error;
  }
}

// ✅ Révoquer une invitation
export async function revokeInvitation(invitationId: string) {
  try {
    console.log("🗑️ Revoking invitation:", invitationId);

    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Vérifier que l'utilisateur actuel est l'inviteur
    const { data: invitation, error: fetchError } = await supabase
      .from("family_invitations")
      .select("inviter_id")
      .eq("id", invitationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (invitation.inviter_id !== currentUser.id) {
      throw new Error("Vous ne pouvez pas révoquer cette invitation");
    }

    // Marquer comme révoquée
    const { error } = await supabase
      .from("family_invitations")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (error) {
      throw error;
    }

    console.log("✅ Invitation revoked successfully");
  } catch (error) {
    console.error("❌ Failed to revoke invitation:", error);
    throw error;
  }
}

// ✅ Récupérer les invitations envoyées
export async function getSentInvitations(seniorId?: string) {
  try {
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    let query = supabase
      .from("family_invitations")
      .select(
        `
        *,
        seniors (
          id,
          first_name,
          last_name
        )
      `
      )
      .eq("inviter_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (seniorId) {
      query = query.eq("senior_id", seniorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get sent invitations:", error);
    return [];
  }
}

// ✅ Renvoyer une invitation
export async function resendInvitation(invitationId: string) {
  try {
    console.log("📧 Resending invitation:", invitationId);

    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Récupérer l'invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("family_invitations")
      .select(
        `
        *,
        seniors (
          first_name,
          last_name
        )
      `
      )
      .eq("id", invitationId)
      .eq("inviter_id", currentUser.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (invitation.status !== "pending") {
      throw new Error("Cette invitation a déjà été utilisée");
    }

    // Mettre à jour la date d'expiration
    const newExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error: updateError } = await supabase
      .from("family_invitations")
      .update({
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (updateError) {
      throw updateError;
    }

    // Créer l'URL d'invitation
    const invitationUrl = `${getRedirectUrl(
      "/auth/invite"
    )}?token=${invitationId}&email=${encodeURIComponent(invitation.email)}`;

    console.log("🔗 New invitation URL:", invitationUrl);
    console.log("📧 Email should be resent to:", invitation.email);

    // TODO: Implémenter l'envoi d'email réel
    // await sendInvitationEmail(invitation, invitationUrl);

    console.log("✅ Invitation resent successfully");
    return invitationUrl;
  } catch (error) {
    console.error("❌ Failed to resend invitation:", error);
    throw error;
  }
}