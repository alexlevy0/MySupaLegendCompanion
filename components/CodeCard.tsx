import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Share,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

interface CodeCardProps {
  code: string | null;
  loading?: boolean;
  statistics?: {
    expiresAt: Date | null;
    currentUses: number;
    maxUses: number;
    remainingUses: number;
    isActive: boolean;
  };
  onRegenerate?: () => void;
  onShare?: () => void;
}

export default function CodeCard({
  code,
  loading = false,
  statistics,
  onRegenerate,
  onShare,
}: CodeCardProps) {
  const [copyAnimValue] = useState(new Animated.Value(0));
  const [showCopied, setShowCopied] = useState(false);
  const [codeAnimValue] = useState(new Animated.Value(0));
  const [previousCode, setPreviousCode] = useState(code);
  const [showNewCode, setShowNewCode] = useState(false);

  // Animation quand le code change
  React.useEffect(() => {
    if (code && code !== previousCode) {
      setPreviousCode(code);
      setShowNewCode(true);
      
      // Animation de "pulse" pour montrer le nouveau code
      Animated.sequence([
        Animated.timing(codeAnimValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(codeAnimValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Masquer le message après 3 secondes
      setTimeout(() => setShowNewCode(false), 3000);
    }
  }, [code, previousCode, codeAnimValue]);

  const handleCopy = async () => {
    if (!code) return;

    try {
      await Clipboard.setStringAsync(code);
      
      // Animation de copie
      setShowCopied(true);
      Animated.sequence([
        Animated.timing(copyAnimValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(copyAnimValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCopied(false));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de copier le code");
    }
  };

  const handleShare = async () => {
    if (!code) return;

    try {
      const message = `Rejoignez ma famille sur MyCompanion avec ce code : ${code}\n\nTéléchargez l'app et utilisez ce code pour accéder aux informations de votre proche.`;
      
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Share.share({
          message,
          title: "Code famille MyCompanion",
        });
      } else {
        // Fallback pour web
        await Clipboard.setStringAsync(message);
        Alert.alert("Succès", "Message copié dans le presse-papier");
      }
      
      onShare?.();
    } catch (error) {
      console.error("Erreur partage:", error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("fr-FR", options);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!code || !statistics?.isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.noCodeContainer}>
          <Ionicons name="lock-closed-outline" size={48} color="#9ca3af" />
          <Text style={styles.noCodeText}>Aucun code actif</Text>
          {onRegenerate && (
            <TouchableOpacity style={styles.generateButton} onPress={onRegenerate}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Générer un code</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Carte principale du code */}
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MC</Text>
          </View>
          <Text style={styles.title}>Code Famille</Text>
        </View>

        {/* Message de nouveau code */}
        {showNewCode && (
          <Animated.View
            style={[
              styles.newCodeMessage,
              {
                opacity: codeAnimValue,
                transform: [
                  {
                    translateY: codeAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.newCodeText}>Nouveau code généré !</Text>
          </Animated.View>
        )}

        {/* Zone du code */}
        <TouchableOpacity style={styles.codeContainer} onPress={handleCopy}>
          <Animated.Text 
            style={[
              styles.code,
              {
                transform: [
                  {
                    scale: codeAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.1],
                    }),
                  },
                ],
              },
            ]}
          >
            {code}
          </Animated.Text>
          <View style={styles.copyIconContainer}>
            {showCopied ? (
              <Animated.View
                style={[
                  styles.copiedBadge,
                  {
                    opacity: copyAnimValue,
                    transform: [
                      {
                        scale: copyAnimValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.copiedText}>Copié !</Text>
              </Animated.View>
            ) : (
              <Ionicons name="copy-outline" size={24} color="#4f46e5" />
            )}
          </View>
        </TouchableOpacity>

        {/* Statistiques */}
        {statistics && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {statistics.currentUses}/{statistics.maxUses}
              </Text>
              <Text style={styles.statLabel}>Utilisations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{statistics.remainingUses}</Text>
              <Text style={styles.statLabel}>Restantes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDate(statistics.expiresAt)}
              </Text>
              <Text style={styles.statLabel}>Expiration</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#4f46e5" />
            <Text style={styles.actionText}>Partager</Text>
          </TouchableOpacity>
          
          {onRegenerate && (
            <TouchableOpacity
              style={[styles.actionButton, styles.regenerateButton]}
              onPress={onRegenerate}
            >
              <Ionicons name="refresh-outline" size={20} color="#6b7280" />
              <Text style={[styles.actionText, styles.regenerateText]}>
                Régénérer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Message d'aide */}
      <View style={styles.helpContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text style={styles.helpText}>
          Partagez ce code avec les membres de votre famille pour qu'ils puissent
          accéder aux informations de votre proche
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  codeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  codeContainer: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  code: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: 2,
  },
  copyIconContainer: {
    marginLeft: 12,
  },
  copiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  copiedText: {
    color: "#10b981",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ede9fe",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionText: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  regenerateButton: {
    backgroundColor: "#f3f4f6",
  },
  regenerateText: {
    color: "#6b7280",
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingHorizontal: 4,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  noCodeContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noCodeText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    marginBottom: 20,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  newCodeMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  newCodeText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
  },
});