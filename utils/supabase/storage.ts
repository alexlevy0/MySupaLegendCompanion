import { Platform } from "react-native";
import { Storage } from "@/utils/storage";

// Export de la configuration storage pour Supabase
export const supabaseStorage = Platform.OS !== "web" ? Storage : undefined;