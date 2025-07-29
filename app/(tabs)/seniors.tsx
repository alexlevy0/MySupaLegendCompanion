// app/(tabs)/seniors.tsx
import AuthWrapper from "@/components/auth/AuthWrapper";
import SeniorsListScreen from "@/components/SeniorsListScreen";
import { useMyCompanionAuth } from "@/utils/SupaLegend";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SeniorsTab() {
  const { userProfile, isFamily, isSAAD } = useMyCompanionAuth();

  // Vérification des permissions
  if (!isFamily && !isSAAD) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Accès non autorisé</Text>
          <Text style={styles.errorMessage}>
            Seuls les membres de famille et les services d'aide à domicile
            peuvent accéder à cette section.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthWrapper>
      <SeniorsListScreen />
    </AuthWrapper>
  );
}

const styles = StyleSheet.create({
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
});
