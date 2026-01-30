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
          email: string
          treatment_type: string
          preferred_date: string
          preferred_time: string
          message: string
          agree_privacy: boolean
          status: string
          notes: string
          contacted_at: string | null
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          password?: string | null
          phone: string
          email?: string
          treatment_type: string
          preferred_date?: string
          preferred_time?: string
          message?: string
          agree_privacy?: boolean
          status?: string
          notes?: string
          contacted_at?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          password?: string | null
          phone?: string
          email?: string
          treatment_type?: string
          preferred_date?: string
          preferred_time?: string
          message?: string
          agree_privacy?: boolean
          status?: string
          notes?: string
          contacted_at?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          slug: string
          title_ko: string
          title_en: string
          title_ja: string
          title_zh: string
          description_ko: string
          description_en: string
          description_ja: string
          description_zh: string
          poster_image: string | null
          thumbnail_image: string | null
          gallery_images: string[]
          start_date: string
          end_date: string
          category: string
          featured: boolean
          related_treatments: string[]
          is_published: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title_ko: string
          title_en?: string
          title_ja?: string
          title_zh?: string
          description_ko: string
          description_en?: string
          description_ja?: string
          description_zh?: string
          poster_image?: string | null
          thumbnail_image?: string | null
          gallery_images?: string[]
          start_date: string
          end_date: string
          category?: string
          featured?: boolean
          related_treatments?: string[]
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title_ko?: string
          title_en?: string
          title_ja?: string
          title_zh?: string
          description_ko?: string
          description_en?: string
          description_ja?: string
          description_zh?: string
          poster_image?: string | null
          thumbnail_image?: string | null
          gallery_images?: string[]
          start_date?: string
          end_date?: string
          category?: string
          featured?: boolean
          related_treatments?: string[]
          is_published?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          id: string
          title: string
          image_url: string | null
          link_url: string
          link_target: string
          display_start: string
          display_end: string
          is_active: boolean
          width: number
          sort_order: number
          show_on_mobile: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          image_url?: string | null
          link_url?: string
          link_target?: string
          display_start: string
          display_end: string
          is_active?: boolean
          width?: number
          sort_order?: number
          show_on_mobile?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          image_url?: string | null
          link_url?: string
          link_target?: string
          display_start?: string
          display_end?: string
          is_active?: boolean
          width?: number
          sort_order?: number
          show_on_mobile?: boolean
          created_at?: string
          updated_at?: string
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
