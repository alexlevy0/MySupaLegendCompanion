import { signOut, useMyCompanionAuth } from "@/utils/SupaLegend";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function UserProfile() {
  const { userProfile, isAdmin, isSenior, isFamily, isSAAD } =
    useMyCompanionAuth();

  const handleSignOut = async () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
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
    ]);
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
    if (isAdmin) permissions.push("🔧 Administration complète");
    if (isSenior) permissions.push("👴 Réception d'appels");
    if (isFamily) permissions.push("📊 Rapports familiaux");
    if (isSAAD) permissions.push("🏥 Gestion bénéficiaires");

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

        <View style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{userProfile.id.slice(0, 8)}...</Text>
          </View>

          {userProfile.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone:</Text>
              <Text style={styles.value}>{userProfile.phone}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles.active]}>
              {userProfile.is_active ? "✅ Actif" : "❌ Inactif"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Membre depuis:</Text>
            <Text style={styles.value}>
              {new Date(userProfile.created_at).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        <View style={styles.permissions}>
          <Text style={styles.permissionsTitle}>🔐 Permissions:</Text>
          {getPermissions().map((permission, index) => (
            <Text key={index} style={styles.permission}>
              {permission}
            </Text>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>
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
  signOutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
