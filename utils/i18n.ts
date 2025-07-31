import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importer les fichiers de traduction
import fr from '../locales/fr.json';
import en from '../locales/en.json';

// Créer l'instance i18n
const i18n = new I18n({
  fr,
  en,
});

// Clé pour stocker la langue préférée
const LANGUAGE_KEY = '@MyCompanion:language';

// Langues supportées
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
] as const;

export type SupportedLanguageCode = 'fr' | 'en';

// Initialiser i18n
export const initializeI18n = async () => {
  try {
    // Essayer de récupérer la langue sauvegardée
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    
    if (savedLanguage && isValidLanguage(savedLanguage)) {
      i18n.locale = savedLanguage;
    } else {
      // Utiliser la langue du système par défaut
      const systemLocale = Localization.getLocales()[0]?.languageCode || 'fr';
      const supportedLocale = isValidLanguage(systemLocale) ? systemLocale : 'fr';
      i18n.locale = supportedLocale;
      await AsyncStorage.setItem(LANGUAGE_KEY, supportedLocale);
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation i18n:', error);
    i18n.locale = 'fr'; // Français par défaut en cas d'erreur
  }

  // Activer le fallback
  i18n.enableFallback = true;
  i18n.defaultLocale = 'fr';
};

// Vérifier si une langue est valide
const isValidLanguage = (code: string): code is SupportedLanguageCode => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

// Changer la langue
export const changeLanguage = async (languageCode: SupportedLanguageCode) => {
  try {
    i18n.locale = languageCode;
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    return true;
  } catch (error) {
    console.error('Erreur lors du changement de langue:', error);
    return false;
  }
};

// Obtenir la langue actuelle
export const getCurrentLanguage = (): SupportedLanguageCode => {
  const current = i18n.locale;
  return isValidLanguage(current) ? current : 'fr';
};

// Obtenir les informations de la langue actuelle
export const getCurrentLanguageInfo = () => {
  const currentCode = getCurrentLanguage();
  return SUPPORTED_LANGUAGES.find(lang => lang.code === currentCode) || SUPPORTED_LANGUAGES[0];
};

// Fonction de traduction avec support des paramètres
export const t = (key: string, options?: Record<string, any>) => {
  return i18n.t(key, options);
};

// Export de l'instance i18n pour un usage avancé
export { i18n };

// Types pour l'autocomplétion TypeScript
export type TranslationKeys = 
  | 'common.loading'
  | 'common.error'
  | 'common.cancel'
  | 'common.save'
  | 'common.delete'
  | 'common.edit'
  | 'common.close'
  | 'common.confirm'
  | 'common.yes'
  | 'common.no'
  | 'common.ok'
  | 'common.back'
  | 'common.next'
  | 'common.previous'
  | 'common.search'
  | 'common.filter'
  | 'common.refresh'
  | 'common.add'
  | 'common.create'
  | 'common.update'
  | 'common.select'
  | 'common.all'
  | 'common.none'
  | 'common.name'
  | 'common.email'
  | 'common.phone'
  | 'common.address'
  | 'common.date'
  | 'common.time'
  | 'common.description'
  | 'common.status'
  | 'common.actions'
  | 'common.settings'
  | 'common.language'
  | 'common.theme'
  | 'common.logout'
  | 'common.login'
  | 'common.register'
  | 'common.welcome'
  | 'common.goodbye'
  | 'tabs.profile'
  | 'tabs.seniors'
  | 'tabs.dashboard'
  | 'tabs.alerts'
  | 'tabs.admin'
  | 'profile.title'
  | 'profile.editProfile'
  | 'profile.loadingError'
  | 'profile.firstName'
  | 'profile.lastName'
  | 'profile.phoneNumber'
  | 'profile.birthDate'
  | 'profile.userType'
  | 'profile.familyCode'
  | 'profile.joinFamily'
  | 'profile.shareCode'
  | 'profile.updateSuccess'
  | 'profile.updateError'
  | 'dashboard.welcome'
  | 'dashboard.title'
  | 'dashboard.todaysCalls'
  | 'dashboard.weeklyStats'
  | 'dashboard.monthlyReport'
  | 'dashboard.recentAlerts'
  | 'dashboard.callHistory'
  | 'dashboard.noData'
  | 'dashboard.viewDetails'
  | 'seniors.title'
  | 'seniors.addSenior'
  | 'seniors.editSenior'
  | 'seniors.deleteSenior'
  | 'seniors.confirmDelete'
  | 'seniors.seniorDetails'
  | 'seniors.callHistory'
  | 'seniors.lastCall'
  | 'seniors.noCalls'
  | 'seniors.callNow'
  | 'seniors.sendMessage'
  | 'seniors.emergencyContact'
  | 'seniors.medicalInfo'
  | 'seniors.notes'
  | 'seniors.addNote'
  | 'seniors.relationshipType'
  | 'seniors.createdAt'
  | 'seniors.updatedAt'
  | 'alerts.title'
  | 'alerts.noAlerts'
  | 'alerts.acknowledgeAlert'
  | 'alerts.alertDetails'
  | 'alerts.alertType'
  | 'alerts.severity'
  | 'alerts.timestamp'
  | 'alerts.seniorName'
  | 'alerts.description'
  | 'alerts.accessDenied'
  | 'alerts.accessDeniedMessage'
  | 'alerts.types.missed_call'
  | 'alerts.types.no_activity'
  | 'alerts.types.emergency'
  | 'alerts.types.reminder'
  | 'alerts.types.medication'
  | 'alerts.types.appointment'
  | 'alerts.severities.low'
  | 'alerts.severities.medium'
  | 'alerts.severities.high'
  | 'alerts.severities.critical'
  | 'admin.title'
  | 'admin.dashboard'
  | 'admin.userManagement'
  | 'admin.seniorManagement'
  | 'admin.systemSettings'
  | 'admin.analytics'
  | 'admin.reports'
  | 'admin.logs'
  | 'admin.totalUsers'
  | 'admin.totalSeniors'
  | 'admin.totalFamilies'
  | 'admin.totalSAAD'
  | 'admin.activeAlerts'
  | 'admin.systemStatus'
  | 'admin.online'
  | 'admin.offline'
  | 'admin.maintenance'
  | 'auth.signIn'
  | 'auth.signUp'
  | 'auth.signOut'
  | 'auth.forgotPassword'
  | 'auth.resetPassword'
  | 'auth.changePassword'
  | 'auth.email'
  | 'auth.password'
  | 'auth.confirmPassword'
  | 'auth.rememberMe'
  | 'auth.createAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.dontHaveAccount'
  | 'auth.signInError'
  | 'auth.signUpError'
  | 'auth.invalidCredentials'
  | 'auth.emailAlreadyExists'
  | 'auth.weakPassword'
  | 'auth.passwordsDontMatch'
  | 'userTypes.senior'
  | 'userTypes.family'
  | 'userTypes.saad'
  | 'userTypes.admin'
  | 'relationships.spouse'
  | 'relationships.child'
  | 'relationships.grandchild'
  | 'relationships.sibling'
  | 'relationships.parent'
  | 'relationships.friend'
  | 'relationships.caregiver'
  | 'relationships.other'
  | 'errors.generic'
  | 'errors.network'
  | 'errors.server'
  | 'errors.notFound'
  | 'errors.unauthorized'
  | 'errors.forbidden'
  | 'errors.validation'
  | 'errors.required'
  | 'errors.invalidEmail'
  | 'errors.invalidPhone'
  | 'errors.minLength'
  | 'errors.maxLength'
  | 'success.saved'
  | 'success.updated'
  | 'success.deleted'
  | 'success.created'
  | 'success.sent'
  | 'confirmation.areYouSure'
  | 'confirmation.cannotUndo'
  | 'confirmation.deleteAccount'
  | 'confirmation.logOut'
  | 'time.today'
  | 'time.yesterday'
  | 'time.tomorrow'
  | 'time.thisWeek'
  | 'time.lastWeek'
  | 'time.thisMonth'
  | 'time.lastMonth'
  | 'time.days'
  | 'time.hours'
  | 'time.minutes'
  | 'time.seconds'
  | 'time.ago'
  | 'time.in'
  | 'time.never';