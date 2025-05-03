export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: number
          name: string
          code: string
          description: string | null
          head_professor_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          description?: string | null
          head_professor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          description?: string | null
          head_professor_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_professor_id_fkey"
            columns: ["head_professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: string
          department_id: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role: string
          department_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: string
          department_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: number
          profile_id: string
          student_number: string
          entry_year: number
          level: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          student_number: string
          entry_year: number
          level: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          student_number?: string
          entry_year?: number
          level?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      professors: {
        Row: {
          id: number
          profile_id: string
          employee_number: string
          hire_date: string
          specialties: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          profile_id: string
          employee_number: string
          hire_date: string
          specialties?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          profile_id?: string
          employee_number?: string
          hire_date?: string
          specialties?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      courses: {
        Row: {
          id: number
          name: string
          code: string
          credits: number
          description: string | null
          department_id: number | null
          level: string
          semester: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          code: string
          credits: number
          description?: string | null
          department_id?: number | null
          level: string
          semester: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          code?: string
          credits?: number
          description?: string | null
          department_id?: number | null
          level?: string
          semester?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      professor_courses: {
        Row: {
          id: number
          professor_id: number
          course_id: number
          academic_year: string
          is_principal: boolean | null
          created_at: string
        }
        Insert: {
          id?: number
          professor_id: number
          course_id: number
          academic_year: string
          is_principal?: boolean | null
          created_at?: string
        }
        Update: {
          id?: number
          professor_id?: number
          course_id?: number
          academic_year?: string
          is_principal?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_courses_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professors"
            referencedColumns: ["id"]
          }
        ]
      }
      student_courses: {
        Row: {
          id: number
          student_id: number
          course_id: number
          academic_year: string
          status: string
          created_at: string
        }
        Insert: {
          id?: number
          student_id: number
          course_id: number
          academic_year: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          student_id?: number
          course_id?: number
          academic_year?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      course_sessions: {
        Row: {
          id: number
          course_id: number
          professor_id: number
          date: string
          duration: number
          room: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          course_id: number
          professor_id: number
          date: string
          duration: number
          room?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          course_id?: number
          professor_id?: number
          date?: string
          duration?: number
          room?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professors"
            referencedColumns: ["id"]
          }
        ]
      }
      attendances: {
        Row: {
          id: number
          session_id: number
          student_id: number
          status: string
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          session_id: number
          student_id: number
          status?: string
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          session_id?: number
          student_id?: number
          status?: string
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      exams: {
        Row: {
          id: number
          course_id: number
          name: string
          date: string
          duration: number
          weight: number
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          course_id: number
          name: string
          date: string
          duration: number
          weight: number
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          course_id?: number
          name?: string
          date?: string
          duration?: number
          weight?: number
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_results: {
        Row: {
          id: number
          exam_id: number
          student_id: number
          grade: number | null
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          exam_id: number
          student_id: number
          grade?: number | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          exam_id?: number
          student_id?: number
          grade?: number | null
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: number
          title: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          visibility: string
          course_id: number | null
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          visibility?: string
          course_id?: number | null
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          visibility?: string
          course_id?: number | null
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: number
          student_id: number
          amount: number
          payment_date: string
          payment_type: string
          reference: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          student_id: number
          amount: number
          payment_date: string
          payment_type?: string
          reference?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          student_id?: number
          amount?: number
          payment_date?: string
          payment_type?: string
          reference?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: number
          conversation_id: number
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: number
          conversation_id: number
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          conversation_id?: number
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: number
          title: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_participants: {
        Row: {
          id: number
          conversation_id: number
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: number
          conversation_id: number
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: number
          conversation_id?: number
          profile_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: number
          recipient_id: string
          title: string
          content: string
          type: string
          read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: number
          recipient_id: string
          title: string
          content: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          recipient_id?: string
          title?: string
          content?: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      events: {
        Row: {
          id: number
          title: string
          description: string | null
          start_date: string
          end_date: string
          location: string | null
          type: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          start_date: string
          end_date: string
          location?: string | null
          type?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          location?: string | null
          type?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      requests: {
        Row: {
          id: number
          requester_id: string
          type: string
          title: string
          description: string
          status: string
          reviewer_id: string | null
          review_comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          requester_id: string
          type: string
          title: string
          description: string
          status?: string
          reviewer_id?: string | null
          review_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          requester_id?: string
          type?: string
          title?: string
          description?: string
          status?: string
          reviewer_id?: string | null
          review_comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
