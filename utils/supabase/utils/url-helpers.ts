import { Platform } from "react-native";

// =====================================================
// FONCTIONS UTILITAIRES D'URL
// =====================================================

// Fonction utilitaire pour générer les URLs de redirection
export function getRedirectUrl(path: string = ""): string {
  if (Platform.OS === "web") {
    // Pour le web - utiliser l'URL du site ou localhost en dev
    const baseUrl =
      process.env.EXPO_PUBLIC_SITE_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:8081");
    return `${baseUrl}${path}`;
  } else {
    // Pour mobile - utiliser le schème de l'app
    const appScheme = process.env.EXPO_PUBLIC_APP_SCHEME || "mycompanion";
    return `${appScheme}://${path.replace(/^\//, "")}`;
  }
}