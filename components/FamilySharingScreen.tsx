import {
    getFamilyMembers,
    removeFamilyMember,
    updateFamilyMemberAccess,
    generateFamilyCode,
    regenerateFamilyCode,
    getFamilyCode,
    getCodeStatistics
} from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Alert from "@/utils/Alert";
import CodeCard from "./CodeCard";
import CodeInput from "./CodeInput";
import { Ionicons } from "@expo/vector-icons";
import { joinFamilyWithCode } from "@/utils/SupaLegend";

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
  const [loadingCode, setLoadingCode] = useState(false);
  
  // État du code famille
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [codeStatistics, setCodeStatistics] = useState<any>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  
  // État pour afficher/masquer la section rejoindre
  const [showJoinSection, setShowJoinSection] = useState(false);
  const [joiningFamily, setJoiningFamily] = useState(false);

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

  // Charger le code famille et ses statistiques
  const loadFamilyCode = async () => {
    try {
      setLoadingCode(true);
      const [code, stats] = await Promise.all([
        getFamilyCode(senior.id),
        getCodeStatistics(senior.id),
      ]);
      setFamilyCode(code);
      setCodeStatistics(stats);
    } catch (error) {
      console.error("❌ Failed to load family code:", error);
    } finally {
      setLoadingCode(false);
    }
  };

  useEffect(() => {
    loadFamilyMembers();
    loadFamilyCode();
  }, [senior.id]);

  // Générer ou régénérer un code famille
  const handleGenerateCode = async () => {
    try {
      setGeneratingCode(true);
      
      const newCode = familyCode 
        ? await regenerateFamilyCode(senior.id)
        : await generateFamilyCode(senior.id);
      
      setFamilyCode(newCode);
      await loadFamilyCode();
      
      // Pas d'alerte, le code s'affiche directement dans CodeCard
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible de générer le code"
      );
    } finally {
      setGeneratingCode(false);
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

  // Rejoindre une famille avec un code
  const handleJoinFamily = async (code: string, relationship: string) => {
    try {
      setJoiningFamily(true);
      
      const result = await joinFamilyWithCode(code, relationship);
      
      if (result.success && result.seniorInfo) {
        Alert.alert(
          "✅ Bienvenue dans la famille !",
          `Vous avez maintenant accès aux informations de ${result.seniorInfo.first_name} ${result.seniorInfo.last_name}.`,
          [
            {
              text: "OK",
              onPress: () => {
                setShowJoinSection(false);
                loadFamilyMembers();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "❌ Code invalide",
          result.error || "Le code saisi n'est pas valide ou a expiré.",
          [{ text: "Réessayer" }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setJoiningFamily(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#4f46e5" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Partage familial</Text>
          <Text style={styles.headerSubtitle}>
            {senior.first_name} {senior.last_name}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Section Code Famille */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="key-outline" size={24} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Code d'accès famille</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Partagez ce code avec les membres de votre famille pour qu'ils puissent
            accéder aux informations de {senior.first_name}.
          </Text>
          
          <CodeCard
            code={familyCode}
            loading={loadingCode || generatingCode}
            statistics={codeStatistics}
            onRegenerate={handleGenerateCode}
          />
        </View>

        {/* Section Membres */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color="#4f46e5" />
            <Text style={styles.sectionTitle}>
              Membres de la famille ({members.length})
            </Text>
          </View>
          <Text style={styles.sectionDescription}>
            Les membres peuvent consulter les informations de {senior.first_name} 
            selon leur niveau d'accès.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={styles.loadingText}>Chargement des membres...</Text>
            </View>
          ) : members.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>
                Aucun membre dans la famille pour le moment
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Partagez le code famille pour inviter des proches
              </Text>
            </View>
          ) : (
            <FlatList
              data={members}
              renderItem={renderFamilyMember}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Section Aide */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
            <Text style={styles.helpText}>
              Les nouveaux membres peuvent rejoindre la famille en utilisant le code
              d'accès dans l'application MyCompanion. Le code expire après 30 jours
              ou 10 utilisations.
            </Text>
          </View>
        </View>

        {/* Section Rejoindre une autre famille */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={24} color="#4f46e5" />
            <Text style={styles.sectionTitle}>Rejoindre une autre famille</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Si vous avez reçu un code d'une autre famille, vous pouvez l'utiliser ici.
          </Text>
          
          {showJoinSection ? (
            <CodeInput onSubmit={handleJoinFamily} loading={joiningFamily} />
          ) : (
            <TouchableOpacity
              style={styles.showJoinButton}
              onPress={() => setShowJoinSection(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4f46e5" />
              <Text style={styles.showJoinButtonText}>
                Saisir un code famille
              </Text>
            </TouchableOpacity>
          )}
          
          {showJoinSection && (
            <TouchableOpacity
              style={styles.cancelJoinButton}
              onPress={() => setShowJoinSection(false)}
            >
              <Text style={styles.cancelJoinButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  backButtonText: {
    color: "#4f46e5",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  separator: {
    height: 12,
  },
  memberCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  helpSection: {
    padding: 16,
    paddingTop: 0,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  showJoinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ede9fe",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  showJoinButtonText: {
    color: "#4f46e5",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelJoinButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 12,
  },
  cancelJoinButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
});
