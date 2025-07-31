// SeniorsListScreen.tsx (mis à jour avec EditSeniorForm)
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
import EditSeniorForm from "@/components/EditSeniorForm";
import FamilySharingScreen from "@/components/FamilySharingScreen";
import { useTranslation } from "@/hooks/useTranslation";
import {
    deleteSenior,
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
  lastWellBeingScore?: number | null;
  lastMetricDate?: string | null;
}

export default function SeniorsListScreen() {
  const { userProfile, isFamily, isSAAD } = useMyCompanionAuth();
  const { t } = useTranslation();

  // États principaux
  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour les modals
  const [showAddSenior, setShowAddSenior] = useState(false);
  const [showEditSenior, setShowEditSenior] = useState(false);
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
        t('common.error'),
        t('seniors.errorLoadingSeniors')
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

  // Gérer l'édition d'un senior
  const handleEditSenior = (senior: Senior) => {
    console.log("✏️ Opening edit form for:", senior.seniors.first_name);
    setSelectedSenior(senior);
    setShowEditSenior(true);
  };

  const handleEditSeniorSuccess = (seniorId: string) => {
    console.log("✅ Senior updated successfully:", seniorId);
    setShowEditSenior(false);
    setSelectedSenior(null);
    loadSeniors(); // Recharger la liste
  };

  const handleCloseEditSenior = () => {
    setShowEditSenior(false);
    setSelectedSenior(null);
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

  // Gérer la suppression d'un senior
  const handleDeleteSenior = (senior: Senior) => {
    Alert.alert(
      t('seniors.deleteSeniorConfirm'),
      t('seniors.deleteSeniorMessage', { 
        firstName: senior.seniors.first_name, 
        lastName: senior.seniors.last_name 
      }),
      [
        {
          text: t('profile.cancel'),
          style: "cancel",
        },
        {
          text: t('profile.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSenior(senior.seniors.id);
              Alert.alert(
                t('seniors.seniorDeleted'),
                t('seniors.seniorDeletedMessage', { firstName: senior.seniors.first_name })
              );
              loadSeniors(); // Recharger la liste
            } catch (error: any) {
              Alert.alert(
                t('common.error'),
                error.message || t('seniors.errorDeletingSenior')
              );
            }
          },
        },
      ]
    );
  };

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
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

    if (diffInDays === 0) return t('seniors.today');
    if (diffInDays === 1) return t('seniors.yesterday');
    if (diffInDays < 7) return t('seniors.daysAgo', { days: diffInDays });
    if (diffInDays < 30) return t('seniors.weeksAgo', { weeks: Math.floor(diffInDays / 7) });
    return t('seniors.monthsAgo', { months: Math.floor(diffInDays / 30) });
  };

  // Options contextuelles pour un senior
  const showSeniorOptions = (senior: Senior) => {
    const options = [
      {
        text: t('seniors.viewDetails'),
        onPress: () => Alert.alert(t('common.error'), t('seniors.featureInDevelopment')),
      },
      {
        text: t('seniors.editSenior'),
        onPress: () => handleEditSenior(senior),
      },
      {
        text: t('seniors.manageFamily'),
        onPress: () => handleManageFamily(senior),
      },
      {
        text: t('seniors.callHistory'),
        onPress: () => Alert.alert(t('common.error'), t('seniors.callHistoryDev')),
      },
    ];

    // Ajouter l'option de suppression seulement pour le contact principal
    if (senior.is_primary_contact) {
      options.push({
        text: t('seniors.deleteSenior'),
        onPress: () => handleDeleteSenior(senior),
      });
    }

    options.push({
      text: t('profile.cancel'),
      onPress: () => {},
    });

    Alert.alert(
      `${senior.seniors.first_name} ${senior.seniors.last_name}`,
      t('seniors.seniorOptions'),
      options
    );
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
      <TouchableOpacity
        style={styles.seniorCard}
        onPress={() => showSeniorOptions(item)}
        onLongPress={() => showSeniorOptions(item)}
      >
        {/* Header avec infos principales */}
        <View style={styles.seniorHeader}>
          <View style={styles.seniorInfo}>
            <Text style={styles.seniorName}>
              {senior.first_name} {senior.last_name}
              {item.is_primary_contact && " 👑"}
            </Text>

            <View style={styles.seniorDetails}>
              <Text style={styles.seniorDetail}>📞 {senior.phone}</Text>
              {age && <Text style={styles.seniorDetail}>🎂 {t('seniors.yearsOld', { age })}</Text>}
              <Text style={styles.seniorDetail}>
                ⏰ {t('seniors.callsAt', { time: senior.preferred_call_time, frequency: senior.call_frequency })}
              </Text>
            </View>

            <Text style={styles.relationship}>
              {t('seniors.yourRelationship', { relationship: item.relationship, accessLevel: item.access_level })}
            </Text>
          </View>

          <View style={styles.seniorBadge}>
            <Text style={styles.seniorInitials}>
              {senior.first_name.charAt(0)}
              {senior.last_name.charAt(0)}
            </Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalCalls}</Text>
            <Text style={styles.statLabel}>{t('seniors.calls')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
            <Text style={styles.statLabel}>{t('seniors.alerts')}</Text>
          </View>
          {stats.lastWellBeingScore && (
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {Math.round(stats.lastWellBeingScore * 100)}%
              </Text>
              <Text style={styles.statLabel}>{t('seniors.wellbeing')}</Text>
            </View>
          )}
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatLastActivity(senior.created_at)}
            </Text>
            <Text style={styles.statLabel}>{t('seniors.added')}</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.editAction]}
            onPress={(e) => {
              e.stopPropagation();
              handleEditSenior(item);
            }}
          >
            <Text style={styles.quickActionText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.familyAction]}
            onPress={(e) => {
              e.stopPropagation();
              handleManageFamily(item);
            }}
          >
            <Text style={styles.quickActionText}>👨‍👩‍👧‍👦</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, styles.callsAction]}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(t('common.error'), t('seniors.callHistoryDev'));
            }}
          >
            <Text style={styles.quickActionText}>📞</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Message si pas de seniors
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👴</Text>
      <Text style={styles.emptyTitle}>{t('seniors.noSeniors')}</Text>
      <Text style={styles.emptyMessage}>
        {t('seniors.noSeniorsMessage')}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowAddSenior(true)}
      >
        <Text style={styles.emptyButtonText}>{t('seniors.addFirstSenior')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Écran de chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('seniors.loadingSeniors')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('seniors.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('seniors.subtitle', { count: seniors.length })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddSenior(true)}
        >
          <Text style={styles.addButtonText}>{t('seniors.addButton')}</Text>
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

      {/* Modal - Éditer un senior */}
      <Modal
        visible={showEditSenior}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedSenior && (
          <EditSeniorForm
            seniorId={selectedSenior.seniors.id}
            onSuccess={handleEditSeniorSuccess}
            onCancel={handleCloseEditSenior}
          />
        )}
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
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  quickActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editAction: {
    backgroundColor: "#f59e0b",
  },
  familyAction: {
    backgroundColor: "#10b981",
  },
  callsAction: {
    backgroundColor: "#6366f1",
  },
  quickActionText: {
    fontSize: 16,
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
