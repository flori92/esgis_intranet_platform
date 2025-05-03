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
      // Table des profils utilisateurs
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          avatar_url: string | null
          email: string
          role: 'admin' | 'professor' | 'student'
          department_id: number | null
          is_active: boolean
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          avatar_url?: string | null
          email: string
          role: 'admin' | 'professor' | 'student'
          department_id?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string | null
          email?: string
          role?: 'admin' | 'professor' | 'student'
          department_id?: number | null
          is_active?: boolean
        }
      }

      // Table des informations spécifiques aux étudiants
      students: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          profile_id: string
          student_number: string
          entry_year: number
          graduation_year: number | null
          level: string
          specialization: string | null
          status: 'active' | 'graduated' | 'suspended' | 'expelled'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id: string
          student_number: string
          entry_year: number
          graduation_year?: number | null
          level: string
          specialization?: string | null
          status?: 'active' | 'graduated' | 'suspended' | 'expelled'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id?: string
          student_number?: string
          entry_year?: number
          graduation_year?: number | null
          level?: string
          specialization?: string | null
          status?: 'active' | 'graduated' | 'suspended' | 'expelled'
        }
      }

      // Table des informations spécifiques aux professeurs
      professors: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          profile_id: string
          employee_number: string
          hire_date: string
          specialties: string[]
          biography: string | null
          office_location: string | null
          office_hours: string | null
          status: 'active' | 'inactive' | 'on_leave'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id: string
          employee_number: string
          hire_date: string
          specialties: string[]
          biography?: string | null
          office_location?: string | null
          office_hours?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          profile_id?: string
          employee_number?: string
          hire_date?: string
          specialties?: string[]
          biography?: string | null
          office_location?: string | null
          office_hours?: string | null
          status?: 'active' | 'inactive' | 'on_leave'
        }
      }

      // Table des départements/filières
      departments: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          name: string
          code: string
          description: string | null
          head_professor_id: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          name: string
          code: string
          description?: string | null
          head_professor_id?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          name?: string
          code?: string
          description?: string | null
          head_professor_id?: string | null
        }
      }

      // Table des cours
      courses: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          name: string
          code: string
          description: string | null
          department_id: number
          credits: number
          hours: number
          semester: number
          year: number
          syllabus_url: string | null
          status: 'active' | 'inactive' | 'archived'
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          name: string
          code: string
          description?: string | null
          department_id: number
          credits: number
          hours: number
          semester: number
          year: number
          syllabus_url?: string | null
          status?: 'active' | 'inactive' | 'archived'
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          name?: string
          code?: string
          description?: string | null
          department_id?: number
          credits?: number
          hours?: number
          semester?: number
          year?: number
          syllabus_url?: string | null
          status?: 'active' | 'inactive' | 'archived'
        }
      }

      // Table d'attribution des cours aux professeurs
      course_professors: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          course_id: number
          professor_id: string
          is_primary: boolean
          academic_year: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id: number
          professor_id: string
          is_primary?: boolean
          academic_year: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id?: number
          professor_id?: string
          is_primary?: boolean
          academic_year?: string
        }
      }

      // Table d'inscription des étudiants aux cours
      course_enrollments: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          course_id: number
          student_id: string
          enrollment_date: string
          status: 'enrolled' | 'completed' | 'withdrawn' | 'failed'
          academic_year: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id: number
          student_id: string
          enrollment_date: string
          status?: 'enrolled' | 'completed' | 'withdrawn' | 'failed'
          academic_year: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id?: number
          student_id?: string
          enrollment_date?: string
          status?: 'enrolled' | 'completed' | 'withdrawn' | 'failed'
          academic_year?: string
        }
      }

      // Table des emplois du temps
      schedules: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          course_id: number
          professor_id: string
          room: string
          day_of_week: number
          start_time: string
          end_time: string
          recurrence: 'weekly' | 'biweekly' | 'once'
          start_date: string
          end_date: string
          academic_year: string
          notes: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id: number
          professor_id: string
          room: string
          day_of_week: number
          start_time: string
          end_time: string
          recurrence?: 'weekly' | 'biweekly' | 'once'
          start_date: string
          end_date: string
          academic_year: string
          notes?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id?: number
          professor_id?: string
          room?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          recurrence?: 'weekly' | 'biweekly' | 'once'
          start_date?: string
          end_date?: string
          academic_year?: string
          notes?: string | null
        }
      }

      // Table des examens
      exams: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          course_id: number
          title: string
          description: string | null
          exam_type: 'midterm' | 'final' | 'quiz' | 'project'
          exam_date: string
          duration: number
          room: string
          max_score: number
          weight: number
          professor_id: string
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id: number
          title: string
          description?: string | null
          exam_type: 'midterm' | 'final' | 'quiz' | 'project'
          exam_date: string
          duration: number
          room: string
          max_score: number
          weight: number
          professor_id: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          course_id?: number
          title?: string
          description?: string | null
          exam_type?: 'midterm' | 'final' | 'quiz' | 'project'
          exam_date?: string
          duration?: number
          room?: string
          max_score?: number
          weight?: number
          professor_id?: string
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
        }
      }

      // Table des notes
      grades: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          student_id: string
          course_id: number
          exam_id: number | null
          grade: number
          max_grade: number
          comments: string | null
          graded_by: string
          academic_year: string
          is_published: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id: string
          course_id: number
          exam_id?: number | null
          grade: number
          max_grade: number
          comments?: string | null
          graded_by: string
          academic_year: string
          is_published?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id?: string
          course_id?: number
          exam_id?: number | null
          grade?: number
          max_grade?: number
          comments?: string | null
          graded_by?: string
          academic_year?: string
          is_published?: boolean
        }
      }

      // Table des documents
      documents: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          title: string
          description: string | null
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          course_id: number | null
          document_type: 'course_material' | 'assignment' | 'solution' | 'syllabus' | 'administrative' | 'other'
          is_public: boolean
          download_count: number
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          course_id?: number | null
          document_type: 'course_material' | 'assignment' | 'solution' | 'syllabus' | 'administrative' | 'other'
          is_public?: boolean
          download_count?: number
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          file_path?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          course_id?: number | null
          document_type?: 'course_material' | 'assignment' | 'solution' | 'syllabus' | 'administrative' | 'other'
          is_public?: boolean
          download_count?: number
        }
      }

      // Table des stages
      internships: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          student_id: string
          company_name: string
          position: string
          description: string | null
          start_date: string
          end_date: string
          supervisor_name: string
          supervisor_email: string
          supervisor_phone: string | null
          status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
          approved_by: string | null
          approval_date: string | null
          report_url: string | null
          grade: number | null
          comments: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id: string
          company_name: string
          position: string
          description?: string | null
          start_date: string
          end_date: string
          supervisor_name: string
          supervisor_email: string
          supervisor_phone?: string | null
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
          approved_by?: string | null
          approval_date?: string | null
          report_url?: string | null
          grade?: number | null
          comments?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id?: string
          company_name?: string
          position?: string
          description?: string | null
          start_date?: string
          end_date?: string
          supervisor_name?: string
          supervisor_email?: string
          supervisor_phone?: string | null
          status?: 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected'
          approved_by?: string | null
          approval_date?: string | null
          report_url?: string | null
          grade?: number | null
          comments?: string | null
        }
      }

      // Table des annonces
      announcements: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          title: string
          content: string
          author_id: string
          target_audience: 'all' | 'students' | 'professors' | 'administrators'
          department_id: number | null
          course_id: number | null
          priority: 'low' | 'normal' | 'high'
          publish_date: string
          expiry_date: string | null
          is_published: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          title: string
          content: string
          author_id: string
          target_audience?: 'all' | 'students' | 'professors' | 'administrators'
          department_id?: number | null
          course_id?: number | null
          priority?: 'low' | 'normal' | 'high'
          publish_date: string
          expiry_date?: string | null
          is_published?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          author_id?: string
          target_audience?: 'all' | 'students' | 'professors' | 'administrators'
          department_id?: number | null
          course_id?: number | null
          priority?: 'low' | 'normal' | 'high'
          publish_date?: string
          expiry_date?: string | null
          is_published?: boolean
        }
      }

      // Table des paiements
      payments: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          student_id: string
          amount: number
          payment_date: string
          payment_type: 'tuition' | 'registration' | 'exam' | 'other'
          payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card'
          reference_number: string
          academic_year: string
          semester: number
          description: string | null
          receipt_url: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_by: string
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id: string
          amount: number
          payment_date: string
          payment_type: 'tuition' | 'registration' | 'exam' | 'other'
          payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card'
          reference_number: string
          academic_year: string
          semester: number
          description?: string | null
          receipt_url?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_by: string
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          student_id?: string
          amount?: number
          payment_date?: string
          payment_type?: 'tuition' | 'registration' | 'exam' | 'other'
          payment_method?: 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card'
          reference_number?: string
          academic_year?: string
          semester?: number
          description?: string | null
          receipt_url?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          processed_by?: string
        }
      }

      // Table des offres d'emploi
      job_postings: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          title: string
          company: string
          location: string
          description: string
          requirements: string
          job_type: 'full_time' | 'part_time' | 'internship' | 'contract'
          salary_range: string | null
          contact_email: string
          contact_phone: string | null
          application_url: string | null
          posted_by: string
          expiry_date: string
          is_active: boolean
          department_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          title: string
          company: string
          location: string
          description: string
          requirements: string
          job_type: 'full_time' | 'part_time' | 'internship' | 'contract'
          salary_range?: string | null
          contact_email: string
          contact_phone?: string | null
          application_url?: string | null
          posted_by: string
          expiry_date: string
          is_active?: boolean
          department_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          title?: string
          company?: string
          location?: string
          description?: string
          requirements?: string
          job_type?: 'full_time' | 'part_time' | 'internship' | 'contract'
          salary_range?: string | null
          contact_email?: string
          contact_phone?: string | null
          application_url?: string | null
          posted_by?: string
          expiry_date?: string
          is_active?: boolean
          department_id?: number | null
        }
      }

      // Table de vérification de l'état du système
      health_check: {
        Row: {
          id: number
          created_at: string
          status: string
        }
        Insert: {
          id?: number
          created_at?: string
          status: string
        }
        Update: {
          id?: number
          created_at?: string
          status?: string
        }
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
  }
}
