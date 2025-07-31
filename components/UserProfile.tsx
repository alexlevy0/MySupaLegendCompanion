import { useTranslation } from "@/hooks/useTranslation";
import { getUserStats, signOut, useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserStats {
  totalCalls: number;
  totalAlerts: number;
}

export default function UserProfile() {
  const { userProfile, isAdmin, isSenior, isFamily, isSAAD } =
    useMyCompanionAuth();
  const { t, isFrench } = useTranslation();
  const [stats, setStats] = useState<UserStats>({
    totalCalls: 0,
    totalAlerts: 0,
  });

  useEffect(() => {
    if (userProfile?.id) {
      getUserStats(userProfile.id).then(setStats);
    }
  }, [userProfile?.id]);

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      signOut();
    } else {
      Alert.alert(
        t('userProfile.signOut'),
        t('userProfile.signOutConfirm'),
        [
          { text: t('userProfile.cancel'), style: "cancel" },
          {
            text: t('userProfile.signOutButton'),
            style: "destructive",
            onPress: async () => {
              try {
                await signOut();
              } catch (error) {
                Alert.alert(t('common.error'), t('userProfile.signOutError'));
              }
            },
          },
        ]
      );
    }
  };

  const getUserTypeIcon = () => {
    switch (userProfile?.user_type) {
      case "admin":
        return "👑";
      case "senior":
        return "👴";
      case "family":
        return "👨‍👩‍👧‍👦";
      case "saad_admin":
        return "🏢";
      case "saad_worker":
        return "👩‍⚕️";
      case "insurer":
        return "🏛️";
      default:
        return "👤";
    }
  };

  const getUserTypeLabel = () => {
    switch (userProfile?.user_type) {
      case "admin":
        return t('userProfile.userTypes.admin');
      case "senior":
        return t('userProfile.userTypes.senior');
      case "family":
        return t('userProfile.userTypes.family');
      case "saad_admin":
        return t('userProfile.userTypes.saad_admin');
      case "saad_worker":
        return t('userProfile.userTypes.saad_worker');
      case "insurer":
        return t('userProfile.userTypes.insurer');
      default:
        return t('userProfile.userTypes.default');
    }
  };

  const getPermissions = () => {
    const permissions = [];
    if (isAdmin) permissions.push(t('userProfile.permissions.admin'));
    if (isSenior) permissions.push(t('userProfile.permissions.senior'));
    if (isFamily) permissions.push(t('userProfile.permissions.family'));
    if (isSAAD) permissions.push(t('userProfile.permissions.saad'));

    return permissions;
  };

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getUserTypeIcon()}</Text>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {userProfile.first_name} {userProfile.last_name}
            </Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            <Text style={styles.userType}>{getUserTypeLabel()}</Text>
          </View>
        </View>

        {/* Statistiques pour les seniors */}
        {isSenior && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>{t('userProfile.stats.title')}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalCalls}</Text>
                <Text style={styles.statLabel}>{t('userProfile.stats.callsReceived')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
                <Text style={styles.statLabel}>{t('userProfile.stats.alertsGenerated')}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('userProfile.details.status')}</Text>
            <Text style={[styles.value, styles.active]}>
              {userProfile.is_active ? t('userProfile.details.active') : t('userProfile.details.inactive')}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('userProfile.details.memberSince')}</Text>
            <Text style={styles.value}>
              {new Date(userProfile.created_at || '').toLocaleDateString(isFrench ? "fr-FR" : "en-US")}
            </Text>
          </View>

          {userProfile.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('userProfile.details.phone')}</Text>
              <Text style={styles.value}>{userProfile.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.permissions}>
          <Text style={styles.permissionsTitle}>{t('userProfile.permissionsTitle')}</Text>
          {getPermissions().map((permission, index) => (
            <Text key={index} style={styles.permission}>
              {permission}
            </Text>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>{t('userProfile.signOutButtonText')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
  },
  statsSection: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4f46e5",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  details: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  active: {
    color: "#10b981",
  },
  permissions: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  permission: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
  },
  signOutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
