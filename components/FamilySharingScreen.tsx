import {
    getFamilyMembers,
    removeFamilyMember,
    updateFamilyMemberAccess
} from "@/utils/SupaLegend";
import {
    getSeniorJoinCode,
    regenerateJoinCode
} from "@/utils/supabase/services/join-code-service";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Share,
    Clipboard,
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
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  // Charger les membres de la famille et le code
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les membres en parallèle avec le code
      const [familyMembers, code] = await Promise.all([
        getFamilyMembers(senior.id),
        getSeniorJoinCode(senior.id)
      ]);
      
      setMembers(familyMembers);
      setJoinCode(code);
    } catch (error) {
      console.error("❌ Failed to load data:", error);
      Alert.alert("Erreur", "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [senior.id]);

  // Copier le code dans le presse-papiers
  const handleCopyCode = () => {
    if (joinCode) {
      Clipboard.setString(joinCode);
      Alert.alert("✅ Copié !", "Le code a été copié dans le presse-papiers");
    }
  };

  // Partager le code
  const handleShareCode = async () => {
    if (!joinCode) return;

    try {
      const message = `Rejoignez la famille de ${senior.first_name} ${senior.last_name} sur MyCompanion avec le code : ${joinCode}`;
      
      await Share.share({
        message,
        title: "Code de partage MyCompanion",
      });
    } catch (error) {
      console.error("❌ Error sharing code:", error);
    }
  };

  // Régénérer le code
  const handleRegenerateCode = () => {
    Alert.alert(
      "🔄 Régénérer le code ?",
      "L'ancien code ne fonctionnera plus. Les membres actuels gardent leur accès.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Régénérer",
          style: "destructive",
          onPress: async () => {
            try {
              setLoadingCode(true);
              const newCode = await regenerateJoinCode(senior.id);
              if (newCode) {
                setJoinCode(newCode);
                Alert.alert("✅ Code régénéré", `Le nouveau code est : ${newCode}`);
              }
            } catch (error: any) {
              Alert.alert("Erreur", error.message || "Impossible de régénérer le code");
            } finally {
              setLoadingCode(false);
            }
          },
        },
      ]
    );
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
              await loadData();
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
              await loadData();
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

  // Rendu du code de partage
  const renderJoinCodeSection = () => (
    <View style={styles.codeSection}>
      <Text style={styles.codeSectionTitle}>🔢 Code de partage famille</Text>
      <Text style={styles.codeSectionSubtitle}>
        Partagez ce code avec les membres de votre famille pour qu'ils puissent rejoindre
      </Text>
      
      <View style={styles.codeContainer}>
        {loadingCode ? (
          <ActivityIndicator size="small" color="#4f46e5" />
        ) : (
          <>
            <Text style={styles.codeText}>{joinCode || "----"}</Text>
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.codeButton}
                onPress={handleCopyCode}
                disabled={!joinCode}
              >
                <Text style={styles.codeButtonText}>📋 Copier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.codeButton}
                onPress={handleShareCode}
                disabled={!joinCode}
              >
                <Text style={styles.codeButtonText}>📤 Partager</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.codeButton, styles.regenerateButton]}
                onPress={handleRegenerateCode}
                disabled={loadingCode}
              >
                <Text style={styles.regenerateButtonText}>🔄 Nouveau</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );

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
      </View>

      {/* Contenu */}
      {loading ? (
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
            <>
              {renderJoinCodeSection()}
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
            </>
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
  codeSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  codeSectionSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  codeContainer: {
    alignItems: "center",
  },
  codeText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4f46e5",
    letterSpacing: 8,
    marginBottom: 20,
  },
  codeActions: {
    flexDirection: "row",
    gap: 12,
  },
  codeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4f46e5",
  },
  regenerateButton: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  regenerateButtonText: {
    color: "#ea580c",
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
});
