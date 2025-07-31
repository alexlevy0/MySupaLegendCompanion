// EditSeniorForm.tsx
import {
    getSeniorById,
    updateSenior,
    useMyCompanionAuth,
    validateFrenchPhone,
} from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Alert from "@/utils/Alert";

interface EditSeniorFormProps {
  seniorId: string;
  onSuccess?: (seniorId: string) => void;
  onCancel?: () => void;
}

interface SeniorData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string;
  preferred_call_time: string;
  call_frequency: number;
  emergency_contact?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
  };
  personality_profile?: any;
  medical_context?: any;
  interests?: any;
  communication_preferences?: any;
}

export default function EditSeniorForm({
  seniorId,
  onSuccess,
  onCancel,
}: EditSeniorFormProps) {
  const { userProfile } = useMyCompanionAuth();

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seniorData, setSeniorData] = useState<SeniorData | null>(null);

  // États du formulaire - Informations personnelles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Adresse
  const [address, setAddress] = useState({
    street: "",
    city: "",
    postalCode: "",
  });

  // Préférences d'appel
  const [callTime, setCallTime] = useState("09:00");
  const [callFrequency, setCallFrequency] = useState(1);

  // Préférences avancées
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [interests, setInterests] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [personalityNotes, setPersonalityNotes] = useState("");

  const formatTimeForDisplay = (time: string) => {
    if (!time) return "09:00";

    // Si le format est HH:MM:SS, on retire les secondes
    if (time.includes(":") && time.split(":").length === 3) {
      return time.substring(0, 5); // Garde seulement HH:MM
    }

    return time;
  };

  // Dans loadSeniorData, modifiez cette ligne :

  // Charger les données du senior
  const loadSeniorData = async () => {
    try {
      setLoading(true);
      console.log("📊 Loading senior data for:", seniorId);

      const senior = await getSeniorById(seniorId);
      if (!senior) {
        throw new Error("Senior non trouvé");
      }

      setSeniorData(senior);

      // Pré-remplir le formulaire
      setFirstName(senior.first_name || "");
      setLastName(senior.last_name || "");
      setPhone(senior.phone || "");
      setBirthDate(senior.birth_date || "");
      setCallTime(formatTimeForDisplay(senior.preferred_call_time) || "09:00");
      setCallFrequency(senior.call_frequency || 1);
      setEmergencyContact(senior.emergency_contact || "");

      // Adresse
      const addr = senior.address || {};
      setAddress({
        street: addr.street || "",
        city: addr.city || "",
        postalCode: addr.postal_code || "",
      });

      // Préférences avancées
      setInterests(
        senior.interests
          ? typeof senior.interests === "string"
            ? senior.interests
            : JSON.stringify(senior.interests)
          : ""
      );
      setMedicalNotes(
        senior.medical_context
          ? typeof senior.medical_context === "string"
            ? senior.medical_context
            : JSON.stringify(senior.medical_context)
          : ""
      );
      setPersonalityNotes(
        senior.personality_profile
          ? typeof senior.personality_profile === "string"
            ? senior.personality_profile
            : JSON.stringify(senior.personality_profile)
          : ""
      );

      console.log("✅ Senior data loaded successfully");
    } catch (error: any) {
      console.error("❌ Failed to load senior data:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les données du senior"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (seniorId) {
      loadSeniorData();
    }
  }, [seniorId]);

  // Validation du formulaire
  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Erreur", "Le prénom et le nom sont obligatoires");
      return false;
    }

    if (!phone.trim()) {
      Alert.alert("Erreur", "Le numéro de téléphone est obligatoire");
      return false;
    }

    // Validation du téléphone
    const phoneValidation = validateFrenchPhone(phone);
    if (!phoneValidation.isValid) {
      Alert.alert(
        "Numéro invalide",
        phoneValidation.error || "Format incorrect"
      );
      return false;
    }

    // Validation de l'heure
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(callTime)) {
      Alert.alert("Erreur", "Format d'heure invalide (HH:MM)");
      return false;
    }

    return true;
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!validateForm() || !userProfile || !seniorData) {
      return;
    }

    setSaving(true);
    try {
      console.log("💾 Saving senior data...");
      const formattedCallTime =
        callTime.includes(":") && callTime.split(":").length === 2
          ? `${callTime}:00` // Ajouter :00 si seulement HH:MM
          : callTime;

      // Préparer les données de mise à jour
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: validateFrenchPhone(phone).cleaned,
        birth_date: birthDate || null,
        preferred_call_time: formattedCallTime,
        call_frequency: callFrequency,
        emergency_contact:
          emergencyContact || validateFrenchPhone(phone).cleaned,
        address: {
          street: address.street,
          city: address.city,
          postal_code: address.postalCode,
        },
        interests: interests ? { notes: interests } : null,
        medical_context: medicalNotes ? { notes: medicalNotes } : null,
        personality_profile: personalityNotes
          ? { notes: personalityNotes }
          : null,
      };

      await updateSenior(seniorId, updateData);

      Alert.alert(
        "✅ Modifications sauvegardées !",
        `Les informations de ${firstName} ${lastName} ont été mises à jour avec succès.`,
        [
          {
            text: "OK",
            onPress: () => onSuccess?.(seniorId),
          },
        ]
      );
    } catch (error: any) {
      console.error("❌ Failed to save senior data:", error);
      Alert.alert(
        "Erreur de sauvegarde",
        error.message || "Impossible de sauvegarder les modifications"
      );
    } finally {
      setSaving(false);
    }
  };

  // Confirmer l'annulation si des modifications ont été faites
  const handleCancel = () => {
    // Vérifier si des modifications ont été faites
    const hasChanges =
      seniorData &&
      (firstName !== (seniorData.first_name || "") ||
        lastName !== (seniorData.last_name || "") ||
        phone !== (seniorData.phone || "") ||
        callTime !== (seniorData.preferred_call_time || "09:00") ||
        callFrequency !== (seniorData.call_frequency || 1));

    if (hasChanges) {
      Alert.alert(
        "Modifications non sauvegardées",
        "Êtes-vous sûr de vouloir annuler ? Vos modifications seront perdues.",
        [
          { text: "Continuer l'édition", style: "cancel" },
          {
            text: "Abandonner",
            style: "destructive",
            onPress: onCancel,
          },
        ]
      );
    } else {
      onCancel?.();
    }
  };

  // Écran de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  // Erreur si pas de données
  if (!seniorData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>😔</Text>
        <Text style={styles.errorTitle}>Données non trouvées</Text>
        <Text style={styles.errorMessage}>
          Impossible de charger les informations de ce senior.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSeniorData}>
          <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>✕ Annuler</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>✏️ Éditer le profil</Text>
          <Text style={styles.headerSubtitle}>
            {seniorData.first_name} {seniorData.last_name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>💾 Sauver</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Formulaire */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Informations personnelles</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Prénom *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Suzanne"
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Nom *</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Dupont"
                autoCapitalize="words"
              />
            </View>
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
              📞 Numéro appelé quotidiennement par MyCompanion
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="1945-03-15"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Format AAAA-MM-JJ (optionnel)</Text>
          </View>
        </View>

        {/* Préférences d'appel */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Préférences d'appel</Text>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Heure d'appel</Text>
              <TextInput
                style={styles.input}
                value={callTime}
                onChangeText={setCallTime}
                placeholder="09:00"
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Format 24h</Text>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Fréquence</Text>
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
                      {freq}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact d'urgence</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Numéro d'urgence (par défaut le même)"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Adresse */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 Adresse</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Rue</Text>
            <TextInput
              style={styles.input}
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
              placeholder="12 rue de la Paix"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.quarterWidth]}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                value={address.postalCode}
                onChangeText={(text) =>
                  setAddress({ ...address, postalCode: text })
                }
                placeholder="69000"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputContainer, styles.threeQuarterWidth]}>
              <Text style={styles.label}>Ville</Text>
              <TextInput
                style={styles.input}
                value={address.city}
                onChangeText={(text) => setAddress({ ...address, city: text })}
                placeholder="Lyon"
              />
            </View>
          </View>
        </View>

        {/* Section avancée */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.advancedToggleText}>
              ⚙️ Options avancées {showAdvanced ? "▼" : "▶"}
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>🎯 Centres d'intérêt</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={interests}
                  onChangeText={setInterests}
                  placeholder="Jardinage, lecture, cuisine, petits-enfants..."
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.hint}>
                  Aide MyCompanion à personnaliser les conversations
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>🏥 Notes médicales</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                  placeholder="Médicaments, allergies, problèmes de santé..."
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.hint}>
                  Informations confidentielles pour détecter les signaux
                  d'alerte
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>😊 Notes de personnalité</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={personalityNotes}
                  onChangeText={setPersonalityNotes}
                  placeholder="Caractère, habitudes, préférences de conversation..."
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.hint}>
                  Aide à adapter le ton et le style de conversation
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Informations de dernière modification */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Informations</Text>
          <Text style={styles.infoText}>
            Profil créé le{" "}
            {new Date(seniorData.created_at).toLocaleDateString("fr-FR")}
          </Text>
          <Text style={styles.infoText}>
            Dernière modification le{" "}
            {new Date(seniorData.updated_at).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {/* Espacement pour éviter que le clavier cache le contenu */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: "#f8fafc",
  },
  errorIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  saveButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  quarterWidth: {
    flex: 1,
  },
  threeQuarterWidth: {
    flex: 3,
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  frequencyContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
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
  advancedToggle: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16,
  },
  advancedToggleText: {
    fontSize: 16,
    color: "#4f46e5",
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#f8fafc",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 50,
  },
});
