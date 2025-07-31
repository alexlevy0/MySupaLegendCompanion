import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

interface CodeInputProps {
  onSubmit: (code: string, relationship: string) => Promise<void>;
  loading?: boolean;
}

const RELATIONSHIPS = [
  { label: "Enfant", value: "enfant" },
  { label: "Conjoint(e)", value: "conjoint" },
  { label: "Frère/Sœur", value: "frere_soeur" },
  { label: "Parent", value: "parent" },
  { label: "Petit-enfant", value: "petit_enfant" },
  { label: "Ami(e)", value: "ami" },
  { label: "Autre", value: "autre" },
];

export default function CodeInput({ onSubmit, loading = false }: CodeInputProps) {
  const [code, setCode] = useState("");
  const [relationship, setRelationship] = useState("enfant");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const formatCode = (text: string) => {
    // Enlever tous les caractères non alphanumériques et mettre en majuscules
    const cleaned = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    
    // Ajouter le tiret après "MC" si nécessaire
    if (cleaned.length > 2 && !cleaned.includes("-")) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 7)}`;
    }
    
    return cleaned.slice(0, 7);
  };

  const handleCodeChange = (text: string) => {
    const formatted = formatCode(text);
    setCode(formatted);
    setError("");
  };

  const validateCode = () => {
    if (!code) {
      setError("Veuillez saisir un code");
      return false;
    }

    if (code.length < 7) {
      setError("Le code doit contenir 7 caractères");
      return false;
    }

    if (!code.startsWith("MC-")) {
      setError("Le code doit commencer par MC-");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateCode()) return;

    try {
      await onSubmit(code, relationship);
    } catch (error) {
      setError("Erreur lors de la validation du code");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="people-outline" size={32} color="#4f46e5" />
          </View>
          <Text style={styles.title}>Rejoindre une famille</Text>
          <Text style={styles.subtitle}>
            Saisissez le code partagé par votre proche
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Code famille</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.codeInput}
              value={code}
              onChangeText={handleCodeChange}
              placeholder="MC-XXXXX"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              editable={!loading}
            />
            {code.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setCode("");
                  setError("");
                  inputRef.current?.focus();
                }}
                disabled={loading}
              >
                <Ionicons name="close-circle" size={24} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.helpText}>
              Le code commence par MC- suivi de 5 caractères
            </Text>
          )}
        </View>

        {/* Relationship Picker */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Votre relation</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={relationship}
              onValueChange={setRelationship}
              enabled={!loading}
              style={styles.picker}
            >
              {RELATIONSHIPS.map((rel) => (
                <Picker.Item
                  key={rel.value}
                  label={rel.label}
                  value={rel.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!code || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!code || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="link-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Rejoindre la famille</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#6b7280"
          />
          <Text style={styles.infoText}>
            En rejoignant cette famille, vous pourrez accéder aux informations
            de santé et aux alertes de votre proche
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
  },
  codeInput: {
    flex: 1,
    height: 56,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
  },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  picker: {
    height: 56,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
});