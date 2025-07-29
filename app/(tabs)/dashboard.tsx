import AuthWrapper from "@/components/auth/AuthWrapper";
import { useMyCompanionAuth } from "@/utils/SupaLegend";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DashboardTab() {
  const { userProfile, isSenior } = useMyCompanionAuth();

  // Vérification des permissions
  if (!isSenior) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>Espace Senior</Text>
          <Text style={styles.errorMessage}>
            Cette section est réservée aux bénéficiaires des appels MyCompanion.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthWrapper>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              👋 Bonjour {userProfile?.first_name} !
            </Text>
            <Text style={styles.headerSubtitle}>
              Voici votre tableau de bord MyCompanion
            </Text>
          </View>

          {/* Prochains appels */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📞 Prochains appels</Text>
            <View style={styles.callItem}>
              <Text style={styles.callTime}>Aujourd'hui à 09:00</Text>
              <Text style={styles.callStatus}>🟢 Programmé</Text>
            </View>
            <View style={styles.callItem}>
              <Text style={styles.callTime}>Demain à 09:00</Text>
              <Text style={styles.callStatus}>⏱️ En attente</Text>
            </View>
          </View>

          {/* Dernières conversations */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💬 Dernières conversations</Text>
            <View style={styles.conversationItem}>
              <Text style={styles.conversationDate}>Hier - 09:05</Text>
              <Text style={styles.conversationSummary}>
                Conversation agréable de 8 minutes. Nous avons parlé de votre
                jardin et de vos petits-enfants.
              </Text>
            </View>
            <View style={styles.conversationItem}>
              <Text style={styles.conversationDate}>Avant-hier - 09:03</Text>
              <Text style={styles.conversationSummary}>
                Échange de 6 minutes sur votre santé et vos activités de la
                journée.
              </Text>
            </View>
          </View>

          {/* Mes contacts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>👨‍👩‍👧‍👦 Mes contacts</Text>
            <Text style={styles.contactInfo}>
              Vos proches reçoivent des rapports réguliers et sont alertés en
              cas de besoin.
            </Text>
            <View style={styles.contactItem}>
              <Text style={styles.contactName}>Marie (fille) 👑</Text>
              <Text style={styles.contactStatus}>Contact principal</Text>
            </View>
          </View>

          {/* Conseils du jour */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💡 Conseil du jour</Text>
            <Text style={styles.tipText}>
              N'hésitez pas à parler de vos activités favorites lors de notre
              prochaine conversation. Cela m'aide à mieux vous connaître !
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AuthWrapper>
  );
}

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
    color: "#4f46e5",
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  card: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  callItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  callTime: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  callStatus: {
    fontSize: 14,
    color: "#64748b",
  },
  conversationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  conversationDate: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: 4,
  },
  conversationSummary: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  contactInfo: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    fontStyle: "italic",
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  contactName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  contactStatus: {
    fontSize: 12,
    color: "#4f46e5",
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    fontStyle: "italic",
  },
});
