import { authState$ } from "../auth/auth-state";
import { generateId, supabase } from "../client";
import { InviteFamilyMemberData } from "../types";
import { getRedirectUrl } from "../utils/url-helpers";
import { createFamilyRelation } from "./senior-service";

// =====================================================
// SERVICE INVITATIONS FAMILIALES - CODES FAMILLE
// =====================================================

// ✅ Générer un nouveau code famille
export async function generateFamilyCode(seniorId: string): Promise<string> {
  try {
    console.log("🔑 Generating family code for senior:", seniorId);

    // Vérifier que l'utilisateur actuel est connecté
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Vérifier que l'utilisateur a accès à ce senior
    const { data: familyMember, error: memberError } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("senior_id", seniorId)
      .eq("deleted", false)
      .maybeSingle();

    if (memberError || !familyMember) {
      throw new Error("You don't have access to this senior");
    }

    // Désactiver l'ancien code s'il existe
    await deactivateFamilyCode(seniorId);

    // Générer un nouveau code via la fonction SQL
    const { data: codeData, error: codeError } = await supabase
      .rpc("generate_unique_family_code");

    if (codeError || !codeData) {
      throw new Error("Failed to generate code");
    }

    // Créer l'entrée dans la table
    const { data: newCode, error: insertError } = await supabase
      .from("family_invite_codes")
      .insert({
        senior_id: seniorId,
        created_by: currentUser.id,
        code: codeData,
        is_active: true,
      })
      .select("code")
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log("✅ Family code generated:", newCode.code);
    return newCode.code;
  } catch (error) {
    console.error("❌ Error generating family code:", error);
    throw error;
  }
}

// ✅ Valider et utiliser un code pour rejoindre une famille
export async function joinFamilyWithCode(
  code: string,
  relationship: string,
  notificationPreferences?: any
): Promise<{ success: boolean; seniorInfo?: any; error?: string }> {
  try {
    console.log("🔗 Joining family with code:", code);

    // Vérifier que l'utilisateur actuel est connecté
    const currentUser = authState$.user.get();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // Nettoyer le code (uppercase, trim)
    const cleanCode = code.trim().toUpperCase();

    // Vérifier la validité du code
    const { data: codeData, error: codeError } = await supabase
      .from("family_invite_codes")
      .select(`
        id,
        senior_id,
        current_uses,
        max_uses,
        expires_at,
        is_active,
        seniors (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("code", cleanCode)
      .single();

    if (codeError || !codeData) {
      return {
        success: false,
        error: "Code invalide ou introuvable",
      };
    }

    // Vérifier si le code est actif
    if (!codeData.is_active) {
      return {
        success: false,
        error: "Ce code n'est plus actif",
      };
    }

    // Vérifier l'expiration
    if (new Date(codeData.expires_at) < new Date()) {
      return {
        success: false,
        error: "Ce code a expiré",
      };
    }

    // Vérifier le nombre d'utilisations
    if (codeData.current_uses >= codeData.max_uses) {
      return {
        success: false,
        error: "Ce code a atteint sa limite d'utilisation",
      };
    }

    // Vérifier si l'utilisateur n'est pas déjà membre
    const { data: existingRelation } = await supabase
      .from("family_members")
      .select("id")
      .eq("user_id", currentUser.id)
      .eq("senior_id", codeData.senior_id)
      .eq("deleted", false)
      .maybeSingle();

    if (existingRelation) {
      return {
        success: false,
        error: "Vous avez déjà accès à cette personne",
      };
    }

    // Créer la relation familiale
    await createFamilyRelation({
      user_id: currentUser.id,
      senior_id: codeData.senior_id,
      relationship: relationship,
      is_primary_contact: false,
      notification_preferences: notificationPreferences || {
        emergency_alerts: true,
        daily_updates: true,
        activity_reminders: false,
      },
      access_level: "standard",
    });

    // Enregistrer l'utilisation du code
    await supabase.rpc("record_code_usage", {
      p_code_id: codeData.id,
      p_user_id: currentUser.id,
      p_relationship: relationship,
    });

    console.log("✅ Successfully joined family");
    return {
      success: true,
      seniorInfo: codeData.seniors,
    };
  } catch (error) {
    console.error("❌ Error joining family with code:", error);
    return {
      success: false,
      error: "Une erreur est survenue",
    };
  }
}

// ✅ Régénérer un code (invalide l'ancien)
export async function regenerateFamilyCode(seniorId: string): Promise<string> {
  try {
    console.log("🔄 Regenerating family code for senior:", seniorId);

    // Désactiver l'ancien code
    await deactivateFamilyCode(seniorId);

    // Générer un nouveau code
    return await generateFamilyCode(seniorId);
  } catch (error) {
    console.error("❌ Error regenerating family code:", error);
    throw error;
  }
}

// ✅ Récupérer le code actif d'un senior
export async function getFamilyCode(seniorId: string): Promise<string | null> {
  try {
    console.log("📋 Getting family code for senior:", seniorId);

    const { data: codeData, error } = await supabase
      .from("family_invite_codes")
      .select("code, expires_at, current_uses, max_uses")
      .eq("senior_id", seniorId)
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .lt("current_uses", supabase.raw("max_uses"))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return codeData?.code || null;
  } catch (error) {
    console.error("❌ Error getting family code:", error);
    throw error;
  }
}

// ✅ Désactiver un code
export async function deactivateFamilyCode(seniorId: string): Promise<void> {
  try {
    console.log("🚫 Deactivating family codes for senior:", seniorId);

    const { error } = await supabase
      .from("family_invite_codes")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("senior_id", seniorId)
      .eq("is_active", true);

    if (error) {
      throw error;
    }

    console.log("✅ Family codes deactivated");
  } catch (error) {
    console.error("❌ Error deactivating family codes:", error);
    throw error;
  }
}

// ✅ Récupérer les statistiques d'un code
export async function getCodeStatistics(seniorId: string): Promise<{
  code: string | null;
  expiresAt: Date | null;
  currentUses: number;
  maxUses: number;
  remainingUses: number;
  isActive: boolean;
}> {
  try {
    const { data: codeData, error } = await supabase
      .from("family_invite_codes")
      .select("code, expires_at, current_uses, max_uses, is_active")
      .eq("senior_id", seniorId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!codeData) {
      return {
        code: null,
        expiresAt: null,
        currentUses: 0,
        maxUses: 0,
        remainingUses: 0,
        isActive: false,
      };
    }

    return {
      code: codeData.code,
      expiresAt: new Date(codeData.expires_at),
      currentUses: codeData.current_uses,
      maxUses: codeData.max_uses,
      remainingUses: codeData.max_uses - codeData.current_uses,
      isActive: codeData.is_active && new Date(codeData.expires_at) > new Date(),
    };
  } catch (error) {
    console.error("❌ Error getting code statistics:", error);
    throw error;
  }
}

// =====================================================
// ANCIENNES FONCTIONS (SYSTÈME EMAIL) - À SUPPRIMER
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
      .select("first_name, last_name, phone")
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
        is_primary_contact: false,
        notification_preferences: inviteData.notificationPreferences,
        access_level: inviteData.accessLevel,
      });

      console.log("✅ Family relation created for existing user");

      // Envoyer un email de notification à l'utilisateur existant
      // Utiliser Supabase Auth pour envoyer un email personnalisé
      await sendNotificationEmail(existingUser.email, {
        type: "family_access_granted",
        inviterName: `${currentUser.first_name} ${currentUser.last_name}`,
        seniorName: `${senior.first_name} ${senior.last_name}`,
        relationship: inviteData.relationship,
        accessLevel: inviteData.accessLevel,
      });
    } else {
      // L'utilisateur n'existe pas - créer une invitation avec Magic Link
      console.log("📨 User doesn't exist, creating invitation with magic link");

      const invitationToken = generateId();

      // Stocker l'invitation dans la base
      const { data: invitation, error: inviteError } = await supabase
        .from("family_invitations")
        .insert({
          id: invitationToken,
          senior_id: inviteData.seniorId,
          inviter_id: currentUser.id,
          email: inviteData.email.toLowerCase(),
          relationship: inviteData.relationship,
          access_level: inviteData.accessLevel,
          notification_preferences: inviteData.notificationPreferences,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(), // 7 jours
          status: "pending",
          invitation_metadata: {
            inviterName: `${currentUser.first_name} ${currentUser.last_name}`,
            seniorName: `${senior.first_name} ${senior.last_name}`,
            seniorPhone: senior.phone,
          },
        })
        .select()
        .single();

      if (inviteError) {
        throw inviteError;
      }

      // Envoyer le Magic Link via Supabase Auth
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: inviteData.email,
        options: {
          // Ces données seront disponibles dans le template d'email
          data: {
            invitation_token: invitationToken,
            inviter_name: `${currentUser.first_name} ${currentUser.last_name}`,
            senior_name: `${senior.first_name} ${senior.last_name}`,
            relationship: inviteData.relationship,
            access_level: inviteData.accessLevel,
            type: "family_invitation",
          },
          // URL de redirection après connexion
          emailRedirectTo: `${window.location.origin}/auth/accept-invitation?token=${invitationToken}`,
        },
      });

      if (magicLinkError) {
        // Nettoyer l'invitation en cas d'erreur
        await supabase
          .from("family_invitations")
          .delete()
          .eq("id", invitationToken);

        throw magicLinkError;
      }

      console.log("✅ Magic link invitation sent successfully");
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
          last_name,
          phone
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

async function sendNotificationEmail(
  email: string,
  metadata: any
): Promise<void> {
  try {
    // Utiliser une fonction Edge/API pour envoyer l'email
    // ou un webhook Supabase qui déclenche l'envoi

    // Pour l'instant, on peut utiliser un appel à une fonction Edge
    const { error } = await supabase.functions.invoke("send-email", {
      body: {
        to: email,
        template: "family_access_granted",
        data: metadata,
      },
    });

    if (error) {
      console.error("Failed to send notification email:", error);
      // Ne pas faire échouer l'invitation si l'email échoue
    }
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

export async function acceptInvitationAfterAuth(token: string): Promise<any> {
  try {
    console.log("✅ Accepting invitation after auth:", token);

    // Récupérer l'utilisateur connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Récupérer l'invitation
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invitation invalide");
    }

    // Vérifier que l'email correspond
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      throw new Error("Cette invitation n'est pas pour cet email");
    }

    // Vérifier si l'utilisateur a un profil dans public.users
    let userId = user.id;
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!userProfile) {
      // Créer le profil utilisateur s'il n'existe pas
      const { error: createError } = await supabase.from("users").insert({
        id: userId,
        email: user.email!,
        user_type: "family",
        first_name:
          user.user_metadata?.first_name || invitation.email.split("@")[0],
        last_name: user.user_metadata?.last_name || "",
        is_active: true,
      });

      if (createError && createError.code !== "23505") {
        // Ignorer si déjà existe
        throw createError;
      }
    }

    // Créer la relation familiale
    await createFamilyRelation({
      user_id: userId,
      senior_id: invitation.senior_id,
      relationship: invitation.relationship,
      is_primary_contact: false,
      notification_preferences: invitation.notification_preferences,
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
export async function getPendingInvitationsForEmail(email: string) {
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
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ Failed to get pending invitations:", error);
    return [];
  }
}
