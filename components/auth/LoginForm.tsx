import { signInWithEmail } from "@/utils/SupaLegend";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface LoginFormProps {
  onToggleMode: () => void;
}

export default function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      Alert.alert("Succès", "Connexion réussie !");
    } catch (error: any) {
      Alert.alert("Erreur de connexion", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (type: "admin" | "family" | "senior" | "saad") => {
    const accounts = {
      admin: "admin@mycompanion.fr",
      family: "marie.dubois@gmail.com",
      senior: "suzanne.demo@senior.fr",
      saad: "saad.lyon@saad.fr",
    };

    setEmail(accounts[type]);
    setPassword("demo123");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 MyCompanion</Text>
        <Text style={styles.subtitle}>Connexion</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onToggleMode}
        >
          <Text style={styles.secondaryButtonText}>Créer un compte</Text>
        </TouchableOpacity>
      </View>

      {/* Comptes de démonstration */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>🎯 Comptes de démonstration :</Text>
        <View style={styles.demoButtons}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => fillDemoAccount("admin")}
          >
            <Text style={styles.demoButtonText}>👑 Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => fillDemoAccount("family")}
          >
            <Text style={styles.demoButtonText}>👨‍👩‍👧‍👦 Famille</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => fillDemoAccount("senior")}
          >
            <Text style={styles.demoButtonText}>👴 Senior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => fillDemoAccount("saad")}
          >
            <Text style={styles.demoButtonText}>🏢 SAAD</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.demoPassword}>Mot de passe : demo123</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4f46e5",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#64748b",
  },
  form: {
    marginBottom: 30,
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
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#4f46e5",
    fontSize: 16,
    fontWeight: "600",
  },
  demoSection: {
    backgroundColor: "#f1f5f9",
    padding: 20,
    borderRadius: 12,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
    textAlign: "center",
  },
  demoButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  demoButton: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: "48%",
    alignItems: "center",
  },
  demoButtonText: {
    fontSize: 12,
    color: "#64748b",
  },
  demoPassword: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
    textAlign: "center",
  },
});
