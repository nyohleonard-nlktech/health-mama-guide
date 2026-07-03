export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clinics: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          hours: string | null
          id: string
          lat: number
          lng: number
          name: string
          phone: string | null
          region: string | null
          source: string | null
          type: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          phone?: string | null
          region?: string | null
          source?: string | null
          type?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          hours?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          phone?: string | null
          region?: string | null
          source?: string | null
          type?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      cycle_logs: {
        Row: {
          created_at: string
          cycle_length_days: number | null
          cycle_start_date: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_length_days?: number | null
          cycle_start_date: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_length_days?: number | null
          cycle_start_date?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      danger_sign_logs: {
        Row: {
          acknowledged_at: string | null
          checked_at: string
          created_at: string
          id: string
          pregnancy_id: string | null
          signs: Json
          synced_from_offline: boolean
          triggered_critical: boolean
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          checked_at?: string
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          signs: Json
          synced_from_offline?: boolean
          triggered_critical?: boolean
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          checked_at?: string
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          signs?: Json
          synced_from_offline?: boolean
          triggered_critical?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "danger_sign_logs_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancies"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancies: {
        Row: {
          active: boolean
          created_at: string
          edd_date: string | null
          id: string
          lmp_date: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          edd_date?: string | null
          id?: string
          lmp_date: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          edd_date?: string | null
          id?: string
          lmp_date?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_adolescent_module: boolean
          preferred_language: Database["public"]["Enums"]["app_language"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_adolescent_module?: boolean
          preferred_language?: Database["public"]["Enums"]["app_language"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_adolescent_module?: boolean
          preferred_language?: Database["public"]["Enums"]["app_language"]
          updated_at?: string
        }
        Relationships: []
      }
      vitals_readings: {
        Row: {
          created_at: string
          id: string
          pregnancy_id: string | null
          reading_type: string
          recorded_at: string
          source: Database["public"]["Enums"]["vitals_source_enum"]
          unit: string | null
          user_id: string
          value: number
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          reading_type: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["vitals_source_enum"]
          unit?: string | null
          user_id: string
          value: number
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          pregnancy_id?: string | null
          reading_type?: string
          recorded_at?: string
          source?: Database["public"]["Enums"]["vitals_source_enum"]
          unit?: string | null
          user_id?: string
          value?: number
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vitals_readings_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_triggered_critical: { Args: { signs: Json }; Returns: boolean }
      gestational_week: { Args: { lmp: string }; Returns: number }
      trimester_for: {
        Args: { lmp: string }
        Returns: Database["public"]["Enums"]["trimester_enum"]
      }
    }
    Enums: {
      app_language: "fr" | "en" | "pcm" | "ff"
      danger_sign_severity: "critical" | "urgent" | "monitor"
      trimester_enum: "first" | "second" | "third"
      vitals_source_enum: "esp32_bridge" | "manual" | "other"
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
  public: {
    Enums: {
      app_language: ["fr", "en", "pcm", "ff"],
      danger_sign_severity: ["critical", "urgent", "monitor"],
      trimester_enum: ["first", "second", "third"],
      vitals_source_enum: ["esp32_bridge", "manual", "other"],
    },
  },
} as const
