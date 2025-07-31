import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  initializeI18n, 
  changeLanguage as changeI18nLanguage, 
  getCurrentLanguage, 
  getCurrentLanguageInfo,
  SupportedLanguageCode,
  SUPPORTED_LANGUAGES
} from '@/utils/i18n';

interface I18nContextType {
  currentLanguage: SupportedLanguageCode;
  currentLanguageInfo: typeof SUPPORTED_LANGUAGES[0];
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  changeLanguage: (code: SupportedLanguageCode) => Promise<boolean>;
  isChangingLanguage: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguageCode>(getCurrentLanguage());
  const [currentLanguageInfo, setCurrentLanguageInfo] = useState(getCurrentLanguageInfo());
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser i18n au montage du provider
  useEffect(() => {
    const init = async () => {
      await initializeI18n();
      setCurrentLanguage(getCurrentLanguage());
      setCurrentLanguageInfo(getCurrentLanguageInfo());
      setIsInitialized(true);
    };
    init();
  }, []);

  const changeLanguage = async (code: SupportedLanguageCode): Promise<boolean> => {
    if (isChangingLanguage || code === currentLanguage) {
      return false;
    }

    setIsChangingLanguage(true);
    
    try {
      const success = await changeI18nLanguage(code);
      
      if (success) {
        setCurrentLanguage(code);
        setCurrentLanguageInfo(getCurrentLanguageInfo());
      }
      
      return success;
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const value: I18nContextType = {
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isChangingLanguage,
  };

  // Ne pas rendre les enfants tant que i18n n'est pas initialisé
  if (!isInitialized) {
    return null;
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook pour utiliser le contexte i18n
export const useI18n = () => {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n doit être utilisé à l\'intérieur d\'un I18nProvider');
  }
  
  return context;
};

// Hook pour obtenir uniquement la langue actuelle
export const useCurrentLanguage = () => {
  const { currentLanguage } = useI18n();
  return currentLanguage;
};

// Hook pour obtenir les infos de la langue actuelle
export const useCurrentLanguageInfo = () => {
  const { currentLanguageInfo } = useI18n();
  return currentLanguageInfo;
};