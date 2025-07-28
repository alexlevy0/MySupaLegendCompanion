import { useMyCompanionAuth } from "@/utils/SupaLegend";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, loading, userProfile, error, reloadProfile } =
    useMyCompanionAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [forceLoading, setForceLoading] = useState(true);

  // Timer de sécurité pour éviter l'infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("Force stopping loading after 15 seconds");
        setForceLoading(false);
      }
    }, 15000);

    if (!loading) {
      setForceLoading(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  // Si on a une erreur et qu'on n'est plus en loading, afficher l'erreur
  if (error && !loading && !forceLoading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>Erreur d'authentification</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setForceLoading(true);
              reloadProfile?.();
            }}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              setForceLoading(false);
              setAuthMode("signin");
            }}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Afficher un loader pendant le chargement de l'état d'authentification
  if ((loading || forceLoading) && !error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Chargement...</Text>
          {/* Bouton de debug en développement */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                console.log("Auth Debug Info:", {
                  loading,
                  forceLoading,
                  isAuthenticated,
                  userProfile: userProfile?.email,
                  error,
                });
                setForceLoading(false);
              }}
            >
              <Text style={styles.debugButtonText}>Debug (DEV)</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher l'écran d'auth
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authContainer}>
        {authMode === "signin" ? (
          <LoginForm onToggleMode={() => setAuthMode("signup")} />
        ) : (
          <SignUpForm onToggleMode={() => setAuthMode("signin")} />
        )}
      </SafeAreaView>
    );
  }

  // Debug info en développement
  if (__DEV__) {
    console.log("AuthWrapper: User authenticated", {
      email: userProfile?.email,
      type: userProfile?.user_type,
      isAuthenticated,
    });
  }

  // Si l'utilisateur est authentifié, afficher l'app principale
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
  authContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#dc2626",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#64748b",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  debugButton: {
    marginTop: 20,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  debugButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
