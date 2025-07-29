import AddSeniorForm from "@/components/AddSeniorForm";
import { getUserSeniors, useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Senior {
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
    created_at: string;
  };
}

export default function SeniorsScreen() {
  const { userProfile, isFamily } = useMyCompanionAuth();

  const [seniors, setSeniors] = useState<Senior[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Charger les seniors de l'utilisateur
  const loadSeniors = async (showLoader = true) => {
    if (!userProfile) return;

    try {
      if (showLoader) setLoading(true);
      const userSeniors = await getUserSeniors(userProfile.id);
      setSeniors(userSeniors);
      console.log("📊 Loaded seniors:", userSeniors.length);
    } catch (error) {
      console.error("❌ Failed to load seniors:", error);
      Alert.alert("Erreur", "Impossible de charger la liste des seniors");
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au montage du composant
  useEffect(() => {
    loadSeniors();
  }, [userProfile]);

  // Refresh pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadSeniors(false);
  };

  // Callback après ajout réussi
  const handleSeniorAdded = (seniorId: string) => {
    console.log("✅ Senior added successfully:", seniorId);
    setShowAddForm(false);
    // Recharger la liste
    loadSeniors(false);
  };

  // Calculer l'âge approximatif
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    return age;
  };

  // Formater le temps d'appel
  const formatCallTime = (time: string, frequency: number) => {
    return frequency === 1
      ? `${time} (quotidien)`
      : `${time} (${frequency}x/jour)`;
  };

  // Rendu d'un senior dans la liste
  const renderSeniorItem = ({ item }: { item: Senior }) => {
    const senior = item.seniors;
    const age = calculateAge(senior.birth_date);

    return (
      <TouchableOpacity
        style={styles.seniorCard}
        onPress={() => {
          // TODO: Naviguer vers le détail du senior
          Alert.alert(
            "Info",
            `Détail de ${senior.first_name} ${senior.last_name}`
          );
        }}
      >
        {/* Header avec nom et relation */}
        <View style={styles.seniorHeader}>
          <View style={styles.seniorInfo}>
            <Text style={styles.seniorName}>
              {senior.first_name} {senior.last_name}
            </Text>
            <Text style={styles.seniorDetails}>
              {item.relationship}
              {age && ` • ${age} ans`}
              {item.is_primary_contact && " • Contact principal"}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>📞 Actif</Text>
          </View>
        </View>

        {/* Informations d'appel */}
        <View style={styles.seniorMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>📱 Téléphone</Text>
            <Text style={styles.metaValue}>{senior.phone}</Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>⏰ Appels</Text>
            <Text style={styles.metaValue}>
              {formatCallTime(
                senior.preferred_call_time,
                senior.call_frequency
              )}
            </Text>
          </View>

          {senior.address?.city && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>📍 Ville</Text>
              <Text style={styles.metaValue}>{senior.address.city}</Text>
            </View>
          )}
        </View>

        {/* Footer avec date d'ajout */}
        <View style={styles.seniorFooter}>
          <Text style={styles.addedDate}>
            Ajouté le {new Date(senior.created_at).toLocaleDateString("fr-FR")}
          </Text>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              // TODO: Naviguer vers les détails/statistiques
              Alert.alert(
                "📊 Statistiques",
                `Voir les données de ${senior.first_name}`
              );
            }}
          >
            <Text style={styles.viewButtonText}>Voir les détails →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // État vide (aucun senior)
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👴</Text>
      <Text style={styles.emptyTitle}>Aucun senior ajouté</Text>
      <Text style={styles.emptyDescription}>
        Commencez par ajouter un proche pour qu'il puisse bénéficier des appels
        quotidiens de MyCompanion.
      </Text>

      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => setShowAddForm(true)}
      >
        <Text style={styles.addFirstButtonText}>
          + Ajouter mon premier senior
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Vérification des permissions
  if (!isFamily && userProfile?.user_type !== "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccessContainer}>
          <Text style={styles.noAccessIcon}>🚫</Text>
          <Text style={styles.noAccessTitle}>Accès restreint</Text>
          <Text style={styles.noAccessDescription}>
            Cette fonctionnalité est réservée aux membres de famille.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Affichage du formulaire d'ajout
  if (showAddForm) {
    return (
      <SafeAreaView style={styles.container}>
        <AddSeniorForm
          onSuccess={handleSeniorAdded}
          onCancel={() => setShowAddForm(false)}
        />
      </SafeAreaView>
    );
  }

  // Écran principal
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>👴 Mes seniors</Text>
          <Text style={styles.subtitle}>
            {seniors.length === 0
              ? "Aucun senior ajouté"
              : seniors.length === 1
              ? "1 senior sous votre responsabilité"
              : `${seniors.length} seniors sous votre responsabilité`}
          </Text>
        </View>

        {seniors.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contenu principal */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Chargement des seniors...</Text>
        </View>
      ) : seniors.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={seniors}
          renderItem={renderSeniorItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4f46e5"]}
              tintColor="#4f46e5"
            />
          }
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
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
  seniorCard: {
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
  seniorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  seniorInfo: {
    flex: 1,
  },
  seniorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  seniorDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  seniorMeta: {
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  metaValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  seniorFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  addedDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  viewButtonText: {
    fontSize: 12,
    color: "#4f46e5",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noAccessIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noAccessTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
    textAlign: "center",
  },
  noAccessDescription: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
});
