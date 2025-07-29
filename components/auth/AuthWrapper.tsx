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
  const {
    isAuthenticated,
    loading,
    userProfile,
    error,
    reloadProfile,
    isUpdatingProfile,
  } = useMyCompanionAuth();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showDebug, setShowDebug] = useState(false);

  // ✅ Timeout de sécurité plus intelligent
  const [forceShowApp, setForceShowApp] = useState(false);
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Si loading depuis plus de 15 secondes ET qu'on a un profil utilisateur
    if (loading && userProfile) {
      timer = setTimeout(() => {
        console.warn(
          "⚠️ Loading timeout with valid user profile - forcing app display"
        );
        setForceShowApp(true);
      }, 15000);
    }

    // Reset si plus en loading
    if (!loading) {
      setForceShowApp(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, userProfile]);

  // ✅ Conditions d'affichage plus claires
  const shouldShowLoading = loading && !isUpdatingProfile && !forceShowApp;
  const shouldShowApp = (isAuthenticated || forceShowApp) && !shouldShowLoading;
  const shouldShowAuth = !shouldShowApp && !shouldShowLoading && !error;

  // Debug info
  if (__DEV__) {
    console.log("AuthWrapper:", {
      isAuthenticated,
      loading,
      isUpdatingProfile,
      forceShowApp,
      shouldShowLoading,
      shouldShowApp,
      shouldShowAuth,
      userEmail: userProfile?.email,
    });
  }

  // 🔧 ERREUR avec retry intelligent
  if (error && !loading && !forceShowApp && !isUpdatingProfile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <Text style={styles.errorTitle}>⚠️ Erreur d'authentification</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={reloadProfile}>
            <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => setAuthMode("signin")}
          >
            <Text style={styles.loginButtonText}>🔑 Aller à la connexion</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={() => setShowDebug(!showDebug)}
              >
                <Text style={styles.debugButtonText}>
                  {showDebug ? "Masquer" : "Voir"} Debug
                </Text>
              </TouchableOpacity>

              {showDebug && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>Error: {error}</Text>
                  <Text style={styles.debugText}>
                    Loading: {loading.toString()}
                  </Text>
                  <Text style={styles.debugText}>
                    User ID: {userProfile?.id || "null"}
                  </Text>
                  <Text style={styles.debugText}>
                    Email: {userProfile?.email || "null"}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={() => setForceShowApp(true)}
              >
                <Text style={styles.emergencyButtonText}>
                  🚨 Forcer l'accès
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // 🔄 LOADING avec informations détaillées
  if (shouldShowLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>
            {isUpdatingProfile
              ? "💾 Sauvegarde du profil..."
              : userProfile
              ? "⚡ Finalisation..."
              : "🔄 Chargement..."}
          </Text>

          {userProfile && (
            <Text style={styles.statusText}>
              Connecté en tant que {userProfile.first_name}
            </Text>
          )}

          {__DEV__ && (
            <Text style={styles.statusText}>
              Debug: Loading={loading.toString()}, Auth=
              {isAuthenticated.toString()}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // 🔑 AUTHENTIFICATION
  if (shouldShowAuth) {
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

  // ✅ APPLICATION
  if (shouldShowApp) {
    return <>{children}</>;
  }

  // Fallback (ne devrait jamais arriver)
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <Text style={styles.errorTitle}>État inconnu</Text>
        <TouchableOpacity style={styles.retryButton} onPress={reloadProfile}>
          <Text style={styles.retryButtonText}>Recharger</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
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
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
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
    textAlign: "center",
  },
  debugInfo: {
    marginTop: 12,
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 6,
    maxWidth: "100%",
  },
  debugText: {
    color: "#f3f4f6",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  emergencyButton: {
    marginTop: 12,
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  emergencyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
