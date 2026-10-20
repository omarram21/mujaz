
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
            "availability_exceptions": {
                  Row: {
                    "created_at": string,"ends_at": string,"id": string,"reason": string | null,"starts_at": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ends_at": string,"id"?: string,"reason"?: string | null,"starts_at": string,"teacher_id": string
                  }
                  Update: {
                    "created_at"?: string,"ends_at"?: string,"id"?: string,"reason"?: string | null,"starts_at"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_exceptions_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "availability_exceptions_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"availability_rules": {
                  Row: {
                    "created_at": string,"end_time": string,"id": string,"start_time": string,"teacher_id": string,"timezone": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_time": string,"id"?: string,"start_time": string,"teacher_id": string,"timezone": string,"weekday": number
                  }
                  Update: {
                    "created_at"?: string,"end_time"?: string,"id"?: string,"start_time"?: string,"teacher_id"?: string,"timezone"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "availability_rules_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "availability_rules_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "cancel_reason": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"created_at": string,"currency": string,"daily_room_name": string | null,"duration_min": number,"ends_at": string,"id": string,"is_trial": boolean,"price": number,"program_id": string | null,"reminder_sent": boolean,"rescheduled_from": string | null,"starts_at": string,"status": Database["public"]['Enums']["booking_status"],"student_id": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"currency"?: string,"daily_room_name"?: string | null,"duration_min": number,"ends_at": string,"id"?: string,"is_trial"?: boolean,"price"?: number,"program_id"?: string | null,"reminder_sent"?: boolean,"rescheduled_from"?: string | null,"starts_at": string,"status"?: Database["public"]['Enums']["booking_status"],"student_id": string,"teacher_id": string
                  }
                  Update: {
                    "cancel_reason"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"currency"?: string,"daily_room_name"?: string | null,"duration_min"?: number,"ends_at"?: string,"id"?: string,"is_trial"?: boolean,"price"?: number,"program_id"?: string | null,"reminder_sent"?: boolean,"rescheduled_from"?: string | null,"starts_at"?: string,"status"?: Database["public"]['Enums']["booking_status"],"student_id"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "ijazah_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_rescheduled_from_fkey"
      columns: ["rescheduled_from"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"ijazah_programs": {
                  Row: {
                    "completed_at": string | null,"id": string,"riwayah": string,"started_at": string,"status": Database["public"]['Enums']["program_status"],"student_id": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"id"?: string,"riwayah": string,"started_at"?: string,"status"?: Database["public"]['Enums']["program_status"],"student_id": string,"teacher_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"id"?: string,"riwayah"?: string,"started_at"?: string,"status"?: Database["public"]['Enums']["program_status"],"student_id"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ijazah_programs_riwayah_fkey"
      columns: ["riwayah"]
isOneToOne: false
      referencedRelation: "riwayat"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "ijazah_programs_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazah_programs_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazah_programs_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazah_programs_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"ijazahs": {
                  Row: {
                    "granting_sheikh_snapshot": string | null,"id": string,"issued_at": string,"pages_count": number,"program_id": string | null,"revoke_reason": string | null,"revoked_at": string | null,"revoked_by": string | null,"riwayah": string,"sanad_snapshot": string,"sessions_count": number,"started_at": string | null,"student_gender": Database["public"]['Enums']["gender"] | null,"student_id": string | null,"student_name": string,"teacher_gender": Database["public"]['Enums']["gender"] | null,"teacher_id": string | null,"teacher_name": string,"verification_code": string
                  }
                  ComputedFields: never
                  Insert: {
                    "granting_sheikh_snapshot"?: string | null,"id"?: string,"issued_at"?: string,"pages_count": number,"program_id"?: string | null,"revoke_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"riwayah": string,"sanad_snapshot": string,"sessions_count": number,"started_at"?: string | null,"student_gender"?: Database["public"]['Enums']["gender"] | null,"student_id"?: string | null,"student_name": string,"teacher_gender"?: Database["public"]['Enums']["gender"] | null,"teacher_id"?: string | null,"teacher_name": string,"verification_code": string
                  }
                  Update: {
                    "granting_sheikh_snapshot"?: string | null,"id"?: string,"issued_at"?: string,"pages_count"?: number,"program_id"?: string | null,"revoke_reason"?: string | null,"revoked_at"?: string | null,"revoked_by"?: string | null,"riwayah"?: string,"sanad_snapshot"?: string,"sessions_count"?: number,"started_at"?: string | null,"student_gender"?: Database["public"]['Enums']["gender"] | null,"student_id"?: string | null,"student_name"?: string,"teacher_gender"?: Database["public"]['Enums']["gender"] | null,"teacher_id"?: string | null,"teacher_name"?: string,"verification_code"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ijazahs_program_id_fkey"
      columns: ["program_id"]
isOneToOne: true
      referencedRelation: "ijazah_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_revoked_by_fkey"
      columns: ["revoked_by"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_riwayah_fkey"
      columns: ["riwayah"]
isOneToOne: false
      referencedRelation: "riwayat"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "ijazahs_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ijazahs_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
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
                },"push_tokens": {
                  Row: {
                    "platform": string,"token": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "platform": string,"token": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "platform"?: string,"token"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "push_tokens_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"recitation_mistakes": {
                  Row: {
                    "ayah": number | null,"booking_id": string,"created_at": string,"description": string,"id": string,"page": number | null,"student_id": string,"surah": number | null,"teacher_id": string,"type": Database["public"]['Enums']["mistake_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "ayah"?: number | null,"booking_id": string,"created_at"?: string,"description": string,"id"?: string,"page"?: number | null,"student_id": string,"surah"?: number | null,"teacher_id": string,"type": Database["public"]['Enums']["mistake_type"]
                  }
                  Update: {
                    "ayah"?: number | null,"booking_id"?: string,"created_at"?: string,"description"?: string,"id"?: string,"page"?: number | null,"student_id"?: string,"surah"?: number | null,"teacher_id"?: string,"type"?: Database["public"]['Enums']["mistake_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "recitation_mistakes_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: false
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recitation_mistakes_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recitation_mistakes_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recitation_mistakes_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recitation_mistakes_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "booking_id": string,"comment": string | null,"created_at": string,"id": string,"rating": number,"student_id": string | null,"tags": (string)[],"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_id": string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating": number,"student_id"?: string | null,"tags"?: (string)[],"teacher_id": string
                  }
                  Update: {
                    "booking_id"?: string,"comment"?: string | null,"created_at"?: string,"id"?: string,"rating"?: number,"student_id"?: string | null,"tags"?: (string)[],"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
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
                },"session_progress": {
                  Row: {
                    "approved_at": string | null,"booking_id": string,"created_at": string,"from_ayah": number | null,"from_page": number,"from_surah": number | null,"id": string,"note": string | null,"program_id": string | null,"quality": Database["public"]['Enums']["session_quality"] | null,"status": Database["public"]['Enums']["progress_status"],"student_id": string,"teacher_id": string,"to_ayah": number | null,"to_page": number,"to_surah": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"booking_id": string,"created_at"?: string,"from_ayah"?: number | null,"from_page": number,"from_surah"?: number | null,"id"?: string,"note"?: string | null,"program_id"?: string | null,"quality"?: Database["public"]['Enums']["session_quality"] | null,"status"?: Database["public"]['Enums']["progress_status"],"student_id": string,"teacher_id": string,"to_ayah"?: number | null,"to_page": number,"to_surah"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "approved_at"?: string | null,"booking_id"?: string,"created_at"?: string,"from_ayah"?: number | null,"from_page"?: number,"from_surah"?: number | null,"id"?: string,"note"?: string | null,"program_id"?: string | null,"quality"?: Database["public"]['Enums']["session_quality"] | null,"status"?: Database["public"]['Enums']["progress_status"],"student_id"?: string,"teacher_id"?: string,"to_ayah"?: number | null,"to_page"?: number,"to_surah"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_progress_booking_id_fkey"
      columns: ["booking_id"]
isOneToOne: true
      referencedRelation: "bookings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_progress_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "ijazah_programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_progress_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_progress_student_id_fkey"
      columns: ["student_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_progress_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_progress_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"teacher_applications": {
                  Row: {
                    "bio": string | null,"checklist": NonNullable<Json>,"country": string | null,"created_at": string,"gender": Database["public"]['Enums']["gender"] | null,"granting_sheikh": string | null,"headline": string | null,"id": string,"price_30": number | null,"price_60": number | null,"rejection_reason": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"riwayat": (string)[],"sanad_text": string | null,"status": Database["public"]['Enums']["application_status"],"submitted_at": string | null,"teacher_id": string,"teaches": Database["public"]['Enums']["teaches_gender"],"updated_at": string,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string | null,"checklist"?: NonNullable<Json>,"country"?: string | null,"created_at"?: string,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string,"price_30"?: number | null,"price_60"?: number | null,"rejection_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"riwayat"?: (string)[],"sanad_text"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"teacher_id": string,"teaches"?: Database["public"]['Enums']["teaches_gender"],"updated_at"?: string,"years_experience"?: number | null
                  }
                  Update: {
                    "bio"?: string | null,"checklist"?: NonNullable<Json>,"country"?: string | null,"created_at"?: string,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string,"price_30"?: number | null,"price_60"?: number | null,"rejection_reason"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"riwayat"?: (string)[],"sanad_text"?: string | null,"status"?: Database["public"]['Enums']["application_status"],"submitted_at"?: string | null,"teacher_id"?: string,"teaches"?: Database["public"]['Enums']["teaches_gender"],"updated_at"?: string,"years_experience"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "teacher_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_applications_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_applications_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_applications_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"teacher_documents": {
                  Row: {
                    "application_id": string,"created_at": string,"file_name": string,"id": string,"mime_type": string,"size_bytes": number,"storage_path": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "application_id": string,"created_at"?: string,"file_name": string,"id"?: string,"mime_type": string,"size_bytes": number,"storage_path": string,"teacher_id": string
                  }
                  Update: {
                    "application_id"?: string,"created_at"?: string,"file_name"?: string,"id"?: string,"mime_type"?: string,"size_bytes"?: number,"storage_path"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teacher_documents_application_id_fkey"
      columns: ["application_id"]
isOneToOne: false
      referencedRelation: "teacher_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_documents_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_documents_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"teacher_riwayat": {
                  Row: {
                    "riwayah": string,"teacher_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "riwayah": string,"teacher_id": string
                  }
                  Update: {
                    "riwayah"?: string,"teacher_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teacher_riwayat_riwayah_fkey"
      columns: ["riwayah"]
isOneToOne: false
      referencedRelation: "riwayat"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "teacher_riwayat_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teacher_riwayat_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "public_reviews": {
                  Row: {
                    "comment": string | null,"created_at": string | null,"id": string | null,"rating": number | null,"reviewer_name": string | null,"tags": (string)[] | null,"teacher_id": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "public_teachers"
      referencedColumns: ["id"]
    }
                  ]
                },"public_teachers": {
                  Row: {
                    "accepting_bookings": boolean | null,"bio": string | null,"country": string | null,"created_at": string | null,"currency": string | null,"full_name": string | null,"gender": Database["public"]['Enums']["gender"] | null,"granting_sheikh": string | null,"headline": string | null,"id": string | null,"ijazahs_granted": number | null,"price_30": number | null,"price_60": number | null,"rating_avg": number | null,"rating_count": number | null,"riwayat": (string)[] | null,"sanad_text": string | null,"teaches": Database["public"]['Enums']["teaches_gender"] | null,"timezone": string | null,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                           "accepting_bookings"?: boolean | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string | null,"currency"?: string | null,"full_name"?: string | null,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string | null,"ijazahs_granted"?: number | null,"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"riwayat"?: never,"sanad_text"?: string | null,"teaches"?: Database["public"]['Enums']["teaches_gender"] | null,"timezone"?: string | null,"years_experience"?: number | null
                         }
                        Update: {
                           "accepting_bookings"?: boolean | null,"bio"?: string | null,"country"?: string | null,"created_at"?: string | null,"currency"?: string | null,"full_name"?: string | null,"gender"?: Database["public"]['Enums']["gender"] | null,"granting_sheikh"?: string | null,"headline"?: string | null,"id"?: string | null,"ijazahs_granted"?: number | null,"price_30"?: number | null,"price_60"?: number | null,"rating_avg"?: number | null,"rating_count"?: number | null,"riwayat"?: never,"sanad_text"?: string | null,"teaches"?: Database["public"]['Enums']["teaches_gender"] | null,"timezone"?: string | null,"years_experience"?: number | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "book_session":
{ Args: { "p_duration": number,"p_is_trial"?: boolean,"p_starts_at": string,"p_teacher_id": string }; Returns: {
              "cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"created_at": string,
"currency": string,
"daily_room_name": string | null,
"duration_min": number,
"ends_at": string,
"id": string,
"is_trial": boolean,
"price": number,
"program_id": string | null,
"reminder_sent": boolean,
"rescheduled_from": string | null,
"starts_at": string,
"status": Database["public"]['Enums']["booking_status"],
"student_id": string,
"teacher_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"cancel_booking":
{ Args: { "p_booking_id": string,"p_reason"?: string }; Returns: {
              "cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"created_at": string,
"currency": string,
"daily_room_name": string | null,
"duration_min": number,
"ends_at": string,
"id": string,
"is_trial": boolean,
"price": number,
"program_id": string | null,
"reminder_sent": boolean,
"rescheduled_from": string | null,
"starts_at": string,
"status": Database["public"]['Enums']["booking_status"],
"student_id": string,
"teacher_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"ensure_program":
{ Args: { "p_student": string,"p_teacher": string }; Returns: string
                           },
"generate_verification_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_approved_teacher":
{ Args: { "p_id": string }; Returns: boolean
                           },
"issue_ijazah":
{ Args: { "p_program_id": string }; Returns: {
              "granting_sheikh_snapshot": string | null,
"id": string,
"issued_at": string,
"pages_count": number,
"program_id": string | null,
"revoke_reason": string | null,
"revoked_at": string | null,
"revoked_by": string | null,
"riwayah": string,
"sanad_snapshot": string,
"sessions_count": number,
"started_at": string | null,
"student_gender": Database["public"]['Enums']["gender"] | null,
"student_id": string | null,
"student_name": string,
"teacher_gender": Database["public"]['Enums']["gender"] | null,
"teacher_id": string | null,
"teacher_name": string,
"verification_code": string
            }
                          SetofOptions: {
        from: "*"
        to: "ijazahs"
        isOneToOne: true
        isSetofReturn: false
      } },
"list_teachers":
{ Args: { "p_riwayah"?: string,"p_search"?: string }; Returns: {
              "accepting_bookings": boolean | null,
"bio": string | null,
"country": string | null,
"created_at": string | null,
"currency": string | null,
"full_name": string | null,
"gender": Database["public"]['Enums']["gender"] | null,
"granting_sheikh": string | null,
"headline": string | null,
"id": string | null,
"ijazahs_granted": number | null,
"price_30": number | null,
"price_60": number | null,
"rating_avg": number | null,
"rating_count": number | null,
"riwayat": (string)[] | null,
"sanad_text": string | null,
"teaches": Database["public"]['Enums']["teaches_gender"] | null,
"timezone": string | null,
"years_experience": number | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "public_teachers"
        isOneToOne: false
        isSetofReturn: true
      } },
"program_pages_covered":
{ Args: { "p_program_id": string }; Returns: number
                           },
"reschedule_booking":
{ Args: { "p_booking_id": string,"p_new_start": string }; Returns: {
              "cancel_reason": string | null,
"cancelled_at": string | null,
"cancelled_by": string | null,
"created_at": string,
"currency": string,
"daily_room_name": string | null,
"duration_min": number,
"ends_at": string,
"id": string,
"is_trial": boolean,
"price": number,
"program_id": string | null,
"reminder_sent": boolean,
"rescheduled_from": string | null,
"starts_at": string,
"status": Database["public"]['Enums']["booking_status"],
"student_id": string,
"teacher_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "bookings"
        isOneToOne: true
        isSetofReturn: false
      } },
"review_teacher_application":
{ Args: { "p_application_id": string,"p_approve": boolean,"p_checklist"?: Json,"p_reason"?: string }; Returns: {
              "bio": string | null,
"checklist": NonNullable<Json>,
"country": string | null,
"created_at": string,
"gender": Database["public"]['Enums']["gender"] | null,
"granting_sheikh": string | null,
"headline": string | null,
"id": string,
"price_30": number | null,
"price_60": number | null,
"rejection_reason": string | null,
"reviewed_at": string | null,
"reviewed_by": string | null,
"riwayat": (string)[],
"sanad_text": string | null,
"status": Database["public"]['Enums']["application_status"],
"submitted_at": string | null,
"teacher_id": string,
"teaches": Database["public"]['Enums']["teaches_gender"],
"updated_at": string,
"years_experience": number | null
            }
                          SetofOptions: {
        from: "*"
        to: "teacher_applications"
        isOneToOne: true
        isSetofReturn: false
      } },
"revoke_ijazah":
{ Args: { "p_id": string,"p_reason": string }; Returns: {
              "granting_sheikh_snapshot": string | null,
"id": string,
"issued_at": string,
"pages_count": number,
"program_id": string | null,
"revoke_reason": string | null,
"revoked_at": string | null,
"revoked_by": string | null,
"riwayah": string,
"sanad_snapshot": string,
"sessions_count": number,
"started_at": string | null,
"student_gender": Database["public"]['Enums']["gender"] | null,
"student_id": string | null,
"student_name": string,
"teacher_gender": Database["public"]['Enums']["gender"] | null,
"teacher_id": string | null,
"teacher_name": string,
"verification_code": string
            }
                          SetofOptions: {
        from: "*"
        to: "ijazahs"
        isOneToOne: true
        isSetofReturn: false
      } },
"slot_fits_availability":
{ Args: { "p_end": string,"p_start": string,"p_teacher": string }; Returns: boolean
                           },
"teacher_busy":
{ Args: { "p_from": string,"p_teacher_ids": (string)[],"p_to": string }; Returns: {
              "ends_at": string,"starts_at": string,"teacher_id": string
            }[]
                           },
"teacher_matches":
{ Args: { "s_female_only": boolean,"s_gender": Database["public"]['Enums']["gender"],"t_gender": Database["public"]['Enums']["gender"],"t_teaches": Database["public"]['Enums']["teaches_gender"] }; Returns: boolean
                           },
"verification_checksum":
{ Args: { "body": string }; Returns: string
                           },
"verify_ijazah":
{ Args: { "p_code": string }; Returns: {
              "granting_sheikh_snapshot": string,"issued_at": string,"pages_count": number,"revoke_reason": string,"revoked": boolean,"riwayah": string,"riwayah_name_ar": string,"riwayah_name_en": string,"sanad_snapshot": string,"sessions_count": number,"started_at": string,"student_gender": Database["public"]['Enums']["gender"],"student_name": string,"teacher_gender": Database["public"]['Enums']["gender"],"teacher_name": string,"verification_code": string
            }[]
                           }
          }
          Enums: {
            "application_status": "draft"|"pending"|"approved"|"rejected","booking_status": "scheduled"|"completed"|"cancelled"|"no_show","gender": "male"|"female","learning_goal": "ijazah"|"memorization"|"tajweed","mistake_type": "tajweed"|"hifz"|"harakah"|"waqf","program_status": "active"|"completed"|"abandoned","progress_status": "draft"|"approved","session_quality": "excellent"|"good"|"acceptable"|"repeat","teacher_status": "none"|"pending"|"approved"|"rejected","teaches_gender": "male"|"female"|"both","user_role": "student"|"teacher"|"admin"
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
            "application_status": ["draft", "pending", "approved", "rejected"],"booking_status": ["scheduled", "completed", "cancelled", "no_show"],"gender": ["male", "female"],"learning_goal": ["ijazah", "memorization", "tajweed"],"mistake_type": ["tajweed", "hifz", "harakah", "waqf"],"program_status": ["active", "completed", "abandoned"],"progress_status": ["draft", "approved"],"session_quality": ["excellent", "good", "acceptable", "repeat"],"teacher_status": ["none", "pending", "approved", "rejected"],"teaches_gender": ["male", "female", "both"],"user_role": ["student", "teacher", "admin"]
          }
        }
} as const
