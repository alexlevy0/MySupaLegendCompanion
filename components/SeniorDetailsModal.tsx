import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { getSeniorStats, getSeniorById } from '@/utils/SupaLegend';

interface SeniorDetailsModalProps {
  visible: boolean;
  seniorId: string;
  seniorName: string;
  onClose: () => void;
}

interface SeniorStats {
  totalCalls: number;
  totalAlerts: number;
  lastWellBeingScore: number | null;
  lastMetricDate: string | null;
}

interface AlertDetail {
  id: string;
  alert_type: string;
  severity: string;
  created_at: string;
  resolved: boolean;
  details?: any;
}

export default function SeniorDetailsModal({
  visible,
  seniorId,
  seniorName,
  onClose,
}: SeniorDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SeniorStats | null>(null);
  const [alerts, setAlerts] = useState<AlertDetail[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'history'>('overview');

  useEffect(() => {
    if (visible && seniorId) {
      loadData();
    }
  }, [visible, seniorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les statistiques
      const seniorStats = await getSeniorStats(seniorId);
      setStats(seniorStats);
      
      // TODO: Charger les alertes détaillées
      // const alertsData = await getSeniorAlerts(seniorId);
      // setAlerts(alertsData);
    } catch (error) {
      console.error('❌ Failed to load senior details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWellBeingColor = (score: number | null) => {
    if (score === null) return '#9ca3af';
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getWellBeingLabel = (score: number | null) => {
    if (score === null) return 'Non évalué';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Satisfaisant';
    return 'Préoccupant';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return 'Hier';
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return 'Date invalide';
    }
  };

  const renderTabButton = (tab: 'overview' | 'alerts' | 'history', label: string, emoji: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {emoji} {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => {
    if (!stats) return null;

    const wellBeingScore = stats.lastWellBeingScore;
    const wellBeingColor = getWellBeingColor(wellBeingScore);
    const wellBeingLabel = getWellBeingLabel(wellBeingScore);

    return (
      <View style={styles.tabContent}>
        {/* Score de bien-être */}
        <View style={styles.wellBeingCard}>
          <Text style={styles.sectionTitle}>État de bien-être</Text>
          
          <View style={styles.scoreContainer}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: wellBeingColor }]}>
                {wellBeingScore !== null ? Math.round(wellBeingScore) : '--'}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            
            <View style={styles.scoreDetails}>
              <Text style={[styles.scoreLabel, { color: wellBeingColor }]}>
                {wellBeingLabel}
              </Text>
              <Text style={styles.scoreDate}>
                Dernière évaluation: {formatDate(stats.lastMetricDate)}
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

        {/* Statistiques */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e0f2fe' }]}>
            <Text style={styles.statEmoji}>📞</Text>
            <Text style={styles.statNumber}>{stats.totalCalls}</Text>
            <Text style={styles.statLabel}>Appels reçus</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: stats.totalAlerts > 0 ? '#fef3c7' : '#d1fae5' }]}>
            <Text style={styles.statEmoji}>🚨</Text>
            <Text style={[styles.statNumber, { color: stats.totalAlerts > 0 ? '#d97706' : '#059669' }]}>
              {stats.totalAlerts}
            </Text>
            <Text style={styles.statLabel}>
              {stats.totalAlerts === 0 ? 'Aucune alerte' : 'Alertes actives'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAlertsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonEmoji}>🚧</Text>
        <Text style={styles.comingSoonTitle}>En cours de développement</Text>
        <Text style={styles.comingSoonText}>
          L'historique détaillé des alertes sera bientôt disponible.
        </Text>
        <Text style={styles.comingSoonSubtext}>
          Vous pourrez consulter toutes les alertes passées et leur résolution.
        </Text>
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonEmoji}>📊</Text>
        <Text style={styles.comingSoonTitle}>En cours de développement</Text>
        <Text style={styles.comingSoonText}>
          L'historique complet des appels et interactions sera bientôt disponible.
        </Text>
        <Text style={styles.comingSoonSubtext}>
          Vous pourrez analyser les tendances et l'évolution du bien-être.
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.modalTitle}>Détails de {seniorName}</Text>
              <Text style={styles.modalSubtitle}>Vue d'ensemble et statistiques</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            {renderTabButton('overview', 'Vue d\'ensemble', '📊')}
            {renderTabButton('alerts', 'Alertes', '🚨')}
            {renderTabButton('history', 'Historique', '📅')}
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Chargement des données...</Text>
              </View>
            ) : (
              <>
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'alerts' && renderAlertsTab()}
                {activeTab === 'history' && renderHistoryTab()}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#4f46e5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabButtonText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  wellBeingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e5e7eb',
    marginRight: 20,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 14,
    color: '#6b7280',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  comingSoonContainer: {
    padding: 48,
    alignItems: 'center',
  },
  comingSoonEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});