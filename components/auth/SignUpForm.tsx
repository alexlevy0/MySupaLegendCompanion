import { UserType, signUpMyCompanionUser } from "@/utils/SupaLegend";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useTranslation } from "@/hooks/useTranslation";

interface SignUpFormProps {
  onToggleMode: () => void;
}

export default function SignUpForm({ onToggleMode }: SignUpFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("family");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        t('common.error'),
        t('auth.passwordMinLength')
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
          t('auth.verificationRequired'),
          t('auth.checkEmail'),
          [{ text: t('common.ok'), onPress: onToggleMode }]
        );
      } else {
        Alert.alert(
          t('common.success'),
          `${t('auth.signupSuccess')} ${getUserTypeLabel(userType)} !`
        );
      }
    } catch (error: any) {
      Alert.alert(t('auth.signupError'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (type: UserType) => {
    const labels: Record<UserType, string> = {
      admin: t('auth.userTypes.admin'),
      senior: t('auth.userTypes.senior'),
      family: t('auth.userTypes.family'),
      saad_admin: t('auth.userTypes.saad_admin'),
      saad_worker: t('auth.userTypes.saad_worker'),
      insurer: t('auth.userTypes.insurer'),
    };
    return labels[type];
  };

  const getUserTypeDescription = (type: UserType) => {
    const descriptions: Record<UserType, string> = {
      admin: "Accès complet à toutes les fonctionnalités",
      senior: "Interface simplifiée pour les bénéficiaires",
      family: "Suivi des proches et gestion des alertes",
      saad_admin: "Gestion des équipes et des services",
      saad_worker: "Interface pour les auxiliaires de vie",
      insurer: "Accès aux données pour les assureurs",
    };
    return descriptions[type];
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 MyCompanion</Text>
        <Text style={styles.subtitle}>{t('auth.signup')}</Text>
      </View>

      <View style={styles.form}>
        {/* Type de compte */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.userType')}</Text>
          <View style={styles.userTypeButtons}>
            {(["family", "senior", "admin", "saad_admin", "saad_worker", "insurer"] as UserType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.userTypeButton,
                  userType === type && styles.userTypeButtonActive,
                ]}
                onPress={() => setUserType(type)}
              >
                <Text
                  style={[
                    styles.userTypeButtonText,
                    userType === type && styles.userTypeButtonTextActive,
                  ]}
                >
                  {getUserTypeLabel(type)}
                </Text>
                <Text style={styles.userTypeDescription}>
                  {getUserTypeDescription(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Mot de passe */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.password')}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Prénom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('auth.firstName')}
            autoCapitalize="words"
          />
        </View>

        {/* Nom */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('auth.lastName')}
            autoCapitalize="words"
          />
        </View>

        {/* Téléphone */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phone')}
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
            <Text style={styles.buttonText}>{t('auth.signup')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onToggleMode}
        >
          <Text style={styles.secondaryButtonText}>{t('auth.login')}</Text>
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
    overflow: "hidden", // Important pour contenir le picker
    ...Platform.select({
      ios: {
        // Sur iOS, le picker prend toute la hauteur disponible
      },
      android: {
        // Sur Android, on force une hauteur minimum
        minHeight: 50,
      },
      web: {
        // Sur web, hauteur fixe
        height: 50,
      },
    }),
  },
  picker: {
    color: "#374151", // Couleur du texte par défaut
    ...Platform.select({
      ios: {
        height: 180, // Hauteur par défaut sur iOS
        color: "#374151",
      },
      android: {
        height: 50,
        color: "#374151", // Couleur du texte sur Android
        backgroundColor: "transparent",
      },
      web: {
        height: 50,
        color: "#374151",
        // Reset des styles web par défaut
        border: "none",
        outline: "none",
        backgroundColor: "transparent",
      },
    }),
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
  userTypeButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  userTypeButton: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  userTypeButtonActive: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e5",
  },
  userTypeButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  userTypeButtonTextActive: {
    color: "white",
  },
  userTypeDescription: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
});
