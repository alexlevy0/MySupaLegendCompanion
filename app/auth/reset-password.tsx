// app/auth/reset-password.tsx
import { supabase } from "@/utils/SupaLegend";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkResetSession = async () => {
      try {
        // Vérifier si on a une session valide pour le reset
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setValidSession(true);
        } else {
          // Tenter de récupérer la session depuis les paramètres URL
          const { access_token, refresh_token } = params;

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: access_token as string,
              refresh_token: refresh_token as string,
            });

            if (!error) {
              setValidSession(true);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error checking reset session:", error);
      } finally {
        setChecking(false);
      }
    };

    checkResetSession();
  }, [params]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert(
        "✅ Mot de passe modifié",
        "Votre mot de passe a été modifié avec succès !",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible de modifier le mot de passe"
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.title}>🤖 MyCompanion</Text>
        <Text style={styles.message}>Vérification en cours...</Text>
      </View>
    );
  }

  if (!validSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.title}>Lien expiré</Text>
        <Text style={styles.message}>
          Ce lien de réinitialisation a expiré ou n'est plus valide.{"\n\n"}
          Demandez un nouveau lien de réinitialisation.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/")}
        >
          <Text style={styles.buttonText}>Retour à l'application</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.form}>
        <Text style={styles.title}>🔒 Nouveau mot de passe</Text>
        <Text style={styles.subtitle}>
          Choisissez un nouveau mot de passe sécurisé pour votre compte
          MyCompanion.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nouveau mot de passe</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.hint}>
          💡 Le mot de passe doit contenir au moins 6 caractères
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>✅ Modifier le mot de passe</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.replace("/(tabs)/")}
        >
          <Text style={styles.secondaryButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  form: {
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  message: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  hint: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
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
