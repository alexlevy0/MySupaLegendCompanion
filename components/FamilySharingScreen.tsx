import {
    getFamilyMembers,
    inviteFamilyMember,
    removeFamilyMember,
    updateFamilyMemberAccess
} from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface FamilyMember {
  id: string;
  user_id: string;
  relationship: string;
  is_primary_contact: boolean;
  access_level: "minimal" | "standard" | "full";
  notification_preferences: any;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

interface FamilySharingProps {
  senior: {
    id: string;
    first_name: string;
    last_name: string;
  };
  onBack: () => void;
}

export default function FamilySharingScreen({
  senior,
  onBack,
}: FamilySharingProps) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // État du formulaire d'invitation
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("enfant");
  const [inviteAccessLevel, setInviteAccessLevel] = useState<
    "minimal" | "standard" | "full"
  >("standard");
  const [inviteNotifications, setInviteNotifications] = useState({
    dailyReports: false,
    emergencyAlerts: true,
    weeklyReports: true,
    smsAlerts: false,
  });
  const [sending, setSending] = useState(false);

  // Charger les membres de la famille
  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const familyMembers = await getFamilyMembers(senior.id);
      setMembers(familyMembers);
    } catch (error) {
      console.error("❌ Failed to load family members:", error);
      Alert.alert("Erreur", "Impossible de charger les membres de la famille");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
  }, [senior.id]);

  // Envoyer une invitation
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une adresse email");
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      Alert.alert("Erreur", "Veuillez saisir une adresse email valide");
      return;
    }

    setSending(true);
    try {
      await inviteFamilyMember({
        seniorId: senior.id,
        email: inviteEmail.trim(),
        relationship: inviteRelationship,
        accessLevel: inviteAccessLevel,
        notificationPreferences: inviteNotifications,
      });

      Alert.alert(
        "✉️ Invitation envoyée !",
        `Une invitation a été envoyée à ${inviteEmail}.\n\nLa personne recevra un email avec un lien pour créer son compte et accéder aux informations de ${senior.first_name}.`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowInviteForm(false);
              setInviteEmail("");
              loadFamilyMembers(); // Recharger la liste
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible d'envoyer l'invitation"
      );
    } finally {
      setSending(false);
    }
  };

  // Modifier l'accès d'un membre
  const handleUpdateAccess = (
    memberId: string,
    newAccessLevel: "minimal" | "standard" | "full"
  ) => {
    Alert.alert(
      "Modifier l'accès",
      `Changer le niveau d'accès vers "${getAccessLevelLabel(
        newAccessLevel
      )}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              await updateFamilyMemberAccess(memberId, newAccessLevel);
              await loadFamilyMembers();
              Alert.alert("✅ Modifié", "Niveau d'accès mis à jour");
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  // Retirer un membre
  const handleRemoveMember = (member: FamilyMember) => {
    if (member.is_primary_contact) {
      Alert.alert(
        "Impossible de retirer",
        "Le contact principal ne peut pas être retiré. Transférez d'abord ce rôle à un autre membre."
      );
      return;
    }

    Alert.alert(
      "⚠️ Retirer de la famille",
      `Êtes-vous sûr de vouloir retirer ${member.users?.first_name} ${member.users?.last_name} ?\n\nCette personne n'aura plus accès aux informations de ${senior.first_name}.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFamilyMember(member.id);
              await loadFamilyMembers();
              Alert.alert("✅ Retiré", "Membre retiré de la famille");
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  // Helpers pour les labels
  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case "minimal":
        return "Minimal (urgences seulement)";
      case "standard":
        return "Standard (rapports + urgences)";
      case "full":
        return "Complet (tout)";
      default:
        return level;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "minimal":
        return "#f59e0b";
      case "standard":
        return "#10b981";
      case "full":
        return "#4f46e5";
      default:
        return "#94a3b8";
    }
  };

  // Rendu d'un membre de famille
  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.users?.first_name} {item.users?.last_name}
            {item.is_primary_contact && " 👑"}
          </Text>
          <Text style={styles.memberEmail}>{item.users?.email}</Text>
          <Text style={styles.memberRelation}>
            {item.relationship} • Ajouté le{" "}
            {new Date(item.created_at).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        <View style={styles.memberBadge}>
          <Text
            style={[
              styles.accessBadge,
              { backgroundColor: getAccessLevelColor(item.access_level) },
            ]}
          >
            {item.access_level.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.memberActions}>
        <Text style={styles.accessLabel}>Niveau d'accès :</Text>
        <View style={styles.accessButtons}>
          {(["minimal", "standard", "full"] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.accessButton,
                item.access_level === level && styles.accessButtonActive,
                { borderColor: getAccessLevelColor(level) },
              ]}
              onPress={() => {
                if (item.access_level !== level) {
                  handleUpdateAccess(item.id, level);
                }
              }}
            >
              <Text
                style={[
                  styles.accessButtonText,
                  item.access_level === level && {
                    color: getAccessLevelColor(level),
                  },
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!item.is_primary_contact && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item)}
          >
            <Text style={styles.removeButtonText}>🗑️ Retirer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Formulaire d'invitation
  const renderInviteForm = () => (
    <View style={styles.inviteForm}>
      <Text style={styles.formTitle}>👨‍👩‍👧‍👦 Inviter un membre de famille</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse email *</Text>
        <TextInput
          style={styles.input}
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="marie.dubois@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Lien de parenté</Text>
        <View style={styles.relationButtons}>
          {["enfant", "conjoint(e)", "frère/sœur", "petit-enfant", "autre"].map(
            (relation) => (
              <TouchableOpacity
                key={relation}
                style={[
                  styles.relationButton,
                  inviteRelationship === relation &&
                    styles.relationButtonActive,
                ]}
                onPress={() => setInviteRelationship(relation)}
              >
                <Text
                  style={[
                    styles.relationButtonText,
                    inviteRelationship === relation &&
                      styles.relationButtonTextActive,
                  ]}
                >
                  {relation}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Niveau d'accès</Text>
        <View style={styles.accessOptions}>
          {(
            [
              { key: "minimal", label: "Minimal", desc: "Urgences seulement" },
              {
                key: "standard",
                label: "Standard",
                desc: "Rapports + urgences",
              },
              { key: "full", label: "Complet", desc: "Accès à tout" },
            ] as const
          ).map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.accessOption,
                inviteAccessLevel === option.key && styles.accessOptionActive,
              ]}
              onPress={() => setInviteAccessLevel(option.key)}
            >
              <Text
                style={[
                  styles.accessOptionTitle,
                  inviteAccessLevel === option.key &&
                    styles.accessOptionTitleActive,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.accessOptionDesc}>{option.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notifications</Text>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Rapports quotidiens</Text>
          <Switch
            value={inviteNotifications.dailyReports}
            onValueChange={(value) =>
              setInviteNotifications({
                ...inviteNotifications,
                dailyReports: value,
              })
            }
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Alertes d'urgence</Text>
          <Switch
            value={inviteNotifications.emergencyAlerts}
            onValueChange={(value) =>
              setInviteNotifications({
                ...inviteNotifications,
                emergencyAlerts: value,
              })
            }
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Résumés hebdomadaires</Text>
          <Switch
            value={inviteNotifications.weeklyReports}
            onValueChange={(value) =>
              setInviteNotifications({
                ...inviteNotifications,
                weeklyReports: value,
              })
            }
          />
        </View>
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => setShowInviteForm(false)}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={handleSendInvite}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.sendButtonText}>✉️ Envoyer l'invitation</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Partage familial</Text>
          <Text style={styles.headerSubtitle}>
            {senior.first_name} {senior.last_name}
          </Text>
        </View>

        {!showInviteForm && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowInviteForm(true)}
          >
            <Text style={styles.inviteButtonText}>+ Inviter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenu */}
      {showInviteForm ? (
        renderInviteForm()
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          renderItem={renderFamilyMember}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                👨‍👩‍👧‍👦 {members.length} membre{members.length > 1 ? "s" : ""} de
                famille
              </Text>
              <Text style={styles.listSubtitle}>
                Les membres peuvent consulter les informations de{" "}
                {senior.first_name} selon leur niveau d'accès.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  inviteButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  listHeader: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  listSubtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  memberCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  memberRelation: {
    fontSize: 12,
    color: "#94a3b8",
  },
  memberBadge: {
    alignItems: "center",
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: "white",
    fontWeight: "600",
  },
  memberActions: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  accessLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  accessButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  accessButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  accessButtonActive: {
    backgroundColor: "#f8fafc",
  },
  accessButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  removeButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#fef2f2",
  },
  removeButtonText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  inviteForm: {
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  relationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  relationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  relationButtonActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  relationButtonText: {
    fontSize: 14,
    color: "#64748b",
  },
  relationButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  accessOptions: {
    gap: 12,
  },
  accessOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  accessOptionActive: {
    borderColor: "#4f46e5",
    backgroundColor: "#f8fafc",
  },
  accessOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  accessOptionTitleActive: {
    color: "#4f46e5",
  },
  accessOptionDesc: {
    fontSize: 14,
    color: "#64748b",
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  notificationLabel: {
    fontSize: 16,
    color: "#374151",
  },
  formButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButton: {
    backgroundColor: "#4f46e5",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
