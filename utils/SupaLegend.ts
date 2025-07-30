// =====================================================
// FICHIER D'INDEX - RÉEXPORTE TOUT DEPUIS LES MODULES
// =====================================================

// Client et configuration
export { supabase, customSynced, generateId } from "./supabase/client";

// Types
export * from "./supabase/types";

// État d'authentification
export { authState$, loadUserProfileSafe, initializeAuth } from "./supabase/auth/auth-state";

// Fonctions d'authentification
export * from "./supabase/auth/auth-functions";

// Hook d'authentification
export { useMyCompanionAuth } from "./supabase/auth/auth-hooks";

// Observables
export * from "./supabase/observables";

// Services
export * from "./supabase/services/user-service";
export * from "./supabase/services/senior-service";
export * from "./supabase/services/invitation-service";
export * from "./supabase/services/call-service";
export * from "./supabase/services/alert-service";

// Utilitaires
export { getRedirectUrl } from "./supabase/utils/url-helpers";
export { validateFrenchPhone } from "./supabase/utils/validation";