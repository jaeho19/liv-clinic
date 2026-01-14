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
      consultation_requests: {
        Row: {
          id: string
          name: string
          password: string | null
          phone: string
          treatment_type: string
          agree_privacy: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          password?: string | null
          phone: string
          treatment_type: string
          agree_privacy?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          password?: string | null
          phone?: string
          treatment_type?: string
          agree_privacy?: boolean
          status?: string
          created_at?: string
        }
      }
    }
  }
}
