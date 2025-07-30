import { Database } from "@/utils/database.types";
import { Session } from "@supabase/supabase-js";

// =====================================================
// TYPES D'AUTHENTIFICATION
// =====================================================

export type UserType = Database["public"]["Tables"]["users"]["Row"]["user_type"];
export type MyCompanionUser = Database["public"]["Tables"]["users"]["Row"];
export type Senior = Database["public"]["Tables"]["seniors"]["Row"];
export type Call = Database["public"]["Tables"]["calls"]["Row"];
export type Alert = Database["public"]["Tables"]["alerts"]["Row"];

// =====================================================
// TYPES DE DONNÉES MÉTIER
// =====================================================

export interface FamilyInviteData {
  seniorId: string;
  email: string;
  relationship: string;
  accessLevel: "minimal" | "standard" | "full";
  notificationPreferences: {
    dailyReports: boolean;
    emergencyAlerts: boolean;
    weeklyReports: boolean;
    smsAlerts: boolean;
  };
}

export interface SeniorData {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string;
  preferred_call_time: string;
  call_frequency: number;
  personality_profile?: any;
  medical_context?: any;
  interests?: any;
  communication_preferences?: any;
  emergency_contact?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
  };
  created_at: string;
  updated_at: string;
  deleted?: boolean;
}

export interface SeniorCreateData {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string | null;
  preferred_call_time?: string;
  call_frequency?: number;
  emergency_contact?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
  };
  personality_profile?: any;
  medical_context?: any;
  interests?: any;
  communication_preferences?: any;
}

export interface FamilyRelationData {
  user_id: string;
  senior_id: string;
  relationship: string;
  is_primary_contact?: boolean;
  notification_preferences?: {
    dailyReports?: boolean;
    emergencyAlerts?: boolean;
    weeklyReports?: boolean;
    smsAlerts?: boolean;
  };
  access_level?: "minimal" | "standard" | "full";
}

export interface FamilyMemberWithUser {
  id: string;
  user_id: string;
  senior_id: string;
  relationship: string;
  is_primary_contact: boolean;
  access_level: "minimal" | "standard" | "full";
  notification_preferences: any;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface InviteFamilyMemberData {
  seniorId: string;
  email: string;
  relationship: string;
  accessLevel: "minimal" | "standard" | "full";
  notificationPreferences: {
    dailyReports: boolean;
    emergencyAlerts: boolean;
    weeklyReports: boolean;
    smsAlerts: boolean;
  };
}

// =====================================================
// TYPES D'ÉTAT D'AUTHENTIFICATION
// =====================================================

export interface AuthState {
  session: Session | null;
  user: MyCompanionUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isUpdatingProfile: boolean;
  // Protection anti-doublon
  isLoadingProfile: boolean;
  profileLoadPromise: Promise<void> | null;
  hasInitialized: boolean;
}

// =====================================================
// TYPES DE PARAMÈTRES DE FONCTIONS
// =====================================================

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  user_type?: UserType;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface EmailChangeData {
  newEmail: string;
  password: string;
}

export interface SignUpUserData {
  user_type: UserType;
  first_name: string;
  last_name: string;
  phone?: string;
}