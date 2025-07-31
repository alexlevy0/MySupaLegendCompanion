import { useTranslation } from "@/hooks/useTranslation";
import {
    changeEmail,
    changePassword,
    deleteUserAccount,
    sendPasswordResetEmail,
    useMyCompanionAuth,
    UserType
} from "@/utils/SupaLegend";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ProfileEditProps {
  onClose?: () => void;
}

export default function ProfileEdit({ onClose }: ProfileEditProps) {
  const { userProfile, isAdmin, reloadProfile } = useMyCompanionAuth();
  const { t } = useTranslation();

  // États pour l'édition
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | "preferences" | "danger"
  >("profile");

  // États pour les informations personnelles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<UserType>("family");

  // États pour la sécurité
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // États pour les préférences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  // États pour la suppression
  const [deletePassword, setDeletePassword] = useState("");

  // 🔧 useEffect pour synchroniser les valeurs avec userProfile
  useEffect(() => {
    if (userProfile) {
      console.log("🔄 Synchronizing profile data:", {
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        phone: userProfile.phone,
        userType: userProfile.user_type,
        email: userProfile.email,
      });

      setFirstName(userProfile.first_name || "");
      setLastName(userProfile.last_name || "");
      setPhone(userProfile.phone || "");
      setUserType(userProfile.user_type || "family");

      // Simuler les préférences (en attendant qu'elles soient dans la DB)
      // En production, vous pourriez avoir un champ JSON dans userProfile
      // ou une table séparée user_preferences
      setEmailNotifications(true); // Valeur par défaut
      setSmsNotifications(!!userProfile.phone); // SMS activé si téléphone présent
    }
  }, [userProfile]);

  // 🔧 Fonction pour réinitialiser les champs aux valeurs originales
  const resetToOriginalValues = () => {
    if (userProfile) {
      setFirstName(userProfile.first_name || "");
      setLastName(userProfile.last_name || "");
      setPhone(userProfile.phone || "");
      setUserType(userProfile.user_type || "family");

      // Réinitialiser les champs de sécurité
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewEmail("");
      setEmailPassword("");
      setDeletePassword("");
    }
  };

  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
      </View>
    );
  }

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);

      const updates = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || undefined,
        ...(isAdmin && { user_type: userType }), // Seuls les admins peuvent changer le type
      };

      console.log("📝 Updating profile with:", updates);

    //   await updateUserProfile(updates);
      await updateUserProfile(updates);


      Alert.alert(t('common.success'), t('profile.changesSaved'));
    reloadProfile?.();
    } catch (error: any) {
      console.error("❌ Profile update error:", error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordsDontMatchError'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        t('common.error'),
        t('profile.passwordMinLengthError')
      );
      return;
    }

    try {
      setIsLoading(true);
      await changePassword({ currentPassword, newPassword });

      Alert.alert(t('common.success'), t('profile.changesSaved'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert(t('common.error'), t('profile.fillAllFields'));
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert(t('common.error'), t('profile.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await changeEmail({ newEmail, password: emailPassword });

      Alert.alert(
        t('profile.emailConfirmationSent'),
        t('profile.emailConfirmationMessage')
      );
      setNewEmail("");
      setEmailPassword("");
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(userProfile.email);

      Alert.alert(
        t('profile.emailSent'),
        t('profile.resetEmailSent')
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert(t('common.error'), t('profile.enterPassword'));
      return;
    }

    Alert.alert(
      t('profile.deleteAccountConfirm'),
      t('profile.deleteAccountConfirmMessage'),
      [
        { text: t('profile.cancel'), style: "cancel" },
        {
          text: t('profile.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteUserAccount(deletePassword);
              Alert.alert(
                t('profile.accountDeleted'),
                t('profile.accountDeletedMessage')
              );
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // 🔧 Fonction pour sauvegarder les préférences
  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);

      // Pour l'instant, on simule la sauvegarde
      // En production, vous pourriez avoir une table user_preferences
      // ou un champ JSON dans la table users

      console.log("💾 Saving preferences:", {
        emailNotifications,
        smsNotifications,
      });

      // Ici vous pourriez faire un appel API pour sauvegarder les préférences
      // await updateUserPreferences({ emailNotifications, smsNotifications });

      Alert.alert(t('common.success'), t('profile.preferencesSaved'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabButton = (
    section: typeof activeSection,
    title: string,
    icon: string
  ) => (
    <TouchableOpacity
      style={[styles.tabButton, activeSection === section && styles.activeTab]}
      onPress={() => setActiveSection(section)}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text
        style={[
          styles.tabText,
          activeSection === section && styles.activeTabText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // 🔧 Vérifier si les valeurs ont changé
  const hasProfileChanges = () => {
    return (
      firstName !== (userProfile.first_name || "") ||
      lastName !== (userProfile.last_name || "") ||
      phone !== (userProfile.phone || "") ||
      (isAdmin && userType !== userProfile.user_type)
    );
  };

  const renderProfileSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

      {/* 🔧 Bouton pour réinitialiser les valeurs */}
      {hasProfileChanges() && (
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetToOriginalValues}
        >
          <Text style={styles.resetButtonText}>
            {t('profile.resetValues')}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('profile.firstNameRequired')}</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('profile.firstNamePlaceholder')}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('profile.lastNameRequired')}</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('profile.lastNamePlaceholder')}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('profile.phone')}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('profile.phonePlaceholder')}
          keyboardType="phone-pad"
        />
        <Text style={styles.hint}>
          {t('profile.phoneHint')}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('profile.currentEmail')}</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={userProfile.email}
          editable={false}
        />
        <Text style={styles.hint}>
          {t('profile.emailChangeHint')}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.accountType')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={userType}
              onValueChange={setUserType}
              style={styles.picker}
            >
              <Picker.Item label={t('auth.userTypes.family')} value="family" />
              <Picker.Item label={t('auth.userTypes.senior')} value="senior" />
              <Picker.Item label={t('auth.userTypes.saad_admin')} value="saad_admin" />
              <Picker.Item label={t('auth.userTypes.saad_worker')} value="saad_worker" />
              <Picker.Item label={t('auth.userTypes.admin')} value="admin" />
              <Picker.Item label={t('auth.userTypes.insurer')} value="insurer" />
            </Picker>
          </View>
          <Text style={styles.hint}>
            {t('profile.accountTypeWarning')}
          </Text>
        </View>
      )}

      {/* 🔧 Informations de statut */}
      <View style={styles.statusInfo}>
        <Text style={styles.statusTitle}>{t('profile.accountInfo')}</Text>
        <Text style={styles.statusItem}>
          {t('profile.accountId')}{" "}
          <Text style={styles.statusValue}>
            {userProfile.id.slice(0, 8)}...
          </Text>
        </Text>
        <Text style={styles.statusItem}>
          {t('profile.createdOn')}{" "}
          <Text style={styles.statusValue}>
            {new Date(userProfile.created_at || '').toLocaleDateString("fr-FR")}
          </Text>
        </Text>
        <Text style={styles.statusItem}>
          {t('profile.modifiedOn')}{" "}
          <Text style={styles.statusValue}>
            {new Date(userProfile.updated_at || '').toLocaleDateString("fr-FR")}
          </Text>
        </Text>
        <Text style={styles.statusItem}>
          {t('profile.status')}{" "}
          <Text
            style={[
              styles.statusValue,
              userProfile.is_active
                ? styles.activeStatus
                : styles.inactiveStatus,
            ]}
          >
            {userProfile.is_active ? t('profile.active') : t('profile.inactive')}
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          !hasProfileChanges() && styles.disabledButton,
        ]}
        onPress={handleUpdateProfile}
        disabled={isLoading || !hasProfileChanges()}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>
            {hasProfileChanges()
              ? t('profile.saveChanges')
              : t('profile.noChanges')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.security')}</Text>

      {/* Changement de mot de passe */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>{t('profile.changePassword')}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.currentPassword')}</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.newPassword')}</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Text style={styles.hint}>{t('profile.passwordMinLength')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.confirmNewPassword')}</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          {newPassword &&
            confirmPassword &&
            newPassword !== confirmPassword && (
              <Text style={styles.errorHint}>
                {t('profile.passwordsDontMatch')}
              </Text>
            )}
          {newPassword &&
            confirmPassword &&
            newPassword === confirmPassword && (
              <Text style={styles.successHint}>
                {t('profile.passwordsMatch')}
              </Text>
            )}
        </View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>
            {t('profile.changePasswordButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Changement d'email */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>{t('profile.changeEmail')}</Text>
        <Text style={styles.hint}>
          {t('profile.currentEmailLabel')}{" "}
          <Text style={styles.currentEmail}>{userProfile.email}</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.newEmail')}</Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={t('profile.newEmailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.emailPassword')}</Text>
          <TextInput
            style={styles.input}
            value={emailPassword}
            onChangeText={setEmailPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleChangeEmail}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>{t('profile.changeEmailButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Reset password */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>{t('profile.forgotPassword')}</Text>
        <Text style={styles.hint}>
          {t('profile.forgotPasswordHint')}
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={handlePasswordReset}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{t('profile.sendResetEmail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreferencesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.preferences')}</Text>

      <View style={styles.preferenceItem}>
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{t('profile.emailNotifications')}</Text>
          <Text style={styles.preferenceDescription}>
            {t('profile.emailNotificationsDesc')}
          </Text>
        </View>
        <Switch
          value={emailNotifications}
          onValueChange={setEmailNotifications}
          trackColor={{ false: "#767577", true: "#4f46e5" }}
          thumbColor={emailNotifications ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>

      <View style={styles.preferenceItem}>
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{t('profile.smsNotifications')}</Text>
          <Text style={styles.preferenceDescription}>
            {t('profile.smsNotificationsDesc')}
            {!phone && t('profile.phoneRequired')}
          </Text>
        </View>
        <Switch
          value={smsNotifications && !!phone}
          onValueChange={setSmsNotifications}
          disabled={!phone}
          trackColor={{ false: "#767577", true: "#4f46e5" }}
          thumbColor={smsNotifications ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>

      {!phone && (
        <Text style={styles.warningText}>
          {t('profile.addPhoneWarning')}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleSavePreferences}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>{t('profile.savePreferences')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDangerSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.dangerZone')}</Text>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>{t('profile.deleteAccount')}</Text>
        <Text style={styles.dangerDescription}>
          {t('profile.deleteAccountDesc')}
        </Text>

        <View style={styles.dangerInfo}>
          <Text style={styles.dangerInfoTitle}>
            {t('profile.dataToDelete')}
          </Text>
          <Text style={styles.dangerInfoItem}>{t('profile.userProfile')}</Text>
          <Text style={styles.dangerInfoItem}>
            {t('profile.callHistory')}
          </Text>
          <Text style={styles.dangerInfoItem}>
            {t('profile.alertsReports')}
          </Text>
          <Text style={styles.dangerInfoItem}>{t('profile.allPreferences')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('profile.deletePasswordConfirm')}</Text>
          <TextInput
            style={styles.input}
            value={deletePassword}
            onChangeText={setDeletePassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.dangerButton,
            (!deletePassword || isLoading) && styles.disabledButton,
          ]}
          onPress={handleDeleteAccount}
          disabled={isLoading || !deletePassword}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {t('profile.deleteAccountButton')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection();
      case "security":
        return renderSecuritySection();
      case "preferences":
        return renderPreferencesSection();
      case "danger":
        return renderDangerSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.editProfileTitle')}</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        style={styles.tabsScrollContent}
        showsHorizontalScrollIndicator={false}
      >
        {renderTabButton("profile", t('profile.profileTab'), "👤")}
        {renderTabButton("security", t('profile.securityTab'), "🔒")}
        {renderTabButton("preferences", t('profile.preferencesTab'), "⚙️")}
        {renderTabButton("danger", t('profile.dangerTab'), "⚠️")}
      </ScrollView>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#64748b",
  },
  tabsScrollContent: {
    paddingHorizontal: 4,
    maxHeight: 56,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  activeTabText: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 20,
  },
  subsection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
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
  disabledInput: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  hint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
  errorHint: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
    fontWeight: "500",
  },
  successHint: {
    fontSize: 12,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "500",
  },
  warningText: {
    fontSize: 14,
    color: "#f59e0b",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  currentEmail: {
    fontWeight: "600",
    color: "#4f46e5",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    height: 50,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  warningButton: {
    backgroundColor: "#f59e0b",
  },
  dangerButton: {
    backgroundColor: "#ef4444",
  },
  resetButton: {
    backgroundColor: "#64748b",
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
    opacity: 0.6,
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
  resetButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  preferenceText: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: "#64748b",
  },
  statusInfo: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  statusItem: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
  },
  statusValue: {
    fontWeight: "600",
    color: "#1e293b",
  },
  activeStatus: {
    color: "#10b981",
  },
  inactiveStatus: {
    color: "#ef4444",
  },
  dangerZone: {
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: "#7f1d1d",
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerInfo: {
    backgroundColor: "#fef7f7",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  dangerInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#b91c1c",
    marginBottom: 8,
  },
  dangerInfoItem: {
    fontSize: 13,
    color: "#991b1b",
    marginBottom: 4,
  },
});
