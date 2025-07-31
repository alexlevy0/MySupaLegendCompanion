import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = (language: 'fr' | 'en') => {
    i18n.changeLanguage(language);
  };

  const currentLanguage = i18n.language;

  return {
    t,
    changeLanguage,
    currentLanguage,
    isFrench: currentLanguage === 'fr',
    isEnglish: currentLanguage === 'en',
  };
}; 