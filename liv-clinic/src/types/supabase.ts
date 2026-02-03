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
