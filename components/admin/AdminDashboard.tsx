import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { adminState$ } from '@/utils/supabase/observables/admin-observables';
import { PlatformStats, getGlobalStats } from '@/utils/supabase/services/admin-service';
import { useSelector } from '@legendapp/state/react';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, SafeAreaView } from 'react-native';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
  onPress?: () => void;
}

function StatCard({ title, value, icon, color, subtitle, onPress }: StatCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.statCardHeader}>
        <IconSymbol name={icon} size={28} color={color} />
        <ThemedText style={styles.statTitle}>{title}</ThemedText>
      </View>
      <ThemedText style={[styles.statValue, { color }]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </ThemedText>
      {subtitle && (
        <ThemedText style={styles.statSubtitle}>{subtitle}</ThemedText>
      )}
    </TouchableOpacity>
  );
}

interface QuickActionProps {
  title: string;
  icon: string;
  color: string;
  route: string;
}

function QuickAction({ title, icon, color, route }: QuickActionProps) {
  return (
    <TouchableOpacity 
      style={styles.quickAction}
      onPress={() => router.push(route as any)}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <IconSymbol name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.quickActionText}>{title}</ThemedText>
    </TouchableOpacity>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Observer les alertes critiques
  const criticalAlerts = useSelector(() => 
    adminState$.allAlerts.get().filter(alert => alert.severity === 'critical' && !alert.is_handled)
  );

  const loadStats = async () => {
    try {
      setError(null);
      const platformStats = await getGlobalStats();
      setStats(platformStats);
      adminState$.platformStats.set(platformStats);
    } catch (err) {
      console.error('[AdminDashboard] Erreur lors du chargement des stats:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.content}>
        {/* En-tête */}
        <View style={styles.header}>
          <ThemedText type="title">Tableau de Bord Admin</ThemedText>
          <ThemedText style={styles.subtitle}>
            Vue d'ensemble de la plateforme MyCompanion
          </ThemedText>
        </View>

        {/* Alertes critiques */}
        {criticalAlerts.length > 0 && (
          <TouchableOpacity
            style={styles.criticalAlert}
            onPress={() => router.push('/admin/alerts')}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FF3B30" />
            <View style={styles.criticalAlertContent}>
              <ThemedText style={styles.criticalAlertTitle}>
                {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
              </ThemedText>
              <ThemedText style={styles.criticalAlertSubtitle}>
                Toucher pour voir les détails
              </ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Utilisateurs Totaux"
            value={stats?.totalUsers || 0}
            icon="person.2.fill"
            color="#007AFF"
            subtitle={`${stats?.activeUsers || 0} actifs`}
            onPress={() => router.push('/admin/users')}
          />
          
          <StatCard
            title="Seniors"
            value={stats?.totalSeniors || 0}
            icon="person.fill"
            color="#34C759"
            onPress={() => router.push('/admin/seniors')}
          />
          
          <StatCard
            title="Appels"
            value={stats?.totalCalls || 0}
            icon="phone.fill"
            color="#FF9500"
            subtitle={stats?.recentActivity?.lastCallDate ? 'Dernier: Aujourd\'hui' : 'Aucun appel'}
          />
          
          <StatCard
            title="Alertes"
            value={stats?.totalAlerts || 0}
            icon="bell.fill"
            color="#FF3B30"
            subtitle={`${criticalAlerts.length} critiques`}
            onPress={() => router.push('/admin/alerts')}
          />
        </View>

        {/* Répartition par type d'utilisateur */}
        {stats?.usersByType && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Répartition des Utilisateurs
            </ThemedText>
            <View style={styles.userTypesContainer}>
              {Object.entries(stats.usersByType).map(([type, count]) => (
                <View key={type} style={styles.userTypeItem}>
                  <ThemedText style={styles.userTypeLabel}>
                    {type === 'admin' ? 'Administrateurs' :
                     type === 'family' ? 'Famille' :
                     type === 'senior' ? 'Seniors' :
                     type === 'saad_admin' ? 'Admin SAAD' :
                     type === 'saad_worker' ? 'Agents SAAD' : type}
                  </ThemedText>
                  <ThemedText style={styles.userTypeCount}>{count}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions rapides */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Actions Rapides
          </ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Gérer Utilisateurs"
              icon="person.badge.plus"
              color="#007AFF"
              route="/admin/users"
            />
            <QuickAction
              title="Voir Seniors"
              icon="person.crop.circle"
              color="#34C759"
              route="/admin/seniors"
            />
            <QuickAction
              title="Centre d'Alertes"
              icon="bell.badge"
              color="#FF3B30"
              route="/admin/alerts"
            />
            <QuickAction
              title="Statistiques"
              icon="chart.bar.fill"
              color="#FF9500"
              route="/admin/stats"
            />
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Activité Récente
          </ThemedText>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <IconSymbol name="person.fill.badge.plus" size={20} color="#34C759" />
              <ThemedText style={styles.activityText}>
                {stats?.recentActivity?.newUsersToday || 0} nouveaux utilisateurs aujourd'hui
              </ThemedText>
            </View>
            {stats?.recentActivity?.lastCallDate && (
              <View style={styles.activityItem}>
                <IconSymbol name="phone.fill" size={20} color="#007AFF" />
                <ThemedText style={styles.activityText}>
                  Dernier appel: {new Date(stats.recentActivity.lastCallDate).toLocaleString('fr-FR')}
                </ThemedText>
              </View>
            )}
            {stats?.recentActivity?.lastAlertDate && (
              <View style={styles.activityItem}>
                <IconSymbol name="bell.fill" size={20} color="#FF9500" />
                <ThemedText style={styles.activityText}>
                  Dernière alerte: {new Date(stats.recentActivity.lastAlertDate).toLocaleString('fr-FR')}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 10,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 20,
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3010',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  criticalAlertContent: {
    flex: 1,
    marginLeft: 12,
  },
  criticalAlertTitle: {
    fontWeight: '600',
    color: '#FF3B30',
  },
  criticalAlertSubtitle: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    // backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    marginLeft: 12,
    fontSize: 14,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  userTypesContainer: {
    // backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  userTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userTypeLabel: {
    flex: 1,
  },
  userTypeCount: {
    fontWeight: '600',
    fontSize: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
    margin: 8,
    minWidth: '40%',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    textAlign: 'center',
  },
  activityContainer: {
    // backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  activityText: {
    marginLeft: 12,
    flex: 1,
  },
});