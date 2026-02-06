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
          assignee: string | null
          next_followup_at: string | null
          followup_outcome: string | null
          procedure_tags: string[]
          budget_range: string | null
          availability: string | null
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
          assignee?: string | null
          next_followup_at?: string | null
          followup_outcome?: string | null
          procedure_tags?: string[]
          budget_range?: string | null
          availability?: string | null
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
          assignee?: string | null
          next_followup_at?: string | null
          followup_outcome?: string | null
          procedure_tags?: string[]
          budget_range?: string | null
          availability?: string | null
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
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          sub_category: string | null
          specification: string | null
          unit: string
          current_stock: number
          min_stock: number
          unit_price: number
          supplier: string | null
          storage_note: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          sub_category?: string | null
          specification?: string | null
          unit?: string
          current_stock?: number
          min_stock?: number
          unit_price?: number
          supplier?: string | null
          storage_note?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          sub_category?: string | null
          specification?: string | null
          unit?: string
          current_stock?: number
          min_stock?: number
          unit_price?: number
          supplier?: string | null
          storage_note?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_transactions_item_id_fkey'
            columns: ['id']
            referencedRelation: 'inventory_transactions'
            referencedColumns: ['item_id']
          }
        ]
      }
      inventory_transactions: {
        Row: {
          id: string
          item_id: string
          tx_type: string
          quantity: number
          patient_name: string | null
          chart_number: string | null
          note: string | null
          confirmed_by: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          tx_type: string
          quantity: number
          patient_name?: string | null
          chart_number?: string | null
          note?: string | null
          confirmed_by?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          tx_type?: string
          quantity?: number
          patient_name?: string | null
          chart_number?: string | null
          note?: string | null
          confirmed_by?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_transactions_item_id_fkey'
            columns: ['item_id']
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          }
        ]
      }
      procedure_recipes: {
        Row: {
          id: string
          procedure_name: string
          item_id: string
          default_qty: number
          note: string | null
        }
        Insert: {
          id?: string
          procedure_name: string
          item_id: string
          default_qty?: number
          note?: string | null
        }
        Update: {
          id?: string
          procedure_name?: string
          item_id?: string
          default_qty?: number
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'procedure_recipes_item_id_fkey'
            columns: ['item_id']
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          }
        ]
      }
      patient_treatments: {
        Row: {
          id: string
          patient_name: string
          phone: string
          treatment_name: string
          treatment_category: string | null
          doctor: string | null
          treated_at: string
          notification_cycle_days: number | null
          next_notification_at: string | null
          notification_sent: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_name: string
          phone: string
          treatment_name: string
          treatment_category?: string | null
          doctor?: string | null
          treated_at: string
          notification_cycle_days?: number | null
          next_notification_at?: string | null
          notification_sent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_name?: string
          phone?: string
          treatment_name?: string
          treatment_category?: string | null
          doctor?: string | null
          treated_at?: string
          notification_cycle_days?: number | null
          next_notification_at?: string | null
          notification_sent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          id: string
          treatment_name: string
          template_type: string
          title: string
          message: string
          video_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          treatment_name: string
          template_type: string
          title: string
          message: string
          video_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          treatment_name?: string
          template_type?: string
          title?: string
          message?: string
          video_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          id: string
          patient_treatment_id: string
          template_id: string | null
          channel: string
          sent_by: string
          sent_at: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          patient_treatment_id: string
          template_id?: string | null
          channel: string
          sent_by: string
          sent_at?: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          patient_treatment_id?: string
          template_id?: string | null
          channel?: string
          sent_by?: string
          sent_at?: string
          status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notification_history_patient_treatment_id_fkey'
            columns: ['patient_treatment_id']
            referencedRelation: 'patient_treatments'
            referencedColumns: ['id']
          }
        ]
      }
      operation_cases: {
        Row: {
          id: string
          room_id: string
          patient_name: string
          phone_number: string | null
          treatment_type: string
          status: string
          location: string
          doctor: string
          procedure_name: string
          actual_start: string | null
          expected_duration_min: number
          memo: string | null
          parent_case_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          patient_name: string
          phone_number?: string | null
          treatment_type: string
          status?: string
          location?: string
          doctor: string
          procedure_name: string
          actual_start?: string | null
          expected_duration_min?: number
          memo?: string | null
          parent_case_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          patient_name?: string
          phone_number?: string | null
          treatment_type?: string
          status?: string
          location?: string
          doctor?: string
          procedure_name?: string
          actual_start?: string | null
          expected_duration_min?: number
          memo?: string | null
          parent_case_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_name: string
          action: string
          target: string
          detail: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_name: string
          action: string
          target: string
          detail?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_name?: string
          action?: string
          target?: string
          detail?: string | null
          created_at?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          id: number
          name: string
          phone: string
          address: string
          email: string
          kakao: string
          hours_weekday: string
          hours_saturday: string
          hours_sunday: string
          hours_lunch: string
          notify_callback_reminder: boolean
          notify_low_stock_alert: boolean
          notify_new_consultation: boolean
          revenue_target: number
        }
        Insert: {
          id?: number
          name: string
          phone: string
          address: string
          email?: string
          kakao?: string
          hours_weekday?: string
          hours_saturday?: string
          hours_sunday?: string
          hours_lunch?: string
          notify_callback_reminder?: boolean
          notify_low_stock_alert?: boolean
          notify_new_consultation?: boolean
          revenue_target?: number
        }
        Update: {
          id?: number
          name?: string
          phone?: string
          address?: string
          email?: string
          kakao?: string
          hours_weekday?: string
          hours_saturday?: string
          hours_sunday?: string
          hours_lunch?: string
          notify_callback_reminder?: boolean
          notify_low_stock_alert?: boolean
          notify_new_consultation?: boolean
          revenue_target?: number
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          position: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string
          position?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          position?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      treatment_masters: {
        Row: {
          id: string
          name: string
          category: string
          price_range: string
          duration: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          price_range?: string
          duration?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          price_range?: string
          duration?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      inventory_counts: {
        Row: {
          id: string
          item_id: string
          count_type: string
          counted_qty: number
          system_qty: number
          difference: number
          counted_by: string | null
          counted_at: string
        }
        Insert: {
          id?: string
          item_id: string
          count_type?: string
          counted_qty: number
          system_qty: number
          counted_by?: string | null
          counted_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          count_type?: string
          counted_qty?: number
          system_qty?: number
          counted_by?: string | null
          counted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_counts_item_id_fkey'
            columns: ['item_id']
            referencedRelation: 'inventory_items'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      use_inventory_item: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_patient_name?: string
          p_chart_number?: string
          p_note?: string
          p_confirmed_by?: string
          p_created_by?: string
        }
        Returns: string
      }
      restock_inventory_item: {
        Args: {
          p_item_id: string
          p_quantity: number
          p_note?: string
          p_created_by?: string
        }
        Returns: string
      }
      get_inventory_items: {
        Args: {
          p_category?: string
          p_search?: string
          p_stock_status?: string
          p_show_inactive?: boolean
        }
        Returns: Json
      }
      create_inventory_item: {
        Args: {
          p_data: Json
        }
        Returns: Json
      }
      update_inventory_item_by_id: {
        Args: {
          p_id: string
          p_data: Json
        }
        Returns: Json
      }
      soft_delete_inventory_item: {
        Args: {
          p_id: string
        }
        Returns: Json
      }
      get_inventory_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      get_inventory_transactions: {
        Args: {
          p_type?: string
          p_item_id?: string
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      get_procedure_recipes: {
        Args: {
          p_procedure?: string
        }
        Returns: Json
      }
      create_procedure_recipe: {
        Args: {
          p_procedure_name: string
          p_item_id: string
          p_default_qty?: number
          p_note?: string
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
