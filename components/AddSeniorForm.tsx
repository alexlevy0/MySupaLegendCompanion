import { addSenior, createFamilyRelation, useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Alert from "@/utils/Alert";

interface AddSeniorFormProps {
  onSuccess?: (seniorId: string) => void;
  onCancel?: () => void;
}

export default function AddSeniorForm({
  onSuccess,
  onCancel,
}: AddSeniorFormProps) {
  const { userProfile } = useMyCompanionAuth();

  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"info" | "preferences" | "confirmation">(
    "info"
  );

  // Informations personnelles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [relationship, setRelationship] = useState("enfant");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Address
  const [address, setAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
  });

  // Préférences d'appel
  const [callTime, setCallTime] = useState("09:00");
  const [callFrequency, setCallFrequency] = useState(1); // Fois par jour
  const [isPrimaryContact, setIsPrimaryContact] = useState(true);

  // Préférences de notification
  const [notifications, setNotifications] = useState({
    dailyReports: true,
    emergencyAlerts: true,
    weeklyReports: true,
    smsAlerts: true,
  });

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return false;
    }

    // Validation basique du téléphone français
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      Alert.alert(
        "Numéro invalide",
        "Veuillez saisir un numéro de téléphone français valide\n(ex: 06 12 34 56 78)"
      );
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === "info" && validateStep1()) {
      setStep("preferences");
    } else if (step === "preferences") {
      setStep("confirmation");
    }
  };

  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le profil senior
      const seniorData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone.replace(/\s/g, ""), // Nettoyer le téléphone
        birth_date: birthDate || null,
        preferred_call_time: callTime,
        call_frequency: callFrequency,
        emergency_contact: emergencyContact || phone,
        address: {
          street: address.street,
          city: address.city,
          postal_code: address.postalCode,
        },
        // Pas de user_id car le senior n'a pas encore de compte MyCompanion
      };

      const seniorId = await addSenior(seniorData);

      // 2. Créer la relation familiale
      await createFamilyRelation({
        user_id: userProfile.id,
        senior_id: seniorId,
        relationship,
        is_primary_contact: isPrimaryContact,
        notification_preferences: notifications,
        access_level: "full", // Accès complet pour le créateur
      });

      // 3. Envoyer SMS de bienvenue (optionnel)
      // await sendWelcomeSMS(phone, firstName);

      Alert.alert(
        "✅ Senior ajouté !",
        `${firstName} ${lastName} a été ajouté avec succès.\nLes appels quotidiens commenceront dès demain à ${callTime}.`,
        [
          {
            text: "OK",
            onPress: () => onSuccess?.(seniorId),
          },
        ]
      );
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du senior:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible d'ajouter le senior. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepInfo = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📱 Informations du senior</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Prénom *</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Suzanne"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Dupont"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de téléphone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="06 12 34 56 78"
          keyboardType="phone-pad"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          📞 MyCompanion appellera ce numéro quotidiennement
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date de naissance (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="1945-03-15"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Votre lien de parenté</Text>
        <View style={styles.relationshipContainer}>
          {["enfant", "conjoint(e)", "frère/sœur", "autre"].map((rel) => (
            <TouchableOpacity
              key={rel}
              style={[
                styles.relationshipButton,
                relationship === rel && styles.relationshipButtonActive,
              ]}
              onPress={() => setRelationship(rel)}
            >
              <Text
                style={[
                  styles.relationshipText,
                  relationship === rel && styles.relationshipTextActive,
                ]}
              >
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Adresse (optionnel) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse (optionnel)</Text>
        <TextInput
          style={styles.input}
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
          placeholder="12 rue de la Paix"
        />
        <View style={styles.addressRow}>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={address.postalCode}
            onChangeText={(text) =>
              setAddress({ ...address, postalCode: text })
            }
            placeholder="69000"
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
            placeholder="Lyon"
          />
        </View>
      </View>
    </View>
  );

  const renderStepPreferences = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>⚙️ Préférences d'appel</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Heure d'appel quotidien</Text>
        <TextInput
          style={styles.input}
          value={callTime}
          onChangeText={setCallTime}
          placeholder="09:00"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Format 24h (ex: 09:00 pour 9h du matin)</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fréquence d'appel</Text>
        <View style={styles.frequencyContainer}>
          {[1, 2, 3].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                callFrequency === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => setCallFrequency(freq)}
            >
              <Text
                style={[
                  styles.frequencyText,
                  callFrequency === freq && styles.frequencyTextActive,
                ]}
              >
                {freq === 1 ? "1x/jour" : `${freq}x/jour`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contact d'urgence</Text>
        <TextInput
          style={styles.input}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          placeholder="Votre numéro ou celui d'un proche"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>🔔 Notifications pour vous</Text>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Rapports quotidiens</Text>
          <Switch
            value={notifications.dailyReports}
            onValueChange={(value) =>
              setNotifications({ ...notifications, dailyReports: value })
            }
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Alertes d'urgence</Text>
          <Switch
            value={notifications.emergencyAlerts}
            onValueChange={(value) =>
              setNotifications({ ...notifications, emergencyAlerts: value })
            }
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Résumés hebdomadaires</Text>
          <Switch
            value={notifications.weeklyReports}
            onValueChange={(value) =>
              setNotifications({ ...notifications, weeklyReports: value })
            }
          />
        </View>

        <View style={styles.notificationItem}>
          <Text style={styles.notificationLabel}>Alertes par SMS</Text>
          <Switch
            value={notifications.smsAlerts}
            onValueChange={(value) =>
              setNotifications({ ...notifications, smsAlerts: value })
            }
          />
        </View>
      </View>
    </View>
  );

  const renderStepConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>✅ Confirmation</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Récapitulatif</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Senior :</Text>
          <Text style={styles.summaryValue}>
            {firstName} {lastName}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Téléphone :</Text>
          <Text style={styles.summaryValue}>{phone}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Appel quotidien :</Text>
          <Text style={styles.summaryValue}>
            {callTime} ({callFrequency}x/jour)
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Votre lien :</Text>
          <Text style={styles.summaryValue}>{relationship}</Text>
        </View>

        {address.city && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ville :</Text>
            <Text style={styles.summaryValue}>{address.city}</Text>
          </View>
        )}
      </View>

      <Text style={styles.confirmationText}>
        🤖 MyCompanion commencera à appeler {firstName} dès demain à {callTime}.
        {"\n\n"}
        📊 Vous recevrez des rapports quotidiens sur son bien-être.
        {"\n\n"}
        🚨 En cas d'urgence détectée, vous serez alerté immédiatement.
      </Text>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case "info":
        return renderStepInfo();
      case "preferences":
        return renderStepPreferences();
      case "confirmation":
        return renderStepConfirmation();
      default:
        return renderStepInfo();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec progression */}
      <View style={styles.header}>
        <Text style={styles.title}>👴 Ajouter un senior</Text>

        <View style={styles.progressContainer}>
          {["info", "preferences", "confirmation"].map((stepName, index) => (
            <View
              key={stepName}
              style={[
                styles.progressDot,
                step === stepName && styles.progressDotActive,
                ["info", "preferences", "confirmation"].indexOf(step) > index &&
                  styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        <Text style={styles.stepIndicator}>
          Étape {["info", "preferences", "confirmation"].indexOf(step) + 1} sur
          3
        </Text>
      </View>

      {/* Contenu scrollable */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Boutons navigation */}
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {step !== "info" && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                if (step === "preferences") setStep("info");
                if (step === "confirmation") setStep("preferences");
              }}
            >
              <Text style={styles.secondaryButtonText}>← Précédent</Text>
            </TouchableOpacity>
          )}

          {onCancel && step === "info" && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={step === "confirmation" ? handleSubmit : handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === "confirmation" ? "✅ Créer le profil" : "Suivant →"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: "#4f46e5",
  },
  progressDotCompleted: {
    backgroundColor: "#10b981",
  },
  stepIndicator: {
    fontSize: 14,
    color: "#64748b",
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
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
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  relationshipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  relationshipButtonActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  relationshipText: {
    fontSize: 14,
    color: "#64748b",
  },
  relationshipTextActive: {
    color: "white",
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  addressInput: {
    flex: 1,
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  frequencyButtonActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  frequencyText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  frequencyTextActive: {
    color: "white",
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  notificationLabel: {
    fontSize: 16,
    color: "#374151",
  },
  summaryCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  confirmationText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    textAlign: "center",
  },
  footer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    padding: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  secondaryButtonText: {
    color: "#4f46e5",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
});
