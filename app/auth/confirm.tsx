// app/auth/confirm.tsx
import { supabase } from "@/utils/SupaLegend";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Alert from "@/utils/Alert";

export default function AuthConfirm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"confirming" | "success" | "error">(
    "confirming"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleAuthConfirmation = async () => {
      try {
        console.log("📧 Auth confirmation params:", params);

        // Extraire les paramètres de l'URL
        const {
          token_hash,
          type,
          access_token,
          refresh_token,
          expires_at,
          token,
          email,
        } = params;

        // Vérification par token_hash (nouveau format)
        if (token_hash && type) {
          console.log("🔐 Using token_hash verification");

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token_hash as string,
            type: type as any,
          });

          if (error) throw error;

          setStatus("success");

          // Rediriger après un court délai
          setTimeout(() => {
            router.replace("/(tabs)/");
          }, 2000);
        }
        // Vérification par access_token (ancien format)
        else if (access_token && refresh_token) {
          console.log("🔑 Using access_token verification");

          const { data, error } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: refresh_token as string,
          });

          if (error) throw error;

          setStatus("success");

          // Rediriger après un court délai
          setTimeout(() => {
            router.replace("/(tabs)/");
          }, 2000);
        }
        // Aucun paramètre de confirmation trouvé
        else {
          throw new Error("Paramètres de confirmation manquants");
        }
      } catch (error: any) {
        console.error("❌ Auth confirmation error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Erreur lors de la confirmation");
      } finally {
        setLoading(false);
      }
    };

    // Petit délai pour laisser le temps aux paramètres d'arriver
    const timeout = setTimeout(handleAuthConfirmation, 1000);

    return () => clearTimeout(timeout);
  }, [params]);

  if (loading || status === "confirming") {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.title}>🤖 MyCompanion</Text>
        <Text style={styles.message}>
          Confirmation de votre compte en cours...
        </Text>
      </View>
    );
  }

  if (status === "success") {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.title}>Compte confirmé !</Text>
        <Text style={styles.message}>
          Votre compte MyCompanion a été confirmé avec succès.{"\n"}
          Redirection vers l'application...
        </Text>
        <ActivityIndicator size="small" color="#10b981" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.title}>Erreur de confirmation</Text>
      <Text style={styles.errorMessage}>{errorMessage}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/")}
      >
        <Text style={styles.buttonText}>Retour à l'application</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => {
          Alert.alert(
            "Aide",
            "Si le problème persiste, contactez le support à support@mycompanion.fr"
          );
        }}
      >
        <Text style={styles.secondaryButtonText}>Besoin d'aide ?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  loader: {
    marginTop: 16,
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
});
