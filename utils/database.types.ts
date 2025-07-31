export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          query?: string
          operationName?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_models: {
        Row: {
          configuration: Json | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          deployed_at: string | null
          id: string
          is_active: boolean | null
          model_name: string
          model_type: string
          model_version: string
          performance_metrics: Json | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name: string
          model_type: string
          model_version: string
          performance_metrics?: Json | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          deployed_at?: string | null
          id?: string
          is_active?: boolean | null
          model_name?: string
          model_type?: string
          model_version?: string
          performance_metrics?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          call_id: string | null
          confidence_score: number | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          description: string
          detected_indicators: Json | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          senior_id: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          call_id?: string | null
          confidence_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          description: string
          detected_indicators?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          senior_id?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          call_id?: string | null
          confidence_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          description?: string
          detected_indicators?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          senior_id?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          counter: number
          created_at: string | null
          deleted: boolean | null
          entity_id: string | null
          entity_type: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          entity_id?: string | null
          entity_type: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          entity_id?: string | null
          entity_type?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      calls: {
        Row: {
          call_type: string | null
          conversation_summary: string | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          mood_detected: string | null
          quality_score: number | null
          senior_id: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          call_type?: string | null
          conversation_summary?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          mood_detected?: string | null
          quality_score?: number | null
          senior_id?: string | null
          started_at?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          call_type?: string | null
          conversation_summary?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          mood_detected?: string | null
          quality_score?: number | null
          senior_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_transcripts: {
        Row: {
          audio_analysis: Json | null
          call_id: string | null
          confidence_score: number | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          id: string
          language: string | null
          transcript_text: string
          updated_at: string | null
        }
        Insert: {
          audio_analysis?: Json | null
          call_id?: string | null
          confidence_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          language?: string | null
          transcript_text: string
          updated_at?: string | null
        }
        Update: {
          audio_analysis?: Json | null
          call_id?: string | null
          confidence_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          language?: string | null
          transcript_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          access_level: string | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          email: string
          expires_at: string
          id: string
          invitation_metadata: Json | null
          inviter_id: string
          notification_preferences: Json | null
          relationship: string
          senior_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          email: string
          expires_at: string
          id?: string
          invitation_metadata?: Json | null
          inviter_id: string
          notification_preferences?: Json | null
          relationship: string
          senior_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          access_level?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          email?: string
          expires_at?: string
          id?: string
          invitation_metadata?: Json | null
          inviter_id?: string
          notification_preferences?: Json | null
          relationship?: string
          senior_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invitations_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invite_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          senior_id: string
          updated_at: string | null
          usage_history: Json | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          senior_id: string
          updated_at?: string | null
          usage_history?: Json | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          senior_id?: string
          updated_at?: string | null
          usage_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invite_codes_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          access_level: string | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          id: string
          is_primary_contact: boolean | null
          notification_preferences: Json | null
          relationship: string
          senior_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_level?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          is_primary_contact?: boolean | null
          notification_preferences?: Json | null
          relationship: string
          senior_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          is_primary_contact?: boolean | null
          notification_preferences?: Json | null
          relationship?: string
          senior_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      family_reports: {
        Row: {
          content: Json
          counter: number
          created_at: string | null
          deleted: boolean | null
          delivery_method: string | null
          family_member_id: string | null
          id: string
          opened_at: string | null
          report_period_end: string | null
          report_period_start: string | null
          report_type: string | null
          senior_id: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content: Json
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          delivery_method?: string | null
          family_member_id?: string | null
          id?: string
          opened_at?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          report_type?: string | null
          senior_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          delivery_method?: string | null
          family_member_id?: string | null
          id?: string
          opened_at?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          report_type?: string | null
          senior_id?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_reports_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_reports_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      saad_assignments: {
        Row: {
          assigned_worker_id: string | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          end_date: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          saad_id: string | null
          senior_id: string | null
          service_level: string | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          assigned_worker_id?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          saad_id?: string | null
          senior_id?: string | null
          service_level?: string | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          assigned_worker_id?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          saad_id?: string | null
          senior_id?: string | null
          service_level?: string | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saad_assignments_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saad_assignments_saad_id_fkey"
            columns: ["saad_id"]
            isOneToOne: false
            referencedRelation: "saad_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saad_assignments_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
      saad_organizations: {
        Row: {
          address: Json | null
          contact_email: string
          contact_phone: string | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          id: string
          is_active: boolean | null
          name: string
          subscription_plan: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          contact_email: string
          contact_phone?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          contact_email?: string
          contact_phone?: string | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          subscription_plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      seniors: {
        Row: {
          address: Json | null
          birth_date: string | null
          call_frequency: number | null
          communication_preferences: Json | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          emergency_contact: string | null
          first_name: string
          id: string
          interests: Json | null
          last_name: string
          medical_context: Json | null
          personality_profile: Json | null
          phone: string | null
          preferred_call_time: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          call_frequency?: number | null
          communication_preferences?: Json | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          emergency_contact?: string | null
          first_name: string
          id?: string
          interests?: Json | null
          last_name: string
          medical_context?: Json | null
          personality_profile?: Json | null
          phone?: string | null
          preferred_call_time?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          call_frequency?: number | null
          communication_preferences?: Json | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          emergency_contact?: string | null
          first_name?: string
          id?: string
          interests?: Json | null
          last_name?: string
          medical_context?: Json | null
          personality_profile?: Json | null
          phone?: string | null
          preferred_call_time?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seniors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          counter: number
          created_at: string | null
          deleted: boolean | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          counter: number
          created_at: string | null
          deleted: boolean | null
          done: boolean | null
          id: string
          text: string | null
          updated_at: string | null
        }
        Insert: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          done?: boolean | null
          id?: string
          text?: string | null
          updated_at?: string | null
        }
        Update: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          done?: boolean | null
          id?: string
          text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          counter: number
          created_at: string | null
          deleted: boolean | null
          email: string
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          email: string
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          updated_at?: string | null
          user_type: string
        }
        Update: {
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      well_being_metrics: {
        Row: {
          calculated_at: string | null
          call_id: string | null
          cognitive_score: number | null
          counter: number
          created_at: string | null
          deleted: boolean | null
          engagement_score: number | null
          health_score: number | null
          id: string
          metric_date: string
          mood_score: number | null
          overall_score: number | null
          senior_id: string | null
          social_score: number | null
          updated_at: string | null
        }
        Insert: {
          calculated_at?: string | null
          call_id?: string | null
          cognitive_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          engagement_score?: number | null
          health_score?: number | null
          id?: string
          metric_date: string
          mood_score?: number | null
          overall_score?: number | null
          senior_id?: string | null
          social_score?: number | null
          updated_at?: string | null
        }
        Update: {
          calculated_at?: string | null
          call_id?: string | null
          cognitive_score?: number | null
          counter?: number
          created_at?: string | null
          deleted?: boolean | null
          engagement_score?: number | null
          health_score?: number | null
          id?: string
          metric_date?: string
          mood_score?: number | null
          overall_score?: number | null
          senior_id?: string | null
          social_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "well_being_metrics_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "well_being_metrics_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_family_codes: {
        Row: {
          code: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          current_uses: number | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          max_uses: number | null
          remaining_uses: number | null
          senior_id: string | null
          senior_name: string | null
          status: string | null
          updated_at: string | null
          usage_history: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invite_codes_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "seniors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_user_accounts_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_count: number
          profile_count: number
          missing_profiles: number
          orphaned_profiles: number
        }[]
      }
      cleanup_expired_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_profile_rpc: {
        Args: {
          user_email?: string
          user_type?: string
          first_name?: string
          last_name?: string
        }
        Returns: Json
      }
      generate_unique_family_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      record_code_usage: {
        Args: { p_code_id: string; p_user_id: string; p_relationship: string }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          new_first_name?: string
          new_last_name?: string
          new_phone?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

