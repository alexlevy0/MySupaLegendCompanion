import { UserType, signUpMyCompanionUser } from "@/utils/SupaLegend";
import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface SignUpFormProps {
  onToggleMode: () => void;
}

export default function SignUpForm({ onToggleMode }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("family");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Erreur",
        "Le mot de passe doit contenir au moins 6 caractères"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await signUpMyCompanionUser(email, password, {
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
      });

      if (!result.session) {
        Alert.alert(
          "Vérification requise",
          "Veuillez vérifier votre email pour confirmer votre compte !",
          [{ text: "OK", onPress: onToggleMode }]
        );
      } else {
        Alert.alert(
          "Succès",
          `Compte ${getUserTypeLabel(userType)} créé avec succès !`
        );
      }
    } catch (error: any) {
      Alert.alert("Erreur d'inscription", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type: UserType) => {
    const labels = {
      admin: "👑 Administrateur",
      senior: "👴 Senior",
      family: "👨‍👩‍👧‍👦 Famille",
      saad_admin: "🏢 Directeur SAAD",
      saad_worker: "👩‍⚕️ Auxiliaire SAAD",
      insurer: "🏛️ Assureur",
    };
    return labels[type];
  };

  const getUserTypeDescription = (type: UserType) => {
    const descriptions = {
      admin: "Accès complet à la plateforme",
      senior: "Bénéficiaire des appels MyCompanion",
      family: "Proche d'un senior, reçoit les rapports",
      saad_admin: "Directeur d'un service d'aide à domicile",
      saad_worker: "Auxiliaire de vie à domicile",
      insurer: "Représentant d'une compagnie d'assurance",
    };
    return descriptions[type];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 MyCompanion</Text>
        <Text style={styles.subtitle}>Créer un compte</Text>
      </View>

      <View style={styles.form}>
        {/* Type de compte */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Type de compte *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={userType}
              onValueChange={setUserType}
              style={styles.picker}
            >
              <Picker.Item label={getUserTypeLabel("family")} value="family" />
              <Picker.Item label={getUserTypeLabel("senior")} value="senior" />
              <Picker.Item
                label={getUserTypeLabel("saad_admin")}
                value="saad_admin"
              />
              <Picker.Item
                label={getUserTypeLabel("saad_worker")}
                value="saad_worker"
              />
              <Picker.Item label={getUserTypeLabel("admin")} value="admin" />
            </Picker>
          </View>
          <Text style={styles.typeDescription}>
            {getUserTypeDescription(userType)}
          </Text>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email *</Text>
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

        {/* Mot de passe */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe *</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />
          <Text style={styles.hint}>Minimum 6 caractères</Text>
        </View>

        {/* Prénom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Jean"
          />
        </View>

        {/* Nom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Dupont"
          />
        </View>

        {/* Téléphone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+33 1 23 45 67 89"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Créer le compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onToggleMode}
        >
          <Text style={styles.secondaryButtonText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
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
  pickerContainer: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  picker: {
    height: 50,
  },
  typeDescription: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
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
});
