import { useEffect, useState } from 'react';
import { t, getCurrentLanguage, TranslationKeys, i18n } from '@/utils/i18n';

/**
 * Hook personnalisé pour gérer les traductions
 * Fournit la fonction de traduction et se met à jour automatiquement
 * quand la langue change
 */
export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    // Fonction pour mettre à jour la langue actuelle
    const updateLanguage = () => {
      setCurrentLanguage(getCurrentLanguage());
    };

    // Écouter les changements de locale
    // Note: i18n-js ne fournit pas d'événements natifs, donc on utilise un intervalle
    const intervalId = setInterval(() => {
      const newLanguage = getCurrentLanguage();
      if (newLanguage !== currentLanguage) {
        updateLanguage();
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [currentLanguage]);

  // Fonction de traduction typée
  const translate = (key: TranslationKeys, options?: Record<string, any>) => {
    return t(key, options);
  };

  return {
    t: translate,
    currentLanguage,
    i18n,
  };
};

// Hook pour obtenir une traduction spécifique avec re-render automatique
export const useTranslationKey = (key: TranslationKeys, options?: Record<string, any>) => {
  const { t } = useTranslation();
  return t(key, options);
};