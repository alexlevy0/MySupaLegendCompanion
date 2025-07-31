import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Basic translation resources – expand as needed
export const resources = {
  en: {
    translation: {
      tab_profile: 'Profile',
      tab_seniors: 'Seniors',
      tab_dashboard: 'Dashboard',
      tab_alerts: 'Alerts',
      tab_admin: 'Admin',
      error: 'Error',
      success: 'Success',
    },
  },
  fr: {
    translation: {
      tab_profile: 'Profil',
      tab_seniors: 'Seniors',
      tab_dashboard: 'Tableau de bord',
      tab_alerts: 'Alertes',
      tab_admin: 'Admin',
      error: 'Erreur',
      success: 'Succès',
    },
  },
} as const;

// Detect the device language (e.g. "fr" or "en")
const locale = Localization.locale.split('-')[0];

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: locale,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already does escaping
      },
    })
    .catch((err) => console.error('i18n init error', err));
}

export default i18n;