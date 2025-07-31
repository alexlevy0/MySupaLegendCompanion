import { deleteSenior, getSeniorStats } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import SeniorDetailsModal from "./SeniorDetailsModal";

interface SeniorDetailProps {
  senior: {
    id: string;
    relationship: string;
    is_primary_contact: boolean;
    seniors: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
      birth_date?: string;
      preferred_call_time: string;
      call_frequency: number;
      address?: any;
      emergency_contact?: string;
      created_at: string;
    };
  };
  onBack: () => void;
  onEdit?: (seniorId: string) => void;
}

interface SeniorStats {
  totalCalls: number;
  totalAlerts: number;
  lastWellBeingScore: number | null;
  lastMetricDate: string | null;
}

export default function SeniorDetailScreen({
  senior,
  onBack,
  onEdit,
}: SeniorDetailProps) {
  const [stats, setStats] = useState<SeniorStats>({
    totalCalls: 0,
    totalAlerts: 0,
    lastWellBeingScore: null,
    lastMetricDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const seniorInfo = senior.seniors;

  // Charger les statistiques
  const loadStats = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const seniorStats = await getSeniorStats(seniorInfo.id);
      setStats(seniorStats);
    } catch (error) {
      console.error("❌ Failed to load senior stats:", error);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [seniorInfo.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats(false);
  };

  // Calculer l'âge
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Formater la date de dernière métrique
  const formatLastMetricDate = (dateString?: string | null) => {
    if (!dateString) return "Aucune donnée";

    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString("fr-FR");
  };

  // Score de bien-être avec couleur
  const getWellBeingColor = (score?: number | null) => {
    if (!score) return "#94a3b8";
    if (score >= 80) return "#10b981"; // Vert
    if (score >= 60) return "#f59e0b"; // Orange
    return "#ef4444"; // Rouge
  };

  const getWellBeingLabel = (score?: number | null) => {
    if (!score) return "Non évalué";
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Correct";
    return "À surveiller";
  };

  // Actions du menu
  const handleEditProfile = () => {
    Alert.alert(
      "✏️ Modifier le profil",
      "Cette fonctionnalité sera bientôt disponible",
      [{ text: "OK" }]
    );
    // TODO: Naviguer vers l'écran d'édition
    onEdit?.(seniorInfo.id);
  };

  const handleViewCalls = () => {
    setShowDetailsModal(true);
  };

  const handleViewAlerts = () => {
    setShowDetailsModal(true);
  };

  const handleDeleteSenior = () => {
    Alert.alert(
      "⚠️ Supprimer le senior",
      `Êtes-vous sûr de vouloir supprimer ${seniorInfo.first_name} ${seniorInfo.last_name} ?\n\nCette action :\n• Arrêtera les appels quotidiens\n• Supprimera l'historique\n• Ne peut pas être annulée`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSenior(seniorInfo.id);
              Alert.alert(
                "Senior supprimé",
                `${seniorInfo.first_name} a été retiré de MyCompanion.`,
                [{ text: "OK", onPress: onBack }]
              );
            } catch (error: any) {
              Alert.alert("Erreur", error.message);
            }
          },
        },
      ]
    );
  };

  const age = calculateAge(seniorInfo.birth_date);
  const wellBeingScore = stats.lastWellBeingScore;
  const wellBeingColor = getWellBeingColor(wellBeingScore);
  const wellBeingLabel = getWellBeingLabel(wellBeingScore);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {seniorInfo.first_name} {seniorInfo.last_name}
          </Text>
          <Text style={styles.headerSubtitle}>
            {senior.relationship}
            {age && ` • ${age} ans`}
            {senior.is_primary_contact && " • Contact principal"}
          </Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4f46e5"]}
            tintColor="#4f46e5"
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Chargement des données...</Text>
          </View>
        ) : (
          <>
            {/* Score de bien-être */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 État de bien-être</Text>

              <View style={styles.wellBeingContainer}>
                <View style={styles.wellBeingScore}>
                  <Text style={[styles.scoreNumber, { color: wellBeingColor }]}>
                    {wellBeingScore ? Math.round(wellBeingScore) : "--"}
                  </Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>

                <View style={styles.wellBeingInfo}>
                  <Text
                    style={[styles.wellBeingLabel, { color: wellBeingColor }]}
                  >
                    {wellBeingLabel}
                  </Text>
                  <Text style={styles.wellBeingDate}>
                    Dernière évaluation :{" "}
                    {formatLastMetricDate(stats.lastMetricDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${wellBeingScore || 0}%`,
                      backgroundColor: wellBeingColor,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Statistiques rapides */}
            <View style={styles.statsContainer}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={handleViewCalls}
              >
                <Text style={styles.statNumber}>{stats.totalCalls}</Text>
                <Text style={styles.statLabel}>📞 Appels reçus</Text>
                <Text style={styles.statHint}>Voir l'historique →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={handleViewAlerts}
              >
                <Text
                  style={[
                    styles.statNumber,
                    { color: stats.totalAlerts > 0 ? "#f59e0b" : "#10b981" },
                  ]}
                >
                  {stats.totalAlerts}
                </Text>
                <Text style={styles.statLabel}>🚨 Alertes</Text>
                <Text style={styles.statHint}>
                  {stats.totalAlerts === 0
                    ? "Tout va bien ✅"
                    : "Voir les détails →"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Informations de contact */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📱 Informations de contact</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{seniorInfo.phone}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Appels quotidiens</Text>
                <Text style={styles.infoValue}>
                  {seniorInfo.preferred_call_time}
                  {seniorInfo.call_frequency > 1 &&
                    ` (${seniorInfo.call_frequency}x/jour)`}
                </Text>
              </View>

              {seniorInfo.emergency_contact &&
                seniorInfo.emergency_contact !== seniorInfo.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Contact d'urgence</Text>
                    <Text style={styles.infoValue}>
                      {seniorInfo.emergency_contact}
                    </Text>
                  </View>
                )}

              {seniorInfo.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Adresse</Text>
                  <Text style={styles.infoValue}>
                    {typeof seniorInfo.address === "string"
                      ? JSON.parse(seniorInfo.address).city || "Non renseignée"
                      : seniorInfo.address.city || "Non renseignée"}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Inscrit depuis</Text>
                <Text style={styles.infoValue}>
                  {new Date(seniorInfo.created_at).toLocaleDateString("fr-FR")}
                </Text>
              </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ Actions rapides</Text>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewCalls}
              >
                <Text style={styles.actionIcon}>📞</Text>
                <Text style={styles.actionText}>
                  Voir l'historique des appels
                </Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewAlerts}
              >
                <Text style={styles.actionIcon}>🚨</Text>
                <Text style={styles.actionText}>Consulter les alertes</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert(
                    "📊 Rapports",
                    "Fonctionnalité en développement. Vous recevrez bientôt des rapports détaillés par email.",
                    [{ text: "OK" }]
                  );
                }}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Télécharger un rapport</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionText}>Modifier les préférences</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Zone dangereuse */}
            <View style={styles.dangerCard}>
              <Text style={styles.dangerTitle}>⚠️ Zone dangereuse</Text>
              <Text style={styles.dangerDescription}>
                Supprimer ce senior arrêtera définitivement les appels
                MyCompanion.
              </Text>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleDeleteSenior}
              >
                <Text style={styles.dangerButtonText}>
                  🗑️ Supprimer ce senior
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal des détails */}
      <SeniorDetailsModal
        visible={showDetailsModal}
        seniorId={seniorInfo.id}
        seniorName={`${seniorInfo.first_name} ${seniorInfo.last_name}`}
        onClose={() => setShowDetailsModal(false)}
      />
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  card: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  wellBeingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  wellBeingScore: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: 20,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: "bold",
  },
  scoreMax: {
    fontSize: 18,
    color: "#94a3b8",
    marginLeft: 4,
  },
  wellBeingInfo: {
    flex: 1,
  },
  wellBeingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  wellBeingDate: {
    fontSize: 14,
    color: "#64748b",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  statHint: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  actionArrow: {
    fontSize: 16,
    color: "#94a3b8",
  },
  dangerCard: {
    backgroundColor: "#fef2f2",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: "#7f1d1d",
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
