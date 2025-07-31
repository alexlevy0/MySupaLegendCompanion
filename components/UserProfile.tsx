import { getUserStats, signOut, useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Animated,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UserStats {
  totalCalls: number;
  totalAlerts: number;
}

export default function UserProfile() {
  const { userProfile, isAdmin, isSenior, isFamily, isSAAD } =
    useMyCompanionAuth();
  const [stats, setStats] = useState<UserStats>({
    totalCalls: 0,
    totalAlerts: 0,
  });
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    if (userProfile?.id) {
      getUserStats(userProfile.id).then(setStats);
    }
  }, [userProfile?.id]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      signOut();
    } else {
      Alert.alert(
        "Déconnexion",
        "Êtes-vous sûr de vouloir vous déconnecter ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Déconnexion",
            style: "destructive",
            onPress: async () => {
              try {
                await signOut();
              } catch (error) {
                Alert.alert("Erreur", "Impossible de se déconnecter");
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
        return "shield-checkmark";
      case "senior":
        return "person";
      case "family":
        return "people";
      case "saad_admin":
        return "business";
      case "saad_worker":
        return "medical";
      case "insurer":
        return "briefcase";
      default:
        return "person-circle";
    }
  };

  const getUserTypeColor = () => {
    switch (userProfile?.user_type) {
      case "admin":
        return ["#f59e0b", "#f97316"];
      case "senior":
        return ["#3b82f6", "#2563eb"];
      case "family":
        return ["#8b5cf6", "#7c3aed"];
      case "saad_admin":
      case "saad_worker":
        return ["#10b981", "#059669"];
      case "insurer":
        return ["#6366f1", "#4f46e5"];
      default:
        return ["#6b7280", "#4b5563"];
    }
  };

  const getUserTypeLabel = () => {
    switch (userProfile?.user_type) {
      case "admin":
        return "Administrateur";
      case "senior":
        return "Senior";
      case "family":
        return "Famille";
      case "saad_admin":
        return "Directeur SAAD";
      case "saad_worker":
        return "Auxiliaire SAAD";
      case "insurer":
        return "Assureur";
      default:
        return "Utilisateur";
    }
  };

  const getPermissions = () => {
    const permissions = [];
    if (isAdmin) permissions.push({ icon: "settings", text: "Administration complète" });
    if (isSenior) permissions.push({ icon: "call", text: "Réception d'appels" });
    if (isFamily) permissions.push({ icon: "stats-chart", text: "Rapports familiaux" });
    if (isSAAD) permissions.push({ icon: "medical", text: "Gestion bénéficiaires" });

    return permissions;
  };

  if (!userProfile) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        {/* Carte principale avec avatar */}
        <View style={styles.mainCard}>
          <LinearGradient
            colors={getUserTypeColor()}
            style={styles.avatarContainer}
          >
            <Ionicons name={getUserTypeIcon()} size={48} color="white" />
          </LinearGradient>
          
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {userProfile.first_name} {userProfile.last_name}
            </Text>
            <Text style={styles.email}>{userProfile.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.userType}>{getUserTypeLabel()}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: userProfile.is_active ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {userProfile.is_active ? "Actif" : "Inactif"}
            </Text>
          </View>
        </View>

        {/* Statistiques pour les seniors */}
        {isSenior && (
          <View style={styles.statsGrid}>
            <TouchableOpacity activeOpacity={0.8} style={styles.statCard}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.statGradient}
              >
                <Ionicons name="call" size={32} color="white" />
                <Text style={styles.statNumber}>{stats.totalCalls}</Text>
                <Text style={styles.statLabel}>Appels reçus</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity activeOpacity={0.8} style={styles.statCard}>
              <LinearGradient
                colors={['#f59e0b', '#f97316']}
                style={styles.statGradient}
              >
                <Ionicons name="alert-circle" size={32} color="white" />
                <Text style={styles.statNumber}>{stats.totalAlerts}</Text>
                <Text style={styles.statLabel}>Alertes</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Informations détaillées */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={20} color="#6366f1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Membre depuis</Text>
              <Text style={styles.detailValue}>
                {new Date(userProfile.created_at).toLocaleDateString("fr-FR", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          {userProfile.phone && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="call" size={20} color="#6366f1" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Téléphone</Text>
                <Text style={styles.detailValue}>{userProfile.phone}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Permissions */}
        <View style={styles.permissionsCard}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          {getPermissions().map((permission, index) => (
            <View key={index} style={styles.permissionRow}>
              <View style={styles.permissionIcon}>
                <Ionicons name={permission.icon as any} size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.permissionText}>{permission.text}</Text>
            </View>
          ))}
        </View>

        {/* Bouton de déconnexion */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.signOutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="white" />
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userType: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 20,
    right: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statGradient: {
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  permissionsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  permissionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f3ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  permissionText: {
    fontSize: 15,
    color: "#475569",
    flex: 1,
  },
  signOutButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  signOutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  signOutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
});
