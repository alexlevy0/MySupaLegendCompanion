import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import {
  joinFamilyWithCode,
  getSeniorInfoByCode,
} from "@/utils/supabase/services/join-code-service";
import { useRouter } from "expo-router";

export default function JoinFamilyScreen() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [seniorInfo, setSeniorInfo] = useState<{
    firstName?: string;
    lastName?: string;
  } | null>(null);
  
  // Références pour les inputs
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null]);

  // Valider le code en temps réel
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 4) {
      validateCode(fullCode);
    } else {
      setSeniorInfo(null);
    }
  }, [code]);

  // Valider et obtenir les infos du senior
  const validateCode = async (fullCode: string) => {
    try {
      setValidating(true);
      const info = await getSeniorInfoByCode(fullCode);
      setSeniorInfo(info);
    } catch (error) {
      console.error("Error validating code:", error);
    } finally {
      setValidating(false);
    }
  };

  // Gérer la saisie du code
  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Si l'utilisateur colle plusieurs chiffres
      const digits = value.replace(/\D/g, "").split("");
      const newCode = [...code];
      
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newCode[index + i] = digit;
        }
      });
      
      setCode(newCode);
      
      // Focus sur le dernier input rempli
      const lastFilledIndex = Math.min(index + digits.length - 1, 3);
      if (lastFilledIndex < 3 && inputRefs.current[lastFilledIndex + 1]) {
        inputRefs.current[lastFilledIndex + 1]?.focus();
      }
    } else {
      // Saisie normale
      const newCode = [...code];
      newCode[index] = value.replace(/\D/g, "");
      setCode(newCode);

      // Auto-focus sur le prochain input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Gérer la suppression (backspace)
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Rejoindre la famille
  const handleJoinFamily = async () => {
    const fullCode = code.join("");
    
    if (fullCode.length !== 4) {
      Alert.alert("Code incomplet", "Veuillez saisir les 4 chiffres du code");
      return;
    }

    setLoading(true);
    try {
      const result = await joinFamilyWithCode(fullCode);
      
      if (result.success && result.seniorId) {
        Alert.alert(
          "✅ Bienvenue dans la famille !",
          `Vous avez rejoint la famille de ${seniorInfo?.firstName || "votre proche"} avec succès.`,
          [
            {
              text: "OK",
              onPress: () => {
                // Rediriger vers le détail du senior
                router.replace(`/(app)/senior/${result.seniorId}`);
              },
            },
          ]
        );
      } else {
        Alert.alert("Erreur", result.error || "Impossible de rejoindre la famille");
      }
    } catch (error) {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.dismissKeyboard}
          activeOpacity={1}
          onPress={Keyboard.dismiss}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>← Retour</Text>
              </TouchableOpacity>
            </View>

            {/* Titre */}
            <View style={styles.titleSection}>
              <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.title}>Rejoindre une famille</Text>
              <Text style={styles.subtitle}>
                Entrez le code à 4 chiffres qui vous a été partagé
              </Text>
            </View>

            {/* Code inputs */}
            <View style={styles.codeContainer}>
              <View style={styles.codeInputs}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit ? styles.codeInputFilled : {},
                    ]}
                    value={digit}
                    onChangeText={(value) => handleCodeChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    placeholder="0"
                    placeholderTextColor="#cbd5e1"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {/* Affichage des infos du senior si code valide */}
              {validating && (
                <View style={styles.validationInfo}>
                  <ActivityIndicator size="small" color="#4f46e5" />
                  <Text style={styles.validatingText}>Vérification...</Text>
                </View>
              )}

              {seniorInfo && !validating && (
                <View style={styles.seniorInfo}>
                  <Text style={styles.seniorInfoText}>
                    ✅ Code valide pour rejoindre la famille de
                  </Text>
                  <Text style={styles.seniorName}>
                    {seniorInfo.firstName} {seniorInfo.lastName}
                  </Text>
                </View>
              )}

              {!seniorInfo && !validating && code.join("").length === 4 && (
                <View style={styles.errorInfo}>
                  <Text style={styles.errorText}>❌ Code invalide</Text>
                </View>
              )}
            </View>

            {/* Bouton rejoindre */}
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!seniorInfo || loading) && styles.joinButtonDisabled,
              ]}
              onPress={handleJoinFamily}
              disabled={!seniorInfo || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.joinButtonText}>
                  Rejoindre la famille
                </Text>
              )}
            </TouchableOpacity>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>💡 Comment ça marche ?</Text>
              <Text style={styles.instructionText}>
                1. Demandez le code à 4 chiffres à un membre de la famille
              </Text>
              <Text style={styles.instructionText}>
                2. Entrez le code ci-dessus
              </Text>
              <Text style={styles.instructionText}>
                3. Vous aurez accès aux informations du senior
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  dismissKeyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  backButtonText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "600",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  codeContainer: {
    marginBottom: 40,
  },
  codeInputs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "white",
    color: "#1e293b",
  },
  codeInputFilled: {
    borderColor: "#4f46e5",
    backgroundColor: "#f8f7ff",
  },
  validationInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  validatingText: {
    fontSize: 14,
    color: "#4f46e5",
  },
  seniorInfo: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
  },
  seniorInfoText: {
    fontSize: 14,
    color: "#15803d",
    marginBottom: 4,
  },
  seniorName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#15803d",
  },
  errorInfo: {
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
  },
  joinButton: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  joinButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  instructions: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 20,
  },
});