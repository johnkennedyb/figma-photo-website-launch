export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          message_type: string | null
          sender_id: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          sender_id?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          sender_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      counselor_profiles: {
        Row: {
          availability: Json | null
          bio: string | null
          created_at: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          rating: number | null
          specializations: string[] | null
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_verified?: boolean | null
          rating?: number | null
          specializations?: string[] | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          created_at?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number | null
          specializations?: string[] | null
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      counselor_requests: {
        Row: {
          client_id: string | null
          counselor_id: string | null
          created_at: string | null
          id: string
          message: string | null
          preferred_schedule: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          preferred_schedule?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          preferred_schedule?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      earnings: {
        Row: {
          amount: number
          counselor_id: string | null
          created_at: string | null
          id: string
          session_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          counselor_id?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "earnings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          client_id: string | null
          counselor_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          client_id: string | null
          counselor_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_at: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          counselor_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_at?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
