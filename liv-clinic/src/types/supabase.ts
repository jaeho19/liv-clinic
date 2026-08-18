export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          detail: string
          id: string
          target: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string
          id?: string
          target: string
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string
          id?: string
          target?: string
          user_name?: string
        }
        Relationships: []
      }
      before_after: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          is_visible: boolean
          sort_order: number
          title_en: string
          title_ja: string
          title_ko: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_url: string
          is_visible?: boolean
          sort_order?: number
          title_en?: string
          title_ja?: string
          title_ko?: string
          title_zh?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          is_visible?: boolean
          sort_order?: number
          title_en?: string
          title_ja?: string
          title_ko?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          content: string
          country: string | null
          created_at: string
          id: string
          is_published: boolean
          is_verified: boolean
          locale: string
          rating: number
          source: string
          treatment_category: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_name: string
          content: string
          country?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          locale: string
          rating: number
          source?: string
          treatment_category: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_name?: string
          content?: string
          country?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified?: boolean
          locale?: string
          rating?: number
          source?: string
          treatment_category?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          original_lang: string
          original_text: string
          sender: string
          sender_admin_id: string | null
          session_id: string
          slack_ts: string | null
          translated_lang: string | null
          translated_text: string | null
          translation_error: string | null
          translation_latency_ms: number | null
          translation_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_lang: string
          original_text: string
          sender: string
          sender_admin_id?: string | null
          session_id: string
          slack_ts?: string | null
          translated_lang?: string | null
          translated_text?: string | null
          translation_error?: string | null
          translation_latency_ms?: number | null
          translation_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          original_lang?: string
          original_text?: string
          sender?: string
          sender_admin_id?: string | null
          session_id?: string
          slack_ts?: string | null
          translated_lang?: string | null
          translated_text?: string | null
          translation_error?: string | null
          translation_latency_ms?: number | null
          translation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_operator_status: {
        Row: {
          last_seen_at: string
          operator_id: string
          status: string
          updated_at: string
        }
        Insert: {
          last_seen_at?: string
          operator_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          last_seen_at?: string
          operator_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          assigned_admin_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          ip_hash: string | null
          last_message_at: string | null
          session_token: string
          slack_channel_id: string | null
          slack_thread_ts: string | null
          status: string
          unread_admin_count: number
          updated_at: string
          user_agent: string | null
          visitor_email: string | null
          visitor_locale: string
          visitor_messenger_channel: string | null
          visitor_messenger_handle: string | null
          visitor_name: string | null
        }
        Insert: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          session_token?: string
          slack_channel_id?: string | null
          slack_thread_ts?: string | null
          status?: string
          unread_admin_count?: number
          updated_at?: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_locale: string
          visitor_messenger_channel?: string | null
          visitor_messenger_handle?: string | null
          visitor_name?: string | null
        }
        Update: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          last_message_at?: string | null
          session_token?: string
          slack_channel_id?: string | null
          slack_thread_ts?: string | null
          status?: string
          unread_admin_count?: number
          updated_at?: string
          user_agent?: string | null
          visitor_email?: string | null
          visitor_locale?: string
          visitor_messenger_channel?: string | null
          visitor_messenger_handle?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_slack_events: {
        Row: {
          event_id: string
          event_type: string | null
          received_at: string
        }
        Insert: {
          event_id: string
          event_type?: string | null
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string | null
          received_at?: string
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          address: string
          csv_column_mapping: Json | null
          email: string
          ga_enabled: boolean | null
          ga_tracking_id: string | null
          hours_lunch: string
          hours_saturday: string
          hours_sunday: string
          hours_weekday: string
          id: number
          kakao: string
          name: string
          naver_enabled: boolean | null
          naver_wcs_id: string | null
          notify_callback_reminder: boolean
          notify_low_stock_alert: boolean
          notify_new_consultation: boolean
          phone: string
          revenue_target: number | null
          updated_at: string
        }
        Insert: {
          address?: string
          csv_column_mapping?: Json | null
          email?: string
          ga_enabled?: boolean | null
          ga_tracking_id?: string | null
          hours_lunch?: string
          hours_saturday?: string
          hours_sunday?: string
          hours_weekday?: string
          id?: number
          kakao?: string
          name?: string
          naver_enabled?: boolean | null
          naver_wcs_id?: string | null
          notify_callback_reminder?: boolean
          notify_low_stock_alert?: boolean
          notify_new_consultation?: boolean
          phone?: string
          revenue_target?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          csv_column_mapping?: Json | null
          email?: string
          ga_enabled?: boolean | null
          ga_tracking_id?: string | null
          hours_lunch?: string
          hours_saturday?: string
          hours_sunday?: string
          hours_weekday?: string
          id?: number
          kakao?: string
          name?: string
          naver_enabled?: boolean | null
          naver_wcs_id?: string | null
          notify_callback_reminder?: boolean
          notify_low_stock_alert?: boolean
          notify_new_consultation?: boolean
          phone?: string
          revenue_target?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          agree_privacy: boolean
          assignee: string | null
          availability: string | null
          budget_range: string | null
          created_at: string
          email: string | null
          followup_outcome: string | null
          id: string
          message: string | null
          name: string
          next_followup_at: string | null
          password: string | null
          phone: string
          preferred_date: string | null
          preferred_time: string | null
          procedure_tags: string[] | null
          source: string | null
          status: string
          treatment_type: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          agree_privacy?: boolean
          assignee?: string | null
          availability?: string | null
          budget_range?: string | null
          created_at?: string
          email?: string | null
          followup_outcome?: string | null
          id?: string
          message?: string | null
          name: string
          next_followup_at?: string | null
          password?: string | null
          phone: string
          preferred_date?: string | null
          preferred_time?: string | null
          procedure_tags?: string[] | null
          source?: string | null
          status?: string
          treatment_type: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          agree_privacy?: boolean
          assignee?: string | null
          availability?: string | null
          budget_range?: string | null
          created_at?: string
          email?: string | null
          followup_outcome?: string | null
          id?: string
          message?: string | null
          name?: string
          next_followup_at?: string | null
          password?: string | null
          phone?: string
          preferred_date?: string | null
          preferred_time?: string | null
          procedure_tags?: string[] | null
          source?: string | null
          status?: string
          treatment_type?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      consultation_timeline: {
        Row: {
          actor: string | null
          consultation_id: string
          created_at: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          actor?: string | null
          consultation_id: string
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          actor?: string | null
          consultation_id?: string
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_timeline_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      device_shot_logs: {
        Row: {
          chart_number: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          patient_name: string | null
          procedure_area: string | null
          shots_used: number
          tip_id: string
        }
        Insert: {
          chart_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          patient_name?: string | null
          procedure_area?: string | null
          shots_used: number
          tip_id: string
        }
        Update: {
          chart_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          patient_name?: string | null
          procedure_area?: string | null
          shots_used?: number
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_shot_logs_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "device_tip_shots"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tip_shots: {
        Row: {
          device_type: string
          exhausted_at: string | null
          id: string
          initial_shots: number
          is_active: boolean
          item_id: string
          registered_at: string
          remaining_shots: number
          tip_type: string
        }
        Insert: {
          device_type: string
          exhausted_at?: string | null
          id?: string
          initial_shots: number
          is_active?: boolean
          item_id: string
          registered_at?: string
          remaining_shots: number
          tip_type: string
        }
        Update: {
          device_type?: string
          exhausted_at?: string | null
          id?: string
          initial_shots?: number
          is_active?: boolean
          item_id?: string
          registered_at?: string
          remaining_shots?: number
          tip_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tip_shots_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          description_en: string
          description_ja: string
          description_ko: string
          description_zh: string
          end_date: string
          featured: boolean
          gallery_images: string[]
          gallery_images_en: string[]
          gallery_images_ja: string[]
          gallery_images_zh: string[]
          id: string
          is_published: boolean
          poster_image: string | null
          poster_image_en: string | null
          poster_image_ja: string | null
          poster_image_zh: string | null
          related_treatments: string[]
          slug: string
          sort_order: number
          start_date: string
          thumbnail_image: string | null
          title_en: string
          title_ja: string
          title_ko: string
          title_zh: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string
          description_ja?: string
          description_ko?: string
          description_zh?: string
          end_date: string
          featured?: boolean
          gallery_images?: string[]
          gallery_images_en?: string[]
          gallery_images_ja?: string[]
          gallery_images_zh?: string[]
          id?: string
          is_published?: boolean
          poster_image?: string | null
          poster_image_en?: string | null
          poster_image_ja?: string | null
          poster_image_zh?: string | null
          related_treatments?: string[]
          slug: string
          sort_order?: number
          start_date: string
          thumbnail_image?: string | null
          title_en?: string
          title_ja?: string
          title_ko: string
          title_zh?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string
          description_ja?: string
          description_ko?: string
          description_zh?: string
          end_date?: string
          featured?: boolean
          gallery_images?: string[]
          gallery_images_en?: string[]
          gallery_images_ja?: string[]
          gallery_images_zh?: string[]
          id?: string
          is_published?: boolean
          poster_image?: string | null
          poster_image_en?: string | null
          poster_image_ja?: string | null
          poster_image_zh?: string | null
          related_treatments?: string[]
          slug?: string
          sort_order?: number
          start_date?: string
          thumbnail_image?: string | null
          title_en?: string
          title_ja?: string
          title_ko?: string
          title_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_batches: {
        Row: {
          batch_quantity: number
          created_at: string
          expiry_date: string | null
          id: string
          item_id: string
          note: string | null
          received_at: string
          remaining_quantity: number
        }
        Insert: {
          batch_quantity: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_id: string
          note?: string | null
          received_at?: string
          remaining_quantity?: number
        }
        Update: {
          batch_quantity?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          item_id?: string
          note?: string | null
          received_at?: string
          remaining_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          count_type: string
          counted_at: string
          counted_by: string | null
          counted_qty: number
          difference: number | null
          id: string
          item_id: string
          system_qty: number
        }
        Insert: {
          count_type?: string
          counted_at?: string
          counted_by?: string | null
          counted_qty: number
          difference?: number | null
          id?: string
          item_id: string
          system_qty: number
        }
        Update: {
          count_type?: string
          counted_at?: string
          counted_by?: string | null
          counted_qty?: number
          difference?: number | null
          id?: string
          item_id?: string
          system_qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          is_refrigerated: boolean
          min_stock: number
          name: string
          specification: string | null
          storage_note: string | null
          sub_category: string | null
          supplier: string | null
          unit: string
          unit_price: number
          updated_at: string
          volume_cc: number | null
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          is_refrigerated?: boolean
          min_stock?: number
          name: string
          specification?: string | null
          storage_note?: string | null
          sub_category?: string | null
          supplier?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          volume_cc?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          is_refrigerated?: boolean
          min_stock?: number
          name?: string
          specification?: string | null
          storage_note?: string | null
          sub_category?: string | null
          supplier?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
          volume_cc?: number | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          chart_number: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          note: string | null
          patient_name: string | null
          quantity: number
          tx_type: string
        }
        Insert: {
          chart_number?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          note?: string | null
          patient_name?: string | null
          quantity: number
          tx_type: string
        }
        Update: {
          chart_number?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          note?: string | null
          patient_name?: string | null
          quantity?: number
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          channel: string
          error_message: string | null
          fallback_channel: string | null
          id: string
          notes: string | null
          patient_treatment_id: string
          sent_at: string
          sent_by: string
          solapi_message_id: string | null
          solapi_status: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          channel?: string
          error_message?: string | null
          fallback_channel?: string | null
          id?: string
          notes?: string | null
          patient_treatment_id: string
          sent_at?: string
          sent_by: string
          solapi_message_id?: string | null
          solapi_status?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          channel?: string
          error_message?: string | null
          fallback_channel?: string | null
          id?: string
          notes?: string | null
          patient_treatment_id?: string
          sent_at?: string
          sent_by?: string
          solapi_message_id?: string | null
          solapi_status?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_patient_treatment_id_fkey"
            columns: ["patient_treatment_id"]
            isOneToOne: false
            referencedRelation: "patient_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          message: string
          template_type: string
          title: string
          treatment_name: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message: string
          template_type?: string
          title: string
          treatment_name: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          message?: string
          template_type?: string
          title?: string
          treatment_name?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      operation_cases: {
        Row: {
          actual_start: string | null
          created_at: string
          discount_krw: number | null
          doctor: string
          expected_duration_min: number | null
          id: string
          import_batch_id: string | null
          import_source: string | null
          location: string
          memo: string | null
          parent_case_id: string | null
          patient_name: string
          payment_method: string | null
          payment_status: string | null
          phone_number: string | null
          price_krw: number | null
          procedure_name: string
          room_id: string
          status: string
          treatment_type: string
          updated_at: string
        }
        Insert: {
          actual_start?: string | null
          created_at?: string
          discount_krw?: number | null
          doctor?: string
          expected_duration_min?: number | null
          id?: string
          import_batch_id?: string | null
          import_source?: string | null
          location?: string
          memo?: string | null
          parent_case_id?: string | null
          patient_name: string
          payment_method?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_krw?: number | null
          procedure_name?: string
          room_id: string
          status?: string
          treatment_type?: string
          updated_at?: string
        }
        Update: {
          actual_start?: string | null
          created_at?: string
          discount_krw?: number | null
          doctor?: string
          expected_duration_min?: number | null
          id?: string
          import_batch_id?: string | null
          import_source?: string | null
          location?: string
          memo?: string | null
          parent_case_id?: string | null
          patient_name?: string
          payment_method?: string | null
          payment_status?: string | null
          phone_number?: string | null
          price_krw?: number | null
          procedure_name?: string
          room_id?: string
          status?: string
          treatment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_cases_parent_case_id_fkey"
            columns: ["parent_case_id"]
            isOneToOne: false
            referencedRelation: "operation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_treatments: {
        Row: {
          auto_send: boolean | null
          created_at: string
          doctor: string | null
          id: string
          next_notification_at: string | null
          notes: string | null
          notification_cycle_days: number | null
          notification_sent: boolean | null
          patient_name: string
          phone: string
          treated_at: string
          treatment_category: string | null
          treatment_name: string
          updated_at: string
        }
        Insert: {
          auto_send?: boolean | null
          created_at?: string
          doctor?: string | null
          id?: string
          next_notification_at?: string | null
          notes?: string | null
          notification_cycle_days?: number | null
          notification_sent?: boolean | null
          patient_name: string
          phone: string
          treated_at?: string
          treatment_category?: string | null
          treatment_name: string
          updated_at?: string
        }
        Update: {
          auto_send?: boolean | null
          created_at?: string
          doctor?: string | null
          id?: string
          next_notification_at?: string | null
          notes?: string | null
          notification_cycle_days?: number | null
          notification_sent?: boolean | null
          patient_name?: string
          phone?: string
          treated_at?: string
          treatment_category?: string | null
          treatment_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inflow_leads: {
        Row: {
          agency: string | null
          campaign_id: string | null
          channel: string
          channel_category: string | null
          channel_detail: string | null
          classified_at: string | null
          consultation_id: string | null
          contact_date: string
          created_at: string
          id: string
          is_returning: boolean
          kakao_id: string | null
          manager: string | null
          name: string | null
          note: string | null
          outcome: string | null
          paid: boolean
          paid_amount_krw: number | null
          paid_date: string | null
          patient_origin: string | null
          phone: string | null
          reserved: boolean
          reserved_date: string | null
          treatment: string | null
          treatment_tags: string[]
          updated_at: string
          visited: boolean
          visited_date: string | null
          wechat_id: string | null
        }
        Insert: {
          agency?: string | null
          campaign_id?: string | null
          channel?: string
          channel_category?: string | null
          channel_detail?: string | null
          classified_at?: string | null
          consultation_id?: string | null
          contact_date?: string
          created_at?: string
          id?: string
          is_returning?: boolean
          kakao_id?: string | null
          manager?: string | null
          name?: string | null
          note?: string | null
          outcome?: string | null
          paid?: boolean
          paid_amount_krw?: number | null
          paid_date?: string | null
          patient_origin?: string | null
          phone?: string | null
          reserved?: boolean
          reserved_date?: string | null
          treatment?: string | null
          treatment_tags?: string[]
          updated_at?: string
          visited?: boolean
          visited_date?: string | null
          wechat_id?: string | null
        }
        Update: {
          agency?: string | null
          campaign_id?: string | null
          channel?: string
          channel_category?: string | null
          channel_detail?: string | null
          classified_at?: string | null
          consultation_id?: string | null
          contact_date?: string
          created_at?: string
          id?: string
          is_returning?: boolean
          kakao_id?: string | null
          manager?: string | null
          name?: string | null
          note?: string | null
          outcome?: string | null
          paid?: boolean
          paid_amount_krw?: number | null
          paid_date?: string | null
          patient_origin?: string | null
          phone?: string | null
          reserved?: boolean
          reserved_date?: string | null
          treatment?: string | null
          treatment_tags?: string[]
          updated_at?: string
          visited?: boolean
          visited_date?: string | null
          wechat_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inflow_leads_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "consultation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inflow_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_content_links: {
        Row: {
          attribution: string
          content_id: string
          created_at: string
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          attribution?: string
          content_id: string
          created_at?: string
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          attribution?: string
          content_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_content_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "marketing_contents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_content_links_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "inflow_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          channel_category: string | null
          channel_detail: string | null
          code: string | null
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          note: string | null
          spend_krw: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          channel_category?: string | null
          channel_detail?: string | null
          code?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          spend_krw?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          channel_category?: string | null
          channel_detail?: string | null
          code?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          spend_krw?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      marketing_contents: {
        Row: {
          campaign_id: string | null
          code: string | null
          comment_count: number | null
          content_type: string | null
          created_at: string
          id: string
          inquiry_count: number | null
          manager: string | null
          note: string | null
          platform: string
          posted_at: string
          save_count: number | null
          share_count: number | null
          title: string
          updated_at: string
          url: string | null
          view_count: number | null
        }
        Insert: {
          campaign_id?: string | null
          code?: string | null
          comment_count?: number | null
          content_type?: string | null
          created_at?: string
          id?: string
          inquiry_count?: number | null
          manager?: string | null
          note?: string | null
          platform?: string
          posted_at?: string
          save_count?: number | null
          share_count?: number | null
          title: string
          updated_at?: string
          url?: string | null
          view_count?: number | null
        }
        Update: {
          campaign_id?: string | null
          code?: string | null
          comment_count?: number | null
          content_type?: string | null
          created_at?: string
          id?: string
          inquiry_count?: number | null
          manager?: string | null
          note?: string | null
          platform?: string
          posted_at?: string
          save_count?: number | null
          share_count?: number | null
          title?: string
          updated_at?: string
          url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_contents_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      popups: {
        Row: {
          created_at: string
          display_end: string
          display_start: string
          id: string
          image_url: string | null
          image_url_en: string | null
          image_url_ja: string | null
          image_url_zh: string | null
          is_active: boolean
          link_target: string
          link_url: string
          rolling_interval_ms: number
          show_on_mobile: boolean
          sort_order: number
          title: string
          updated_at: string
          width: number
        }
        Insert: {
          created_at?: string
          display_end: string
          display_start: string
          id?: string
          image_url?: string | null
          image_url_en?: string | null
          image_url_ja?: string | null
          image_url_zh?: string | null
          is_active?: boolean
          link_target?: string
          link_url?: string
          rolling_interval_ms?: number
          show_on_mobile?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          width?: number
        }
        Update: {
          created_at?: string
          display_end?: string
          display_start?: string
          id?: string
          image_url?: string | null
          image_url_en?: string | null
          image_url_ja?: string | null
          image_url_zh?: string | null
          is_active?: boolean
          link_target?: string
          link_url?: string
          rolling_interval_ms?: number
          show_on_mobile?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      procedure_recipes: {
        Row: {
          default_qty: number
          id: string
          item_id: string
          note: string | null
          procedure_name: string
        }
        Insert: {
          default_qty?: number
          id?: string
          item_id: string
          note?: string | null
          procedure_name: string
        }
        Update: {
          default_qty?: number
          id?: string
          item_id?: string
          note?: string | null
          procedure_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedure_recipes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_consultations: {
        Row: {
          agree_privacy: boolean
          created_at: string
          id: string
          name: string
          phone: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agree_privacy?: boolean
          created_at?: string
          id?: string
          name: string
          phone: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agree_privacy?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          position: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          position?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      treatment_masters: {
        Row: {
          category: string
          created_at: string
          default_cycle_days: number | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          notification_template_id: string | null
          price_range: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_cycle_days?: number | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_template_id?: string | null
          price_range?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_cycle_days?: number | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_template_id?: string | null
          price_range?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_inventory_item: { Args: { p_data: Json }; Returns: Json }
      create_procedure_recipe: {
        Args: {
          p_default_qty?: number
          p_item_id: string
          p_note?: string
          p_procedure_name: string
        }
        Returns: Json
      }
      get_inventory_items: {
        Args: {
          p_category?: string
          p_search?: string
          p_show_inactive?: boolean
          p_stock_status?: string
        }
        Returns: Json
      }
      get_inventory_stats: { Args: never; Returns: Json }
      get_inventory_transactions: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_item_id?: string
          p_limit?: number
          p_offset?: number
          p_type?: string
        }
        Returns: Json
      }
      get_procedure_recipes: { Args: { p_procedure?: string }; Returns: Json }
      restock_inventory_item: {
        Args: {
          p_created_by?: string
          p_item_id: string
          p_note?: string
          p_quantity: number
        }
        Returns: string
      }
      soft_delete_inventory_item: { Args: { p_id: string }; Returns: Json }
      update_inventory_item_by_id: {
        Args: { p_data: Json; p_id: string }
        Returns: Json
      }
      use_device_shots: {
        Args: {
          p_chart_number?: string
          p_created_by?: string
          p_note?: string
          p_patient_name?: string
          p_procedure_area?: string
          p_shots_used: number
          p_tip_id: string
        }
        Returns: string
      }
      use_inventory_item: {
        Args: {
          p_chart_number?: string
          p_confirmed_by?: string
          p_created_by?: string
          p_item_id: string
          p_note?: string
          p_patient_name?: string
          p_quantity: number
        }
        Returns: string
      }
    }
    Enums: {
      case_location_enum: "ROOM" | "LOUNGE" | "OTHER"
      case_status_enum: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      treatment_type_enum: "CONSULT" | "SKINCARE" | "ANESTHESIA" | "PROCEDURE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      case_location_enum: ["ROOM", "LOUNGE", "OTHER"],
      case_status_enum: ["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      treatment_type_enum: ["CONSULT", "SKINCARE", "ANESTHESIA", "PROCEDURE"],
    },
  },
} as const
