
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "profiles": {
                  Row: {
                    "accepting_bookings": boolean,"bio": string | null,"country": string | null,"created_at": string,"currency": string,"female_teachers_only": boolean,"full_name": string,"gender": Database["public"]['Enums']["gender"] | null,"goal": Database["public"]['Enums']["learning_goal"] | null,"granting_sheikh": string | null,"headline": string | null,"id": string,"ijazahs_granted": number,"locale": string,"onboarded": boolean,"preferred_riwayat": (string)[],"price_30": number | null,"price_60": number | null,"rating_avg": number,"rating_count": number,"reminders_enabled": boolean,"role": Database["public"]['Enums']["user_role"],"sanad_text": string | null,"teacher_status": Database["public"]['Enums']["teacher_status"],"teaches": Database["public"]['Enums']["teaches_gender"],"timezone": string,"updated_at": string,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepting_bookings"?: boolean,"bio"?: string | null,"country"?: string | null,"created_at"?: string,"currency"?: string,"female_teachers_only"?: boolean,"full_name"?: string,"gender"?: Database["public"]['Enums']["gender"] | null,"goal"?: Database["public"]['Enums']["learning_goal"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id": string,"ijazahs_granted"?: number,"locale"?: string,"onboarded"?: boolean,"preferred_riwayat"?: (string)[],"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number,"rating_count"?: number,"reminders_enabled"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"sanad_text"?: string | null,"teacher_status"?: Database["public"]['Enums']["teacher_status"],"teaches"?: Database["public"]['Enums']["teaches_gender"],"timezone"?: string,"updated_at"?: string,"years_experience"?: number | null
                  }
                  Update: {
                    "accepting_bookings"?: boolean,"bio"?: string | null,"country"?: string | null,"created_at"?: string,"currency"?: string,"female_teachers_only"?: boolean,"full_name"?: string,"gender"?: Database["public"]['Enums']["gender"] | null,"goal"?: Database["public"]['Enums']["learning_goal"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string,"ijazahs_granted"?: number,"locale"?: string,"onboarded"?: boolean,"preferred_riwayat"?: (string)[],"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number,"rating_count"?: number,"reminders_enabled"?: boolean,"role"?: Database["public"]['Enums']["user_role"],"sanad_text"?: string | null,"teacher_status"?: Database["public"]['Enums']["teacher_status"],"teaches"?: Database["public"]['Enums']["teaches_gender"],"timezone"?: string,"updated_at"?: string,"years_experience"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"riwayat": {
                  Row: {
                    "code": string,"name_ar": string,"name_en": string,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"name_ar": string,"name_en": string,"sort"?: number
                  }
                  Update: {
                    "code"?: string,"name_ar"?: string,"name_en"?: string,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_teachers": {
                  Row: {
                    "accepting_bookings": boolean | null,"bio": string | null,"country": string | null,"created_at": string | null,"currency": string | null,"full_name": string | null,"gender": Database["public"]['Enums']["gender"] | null,"granting_sheikh": string | null,"headline": string | null,"id": string | null,"ijazahs_granted": number | null,"price_30": number | null,"price_60": number | null,"rating_avg": number | null,"rating_count": number | null,"sanad_text": string | null,"teaches": Database["public"]['Enums']["teaches_gender"] | null,"timezone": string | null,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "accepting_bookings"?: boolean | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string | null,"currency"?: string | null,"full_name"?: string | null,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string | null,"ijazahs_granted"?: number | null,"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"sanad_text"?: string | null,"teaches"?: Database["public"]['Enums']["teaches_gender"] | null,"timezone"?: string | null,"years_experience"?: number | null
                         }
                        Update: {
                           "accepting_bookings"?: boolean | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string | null,"currency"?: string | null,"full_name"?: string | null,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string | null,"ijazahs_granted"?: number | null,"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"sanad_text"?: string | null,"teaches"?: Database["public"]['Enums']["teaches_gender"] | null,"timezone"?: string | null,"years_experience"?: number | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           }
          }
          Enums: {
            "gender": "male"|"female","learning_goal": "ijazah"|"memorization"|"tajweed","teacher_status": "none"|"pending"|"approved"|"rejected","teaches_gender": "male"|"female"|"both","user_role": "student"|"teacher"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "gender": ["male", "female"],"learning_goal": ["ijazah", "memorization", "tajweed"],"teacher_status": ["none", "pending", "approved", "rejected"],"teaches_gender": ["male", "female", "both"],"user_role": ["student", "teacher", "admin"]
          }
        }
} as const
