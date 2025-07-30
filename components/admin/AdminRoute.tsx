import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useMyCompanionAuth } from '@/utils/supabase/auth/auth-hooks';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading, userProfile } = useMyCompanionAuth();
  
  // En cours de chargement
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.contentContainer}>
          <LoadingSpinner />
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  // Vérifier les permissions admin
  if (!isAdmin || !userProfile?.is_active) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.contentContainer}>
          <View style={styles.deniedContainer}>
            <IconSymbol
              name="exclamationmark.shield.fill"
              size={80}
              color="#FF3B30"
              style={styles.icon}
            />
            
            <ThemedText type="title" style={styles.title}>
              Accès Refusé
            </ThemedText>
            
            <ThemedText style={styles.message}>
              Cette section est réservée aux administrateurs.
              {!userProfile?.is_active && userProfile?.user_type === 'admin' && (
                '\n\nVotre compte administrateur est actuellement désactivé.'
              )}
            </ThemedText>
            
            <Button
              title="Retourner à l'accueil"
              onPress={() => router.replace('/(tabs)')}
              style={styles.button}
            />
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  // Afficher un badge admin distinctif
  return (
    <>
      <View style={styles.adminBadge}>
        <IconSymbol name="crown.fill" size={16} color="#FFD700" />
        <ThemedText style={styles.adminText}>Mode Admin</ThemedText>
      </View>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deniedContainer: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  button: {
    minWidth: 200,
  },
  adminBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 1000,
  },
  adminText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
});