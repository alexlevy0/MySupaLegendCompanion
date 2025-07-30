// app/auth/confirm.web.tsx
import { supabase } from "@/utils/SupaLegend";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AuthConfirmWeb() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"confirming" | "success" | "error">(
    "confirming"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleWebAuthConfirmation = async () => {
      try {
        console.log("🌐 Web auth confirmation");

        // Pour le web, les paramètres sont dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.substring(1));

        // Combiner les paramètres de query et de fragment
        const params = {
          ...Object.fromEntries(urlParams),
          ...Object.fromEntries(fragment),
        };

        console.log("📧 Web auth params:", params);

        const { token_hash, type, access_token, refresh_token } = params;

        // Méthode moderne avec token_hash
        if (token_hash && type) {
          console.log("🔐 Using token_hash verification (web)");

          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) throw error;

          setStatus("success");

          // Rediriger après confirmation
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
        // Méthode avec access_token
        else if (access_token && refresh_token) {
          console.log("🔑 Using access_token verification (web)");

          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) throw error;

          setStatus("success");

          // Rediriger après confirmation
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
        // Gestion automatique par Supabase (callback URL)
        else {
          console.log("🔄 Checking for automatic session");

          // Attendre un peu pour que Supabase traite automatiquement
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            setStatus("success");
            setTimeout(() => {
              window.location.href = "/";
            }, 1000);
          } else {
            throw new Error("Aucune session trouvée après confirmation");
          }
        }
      } catch (error: any) {
        console.error("❌ Web auth confirmation error:", error);
        setStatus("error");
        setErrorMessage(error.message || "Erreur lors de la confirmation");
      } finally {
        setLoading(false);
      }
    };

    // Traitement immédiat pour le web
    handleWebAuthConfirmation();
  }, []);

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
        onPress={() => (window.location.href = "/")}
      >
        <Text style={styles.buttonText}>Retour à l'application</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => {
          alert(
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
    minHeight: "100vh",
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
    cursor: "pointer",
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
