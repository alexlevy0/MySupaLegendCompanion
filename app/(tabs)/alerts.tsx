import AuthWrapper from "@/components/auth/AuthWrapper";
import {
    acknowledgeAlert,
    alerts$,
    useMyCompanionAuth,
} from "@/utils/SupaLegend";
import { observer } from "@legendapp/state/react";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Alert from "@/utils/Alert";

// Type pour les alertes
interface AlertData {
  id: string;
  senior_id: string;
  call_id?: string;
  alert_type:
    | "health"
    | "mood"
    | "confusion"
    | "emergency"
    | "medication"
    | "social"
    | "technical";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  detected_indicators?: any;
  confidence_score?: number;
  status:
    | "new"
    | "acknowledged"
    | "in_progress"
    | "resolved"
    | "false_positive";
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

const AlertsScreen = observer(() => {
  const { userProfile, isFamily, isSAAD, isAdmin } = useMyCompanionAuth();
  const [loading, setLoading] = useState(false);

  // Vérification des permissions
  if (!isFamily && !isSAAD && !isAdmin) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Accès non autorisé</Text>
          <Text style={styles.errorMessage}>
            Seuls les familles, services d'aide et administrateurs peuvent
            accéder aux alertes.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Récupérer les alertes depuis l'observable
  const alertsData = alerts$.get();
  const alertsList = alertsData
    ? (Object.values(alertsData) as AlertData[])
    : [];

  // Filtrer les alertes pertinentes pour l'utilisateur
  // TODO: Filtrer selon les seniors auxquels l'utilisateur a accès
  const filteredAlerts = alertsList
    .filter((alert) => !alert.deleted)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  // Gérer l'accusé de réception d'une alerte
  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!userProfile) return;

    try {
      setLoading(true);
      await acknowledgeAlert(alertId, userProfile.id);
      Alert.alert(
        "✅ Accusé de réception",
        "L'alerte a été marquée comme lue."
      );
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de traiter l'alerte");
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'icône selon le type d'alerte
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "health":
        return "🏥";
      case "mood":
        return "😔";
      case "confusion":
        return "🤔";
      case "emergency":
        return "🚨";
      case "medication":
        return "💊";
      case "social":
        return "👥";
      case "technical":
        return "⚙️";
      default:
        return "⚠️";
    }
  };

  // Obtenir la couleur selon la sévérité
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "#10b981";
      case "medium":
        return "#f59e0b";
      case "high":
        return "#ef4444";
      case "critical":
        return "#dc2626";
      default:
        return "#94a3b8";
    }
  };

  // Obtenir le label de statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "Nouvelle";
      case "acknowledged":
        return "Vue";
      case "in_progress":
        return "En cours";
      case "resolved":
        return "Résolue";
      case "false_positive":
        return "Fausse alerte";
      default:
        return status;
    }
  };

  // Formatter la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 5) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7)
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? "s" : ""}`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Rendu d'une alerte
  const renderAlert = ({ item }: { item: AlertData }) => (
    <View
      style={[
        styles.alertCard,
        item.status === "new" && styles.newAlert,
        item.severity === "critical" && styles.criticalAlert,
      ]}
    >
      {/* Header de l'alerte */}
      <View style={styles.alertHeader}>
        <View style={styles.alertInfo}>
          <View style={styles.alertTitleRow}>
            <Text style={styles.alertIcon}>
              {getAlertIcon(item.alert_type)}
            </Text>
            <Text style={styles.alertTitle}>{item.title}</Text>
          </View>
          <Text style={styles.alertTime}>{formatDate(item.created_at)}</Text>
        </View>

        <View style={styles.alertBadges}>
          <Text
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(item.severity) },
            ]}
          >
            {item.severity.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              item.status === "new" && styles.newStatusBadge,
            ]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.alertDescription}>{item.description}</Text>

      {/* Indicateurs détectés */}
      {item.detected_indicators && (
        <View style={styles.indicatorsSection}>
          <Text style={styles.indicatorsTitle}>🔍 Indicateurs détectés :</Text>
          <Text style={styles.indicatorsText}>
            {JSON.stringify(item.detected_indicators, null, 2)}
          </Text>
        </View>
      )}

      {/* Score de confiance */}
      {item.confidence_score && (
        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceText}>
            🎯 Confiance : {Math.round(item.confidence_score * 100)}%
          </Text>
        </View>
      )}

      {/* Actions */}
      {item.status === "new" && (
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.acknowledgeButton}
            onPress={() => handleAcknowledgeAlert(item.id)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.acknowledgeButtonText}>
                ✓ Accuser réception
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() =>
              Alert.alert("Détails", "Fonctionnalité en développement")
            }
          >
            <Text style={styles.detailsButtonText}>👁️ Détails</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Informations de résolution */}
      {item.status === "resolved" && item.resolution_notes && (
        <View style={styles.resolutionSection}>
          <Text style={styles.resolutionTitle}>✅ Résolution :</Text>
          <Text style={styles.resolutionText}>{item.resolution_notes}</Text>
        </View>
      )}
    </View>
  );

  // État vide
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🎉</Text>
      <Text style={styles.emptyTitle}>Aucune alerte</Text>
      <Text style={styles.emptyMessage}>
        Excellente nouvelle ! Il n'y a aucune alerte pour vos seniors.
        MyCompanion veille et vous tiendra informé dès qu'il y aura quelque
        chose à signaler.
      </Text>
    </View>
  );

  // Statistiques des alertes
  const newAlertsCount = filteredAlerts.filter(
    (alert) => alert.status === "new"
  ).length;
  const criticalAlertsCount = filteredAlerts.filter(
    (alert) => alert.severity === "critical"
  ).length;

  return (
    <AuthWrapper>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🚨 Alertes</Text>
            <Text style={styles.headerSubtitle}>
              {filteredAlerts.length} alerte
              {filteredAlerts.length > 1 ? "s" : ""} au total
              {newAlertsCount > 0 &&
                ` • ${newAlertsCount} nouvelle${newAlertsCount > 1 ? "s" : ""}`}
              {criticalAlertsCount > 0 &&
                ` • ${criticalAlertsCount} critique${
                  criticalAlertsCount > 1 ? "s" : ""
                }`}
            </Text>
          </View>

          {newAlertsCount > 0 && (
            <View style={styles.alertCounter}>
              <Text style={styles.alertCounterText}>{newAlertsCount}</Text>
            </View>
          )}
        </View>

        {/* Liste des alertes */}
        <FlatList
          data={filteredAlerts}
          renderItem={renderAlert}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </AuthWrapper>
  );
});

export default AlertsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
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
  alertCounter: {
    backgroundColor: "#ef4444",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  alertCounterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  listContent: {
    padding: 20,
  },
  alertCard: {
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
  newAlert: {
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  criticalAlert: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  alertTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  alertBadges: {
    alignItems: "flex-end",
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: "white",
    fontWeight: "600",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
  },
  newStatusBadge: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  alertDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  indicatorsSection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  indicatorsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  indicatorsText: {
    fontSize: 11,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  confidenceSection: {
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  acknowledgeButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  acknowledgeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailsButtonText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: "600",
  },
  resolutionSection: {
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  resolutionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 12,
    color: "#064e3b",
    lineHeight: 16,
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
  },
});
