import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { joinFamilyWithCode } from "@/utils/SupaLegend";
import CodeInput from "./CodeInput";
import { Ionicons } from "@expo/vector-icons";

interface JoinFamilyScreenProps {
  onSuccess?: (seniorInfo: any) => void;
  onBack?: () => void;
}

export default function JoinFamilyScreen({
  onSuccess,
  onBack,
}: JoinFamilyScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleJoinFamily = async (code: string, relationship: string) => {
    try {
      setLoading(true);
      
      const result = await joinFamilyWithCode(code, relationship);
      
      if (result.success && result.seniorInfo) {
        Alert.alert(
          "✅ Bienvenue dans la famille !",
          `Vous avez maintenant accès aux informations de ${result.seniorInfo.first_name} ${result.seniorInfo.last_name}.`,
          [
            {
              text: "Continuer",
              onPress: () => onSuccess?.(result.seniorInfo),
            },
          ]
        );
      } else {
        Alert.alert(
          "❌ Code invalide",
          result.error || "Le code saisi n'est pas valide ou a expiré.",
          [{ text: "Réessayer" }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {onBack && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="people-circle" size={80} color="#4f46e5" />
          </View>
          <Text style={styles.title}>Rejoindre une famille</Text>
          <Text style={styles.subtitle}>
            Entrez le code partagé par votre proche pour accéder à ses informations
            de santé et recevoir des alertes importantes.
          </Text>
        </View>

        <CodeInput onSubmit={handleJoinFamily} loading={loading} />

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Comment obtenir un code ?</Text>
          <Text style={styles.helpText}>
            Demandez à un membre de la famille déjà inscrit de vous partager le
            code famille depuis l'application MyCompanion.
          </Text>
          
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#10b981" />
              <Text style={styles.featureText}>Accès sécurisé</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="notifications-outline" size={24} color="#10b981" />
              <Text style={styles.featureText}>Alertes en temps réel</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="heart-outline" size={24} color="#10b981" />
              <Text style={styles.featureText}>Suivi de santé</Text>
            </View>
          </View>
        </View>
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  helpSection: {
    marginTop: 40,
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
  },
});