import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { adminState$ } from "@/utils/supabase/observables/admin-observables";
import {
  getAllAlerts,
  logAdminAction,
} from "@/utils/supabase/services/admin-service";
import { Alert } from "@/utils/supabase/types";
import { useSelector } from "@legendapp/state/react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface AlertItemProps {
  alert: Alert & { seniors?: any };
  onPress: (alert: Alert) => void;
}

function AlertItem({ alert, onPress }: AlertItemProps) {
  const severityColors = {
    low: "#34C759",
    medium: "#FF9500",
    high: "#FF3B30",
    critical: "#C70000",
  };

  const typeIcons = {
    chute: "figure.fall",
    health: "heart.text.square.fill",
    emergency: "exclamationmark.triangle.fill",
    activity: "figure.walk.motion",
    well_being: "face.smiling.fill",
  };

  return (
    <TouchableOpacity
      style={[
        styles.alertItem,
        { borderLeftColor: severityColors[alert.severity] },
      ]}
      onPress={() => onPress(alert)}
    >
      <View style={styles.alertHeader}>
        <View
          style={[
            styles.alertIcon,
            { backgroundColor: severityColors[alert.severity] + "20" },
          ]}
        >
          <IconSymbol
            name={typeIcons[alert.type] || "bell.fill"}
            size={24}
            color={severityColors[alert.severity]}
          />
        </View>

        <View style={styles.alertContent}>
          <View style={styles.alertTitleRow}>
            <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
            {!alert.is_handled && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: severityColors[alert.severity] },
                ]}
              >
                <ThemedText style={styles.badgeText}>Non traitée</ThemedText>
              </View>
            )}
          </View>

          <ThemedText style={styles.alertSenior}>
            {alert.seniors?.first_name} {alert.seniors?.last_name} •{" "}
            {alert.seniors?.phone}
          </ThemedText>

          <ThemedText style={styles.alertTime}>
            {formatDistanceToNow(new Date(alert.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </ThemedText>
        </View>
      </View>

      {alert.message && (
        <ThemedText style={styles.alertMessage} numberOfLines={2}>
          {alert.message}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

export function AdminAlertCenter() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFilteredAlerts = () => {
    if (!severityFilter) return alerts;
    return alerts?.filter((a) => a.severity === severityFilter);
  };
  // Observer les alertes
  const alerts = useSelector(getFilteredAlerts);
  const totalAlerts = useSelector(() => adminState$.allAlerts.get().length);
  const criticalCount = useSelector(
    () =>
      adminState$.allAlerts
        .get()
        .filter((a) => a.severity === "critical" && !a.is_handled).length
  );

  const loadAlerts = async () => {
    try {
      setError(null);
      adminState$.loading.alerts.set(true);

      const allAlerts = await getAllAlerts({ limit: 100 });
      adminState$.allAlerts.set(allAlerts);

      await logAdminAction("view_all_alerts", undefined, {
        count: allAlerts.length,
      });
    } catch (err) {
      console.error("[AdminAlertCenter] Erreur lors du chargement:", err);
      setError("Impossible de charger les alertes");
    } finally {
      setLoading(false);
      setRefreshing(false);
      adminState$.loading.alerts.set(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAlertPress = (alert: Alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
    logAdminAction("view_alert_details", alert.id, {
      severity: alert.severity,
    });
  };

  const handleMarkAsHandled = async () => {
    if (!selectedAlert) return;

    try {
      // TODO: Implémenter la mise à jour du statut de l'alerte
      await logAdminAction("handle_alert", selectedAlert.id);

      // Mettre à jour localement
      const alerts = adminState$.allAlerts.get();
      const index = alerts.findIndex((a) => a.id === selectedAlert.id);
      if (index !== -1) {
        const updatedAlerts = [...alerts];
        updatedAlerts[index] = { ...updatedAlerts[index], is_handled: true };
        adminState$.allAlerts.set(updatedAlerts);
      }

      setModalVisible(false);
    } catch (error) {
      console.error("[AdminAlertCenter] Erreur lors du traitement:", error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* En-tête avec statistiques */}
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{totalAlerts}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>

          <View style={[styles.statCard, styles.criticalCard]}>
            <ThemedText style={[styles.statValue, styles.criticalValue]}>
              {criticalCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Critiques</ThemedText>
          </View>

          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {alerts?.filter((a) => !a.is_handled).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Non traitées</ThemedText>
          </View>
        </View>

        {/* Filtres par sévérité */}
        <FlatList
          horizontal
          data={[null, "critical", "high", "medium", "low"]}
          keyExtractor={(item) => item || "all"}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                severityFilter === item && styles.filterChipActive,
              ]}
              onPress={() => setSeverityFilter(item)}
            >
              <ThemedText
                style={[
                  styles.filterChipText,
                  severityFilter === item && styles.filterChipTextActive,
                ]}
              >
                {item ? getSeverityLabel(item) : "Toutes"}
              </ThemedText>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        />
      </View>

      {/* Message d'erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Button title="Réessayer" onPress={loadAlerts} />
        </View>
      )}

      {/* Liste des alertes */}
      <FlatList
        data={getFilteredAlerts()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertItem alert={item} onPress={handleAlertPress} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="bell.slash" size={64} color="#C7C7CC" />
            <ThemedText style={styles.emptyText}>
              Aucune alerte à afficher
            </ThemedText>
          </View>
        }
      />

      {/* Modal de détails d'alerte */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAlert && (
              <>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {selectedAlert.title}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <IconSymbol
                      name="xmark.circle.fill"
                      size={24}
                      color="#C7C7CC"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalInfoRow}>
                    <ThemedText style={styles.modalLabel}>Senior:</ThemedText>
                    <ThemedText style={styles.modalValue}>
                      {selectedAlert.seniors?.first_name}{" "}
                      {selectedAlert.seniors?.last_name}
                    </ThemedText>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <ThemedText style={styles.modalLabel}>Sévérité:</ThemedText>
                    <ThemedText
                      style={[
                        styles.modalValue,
                        { color: getSeverityColor(selectedAlert.severity) },
                      ]}
                    >
                      {getSeverityLabel(selectedAlert.severity)}
                    </ThemedText>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <ThemedText style={styles.modalLabel}>Type:</ThemedText>
                    <ThemedText style={styles.modalValue}>
                      {getAlertTypeLabel(selectedAlert.type)}
                    </ThemedText>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <ThemedText style={styles.modalLabel}>Date:</ThemedText>
                    <ThemedText style={styles.modalValue}>
                      {new Date(selectedAlert.created_at).toLocaleString(
                        "fr-FR"
                      )}
                    </ThemedText>
                  </View>

                  {selectedAlert.message && (
                    <View style={styles.modalMessageContainer}>
                      <ThemedText style={styles.modalLabel}>
                        Message:
                      </ThemedText>
                      <ThemedText style={styles.modalMessage}>
                        {selectedAlert.message}
                      </ThemedText>
                    </View>
                  )}

                  {selectedAlert.context && (
                    <View style={styles.modalMessageContainer}>
                      <ThemedText style={styles.modalLabel}>
                        Contexte:
                      </ThemedText>
                      <ThemedText style={styles.modalMessage}>
                        {JSON.stringify(selectedAlert.context, null, 2)}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {!selectedAlert.is_handled && (
                    <Button
                      title="Marquer comme traitée"
                      onPress={handleMarkAsHandled}
                      style={styles.modalButton}
                    />
                  )}
                  <Button
                    title="Fermer"
                    onPress={() => setModalVisible(false)}
                    style={styles.modalButton}
                    variant="secondary"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "critical":
      return "Critique";
    case "high":
      return "Élevée";
    case "medium":
      return "Moyenne";
    case "low":
      return "Faible";
    default:
      return severity;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "#C70000";
    case "high":
      return "#FF3B30";
    case "medium":
      return "#FF9500";
    case "low":
      return "#34C759";
    default:
      return "#8E8E93";
  }
}

function getAlertTypeLabel(type: string): string {
  switch (type) {
    case "chute":
      return "Chute détectée";
    case "health":
      return "Santé";
    case "emergency":
      return "Urgence";
    case "activity":
      return "Activité";
    case "well_being":
      return "Bien-être";
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statCard: {
    alignItems: "center",
    padding: 12,
    flex: 1,
  },
  criticalCard: {
    backgroundColor: "#FF3B3010",
    borderRadius: 8,
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  criticalValue: {
    color: "#FF3B30",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  filtersContainer: {
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
  },
  filterChipText: {
    fontSize: 14,
    color: "#3C3C43",
  },
  filterChipTextActive: {
    color: "white",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  alertItem: {
    // backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  alertSenior: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  alertTime: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  modalLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalMessageContainer: {
    marginTop: 16,
  },
  modalMessage: {
    fontSize: 14,
    marginTop: 8,
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 8,
  },
  modalActions: {
    gap: 12,
  },
  modalButton: {
    marginBottom: 8,
  },
});
