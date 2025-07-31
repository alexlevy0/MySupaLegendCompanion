import { useTranslation } from '@/hooks/useTranslation';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LanguageSelector() {
  const { t, changeLanguage, isFrench, isEnglish } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('languageSelector.title')}</Text>
      <View style={styles.languageButtons}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            isFrench && styles.languageButtonActive
          ]}
          onPress={() => changeLanguage('fr')}
        >
          <Text style={[
            styles.languageButtonText,
            isFrench && styles.languageButtonTextActive
          ]}>
            {t('languageSelector.french')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.languageButton,
            isEnglish && styles.languageButtonActive
          ]}
          onPress={() => changeLanguage('en')}
        >
          <Text style={[
            styles.languageButtonText,
            isEnglish && styles.languageButtonTextActive
          ]}>
            {t('languageSelector.english')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginHorizontal: 8,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#4f46e5',
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  languageButtonTextActive: {
    color: 'white',
  },
}); 