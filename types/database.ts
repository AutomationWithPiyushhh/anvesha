export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'student' | 'admin'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: UserRole
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: UserRole
          created_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          thumbnail: string
          price_inr: number
          is_published: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          thumbnail: string
          price_inr?: number
          is_published?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          thumbnail?: string
          price_inr?: number
          is_published?: boolean
          created_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          course_id: string
          title: string
          bunny_video_id: string
          order: number
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          bunny_video_id: string
          order?: number
          duration?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          bunny_video_id?: string
          order?: number
          duration?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollments: {
        Row: {
          user_id: string
          course_id: string
          granted_at: string
        }
        Insert: {
          user_id: string
          course_id: string
          granted_at?: string
        }
        Update: {
          user_id?: string
          course_id?: string
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          user_id: string
          device_id: string
          last_active: string
          user_agent: string | null
          playing_video_id: string | null
          playback_started_at: string | null
        }
        Insert: {
          user_id: string
          device_id: string
          last_active?: string
          user_agent?: string | null
          playing_video_id?: string | null
          playback_started_at?: string | null
        }
        Update: {
          user_id?: string
          device_id?: string
          last_active?: string
          user_agent?: string | null
          playing_video_id?: string | null
          playback_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      watch_progress: {
        Row: {
          user_id: string
          video_id: string
          position_seconds: number
          completed: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          video_id: string
          position_seconds?: number
          completed?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          video_id?: string
          position_seconds?: number
          completed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          reset_at: string
        }
        Insert: {
          key: string
          count?: number
          reset_at: string
        }
        Update: {
          key?: string
          count?: number
          reset_at?: string
        }
        Relationships: []
      }
      lesson_resources: {
        Row: {
          id: string
          video_id: string
          title: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          title: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          title?: string
          url?: string
          created_at?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          id: string
          user_id: string
          video_id: string
          content: string
          timestamp_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_id: string
          content: string
          timestamp_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_id?: string
          content?: string
          timestamp_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          certificate_number: string
          issued_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          certificate_number: string
          issued_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          certificate_number?: string
          issued_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      enrollment_requests: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: 'pending' | 'approved' | 'rejected'
          payment_method: string
          transaction_ref: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: 'pending' | 'approved' | 'rejected'
          payment_method?: string
          transaction_ref?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          payment_method?: string
          transaction_ref?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_requests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      student_videos: {
        Row: {
          id: string
          course_id: string
          title: string
          order: number
          duration: number
          created_at: string
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      increment_rate_limit: {
        Args: {
          p_key: string
          p_window_seconds: number
        }
        Returns: {
          current_count: number
          reset_at: string
        }[]
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
