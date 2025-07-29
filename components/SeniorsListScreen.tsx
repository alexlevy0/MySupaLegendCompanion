import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AddSeniorForm from "@/components/AddSeniorForm";
import FamilySharingScreen from "@/components/FamilySharingScreen";
import {
    getSeniorStats,
    getUserSeniors,
    useMyCompanionAuth,
} from "@/utils/SupaLegend";

interface Senior {
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
  relationship: string;
  is_primary_contact: boolean;
  access_level: string;
}

interface SeniorStats {
  totalCalls: number;
  totalAlerts: number;
  lastWellBeingScore?: number;
  lastMetricDate?: string;
}

export default function SeniorsListScreen() {
  const { userProfile, isFamily, isSAAD } = useMyCompanionAuth();

  // États principaux
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour les modals
  const [showAddSenior, setShowAddSenior] = useState(false);
  const [showFamilySharing, setShowFamilySharing] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState<Senior | null>(null);

  // États pour les statistiques
  const [seniorStats, setSeniorStats] = useState<Record<string, SeniorStats>>(
    {}
  );

  // Charger la liste des seniors
  const loadSeniors = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log("📊 Loading seniors for user:", userProfile?.id);

      const seniorsData = await getUserSeniors();
      setSeniors(seniorsData);

      // Charger les statistiques pour chaque senior
      const statsPromises = seniorsData.map(async (seniorRelation) => {
        const stats = await getSeniorStats(seniorRelation.seniors.id);
        return { seniorId: seniorRelation.seniors.id, stats };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, SeniorStats> = {};
      statsResults.forEach(({ seniorId, stats }) => {
        statsMap[seniorId] = stats;
      });
      setSeniorStats(statsMap);

      console.log("✅ Seniors loaded:", seniorsData.length);
    } catch (error) {
      console.error("❌ Failed to load seniors:", error);
      Alert.alert(
        "Erreur",
        "Impossible de charger la liste des seniors. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au montage du composant
  useEffect(() => {
    if (userProfile && (isFamily || isSAAD)) {
      loadSeniors();
    }
  }, [userProfile, isFamily, isSAAD]);

  // Gérer l'ajout d'un nouveau senior
  const handleAddSeniorSuccess = (seniorId: string) => {
    console.log("✅ Senior added successfully:", seniorId);
    setShowAddSenior(false);
    loadSeniors(); // Recharger la liste
  };

  // Gérer l'ouverture du partage familial
  const handleManageFamily = (senior: Senior) => {
    console.log("👨‍👩‍👧‍👦 Opening family sharing for:", senior.seniors.first_name);
    setSelectedSenior(senior);
    setShowFamilySharing(true);
  };

  // Fermer le partage familial
  const handleCloseFamilySharing = () => {
    setShowFamilySharing(false);
    setSelectedSenior(null);
    loadSeniors(); // Recharger pour avoir les dernières données
  };

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  // Formatage de la dernière activité
  const formatLastActivity = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMs = now.getTime() - activityDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffInDays / 30)} mois`;
  };

  // Rendu d'un senior
  const renderSenior = ({ item }: { item: Senior }) => {
    const senior = item.seniors;
    const stats = seniorStats[senior.id] || {
      totalCalls: 0,
      totalAlerts: 0,
    };
    const age = calculateAge(senior.birth_date);

    return (
      <View style={styles.seniorCard}>
        {/* Header avec infos principales */}
        <View style={styles.seniorHeader}>
          <View style={styles.seniorInfo}>
            <Text style={styles.seniorName}>
              {senior.first_name} {senior.last_name}
              {item.is_primary_contact && " 👑"}
            </Text>
            
            <View style={styles.seniorDetails}>
              <Text style={styles.seniorDetail}>
                📞 {senior.phone}
              </Text>
              {age && (
                <Text style={styles.seniorDetail}>
                  🎂 {age} ans
                </Text>
              )}
              <Text style={styles.seniorDetail}>
                ⏰ Appels à {senior.preferred_call_time} ({senior.call_frequency}x/jour)
              </Text>
            </View>

            <Text style={styles.relationship}>
              Votre {item.relationship} • Accès {item.access_level}
            </Text>
          </View>

          <View style={styles.seniorBadge}>
            <Text style={styles.seniorInitials}>
              {senior.first_name.charAt(0)}{senior.last_name.charAt(0)}
            </Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalCalls}</Text>
            <Text style={styles.statLabel}>Appels</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
            <Text style={styles.statLabel}>Alertes</Text>
          </View>
          {stats.lastWellBeingScore && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round(stats.lastWellBeingScore * 100)}%
              </Text>
              <Text style={styles.statLabel}>Bien-être</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatLastActivity(senior.created_at)}
            </Text>
            <Text style={styles.statLabel}>Ajouté</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => {
              // Navigation vers les détails du senior
              Alert.alert("Info", "Voir les détails de " + senior.first_name);
            }}
          >
            <Text style={styles.primaryActionText}>📊 Voir détails</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => handleManageFamily(item)}
          >
            <Text style={styles.secondaryActionText}>👨‍👩‍👧‍👦 Famille</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => {
              // Navigation vers l'historique des appels
              Alert.alert("Info", "Historique des appels de " + senior.first_name);
            }}
          >
            <Text style={styles.secondaryActionText}>📞 Appels</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Message si pas de seniors
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👴</Text>
      <Text style={styles.emptyTitle}>Aucun senior ajouté</Text>
      <Text style={styles.emptyMessage}>
        Commencez par ajouter un proche pour qu'MyCompanion puisse l'appeler
        quotidiennement et veiller sur son bien-être.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowAddSenior(true)}
      >
        <Text style={styles.emptyButtonText}>+ Ajouter mon premier senior</Text>
      </TouchableOpacity>
    </View>
  );

  // Écran de chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement de vos seniors...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>👴 Mes Seniors</Text>
          <Text style={styles.headerSubtitle}>
            {seniors.length} senior{seniors.length > 1 ? "s" : ""} sous votre
            protection
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddSenior(true)}
        >
          <Text style={styles.addButtonText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des seniors */}
      <FlatList
        data={seniors}
        renderItem={renderSenior}
        keyExtractor={(item) => item.seniors.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => loadSeniors(true)}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Modal - Ajouter un senior */}
      <Modal
        visible={showAddSenior}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <AddSeniorForm
          onSuccess={handleAddSeniorSuccess}
          onCancel={() => setShowAddSenior(false)}
        />
      </Modal>

      {/* Modal - Partage familial */}
      <Modal
        visible={showFamilySharing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedSenior && (
          <FamilySharingScreen
            senior={{
              id: selectedSenior.seniors.id,
              first_name: selectedSenior.seniors.first_name,
              last_name: selectedSenior.seniors.last_name,
            }}
            onBack={handleCloseFamilySharing}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  addButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
  },
  seniorCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  seniorHeader: {
    flexDirection: "row",
    marginBottom: 16,
  },
  seniorInfo: {
    flex: 1,
    marginRight: 16,
  },
  seniorName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  seniorDetails: {
    marginBottom: 8,
  },
  seniorDetail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  relationship: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  seniorBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
  },
  seniorInitials: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryAction: {
    backgroundColor: "#4f46e5",
  },
  primaryActionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryAction: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  secondaryActionText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});