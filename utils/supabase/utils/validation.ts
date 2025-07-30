// =====================================================
// FONCTIONS DE VALIDATION
// =====================================================

// ✅ Fonction pour valider un numéro de téléphone français
export function validateFrenchPhone(phone: string): {
  isValid: boolean;
  cleaned: string;
  error?: string;
} {
  try {
    // Nettoyer le numéro
    const cleaned = phone.replace(/[\s\.\-\(\)]/g, "");

    // Vérifier le format français
    const phoneRegex = /^(\+33|0033|0)[1-9][0-9]{8}$/;

    if (!phoneRegex.test(cleaned)) {
      return {
        isValid: false,
        cleaned: "",
        error:
          "Le numéro doit être un téléphone français valide (ex: 06 12 34 56 78)",
      };
    }

    // Normaliser au format français standard
    let normalized = cleaned;
    if (normalized.startsWith("+33")) {
      normalized = "0" + normalized.substring(3);
    } else if (normalized.startsWith("0033")) {
      normalized = "0" + normalized.substring(4);
    }

    return {
      isValid: true,
      cleaned: normalized,
    };
  } catch (error) {
    return {
      isValid: false,
      cleaned: "",
      error: "Format de téléphone invalide",
    };
  }
}