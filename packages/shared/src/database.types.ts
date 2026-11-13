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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      addresses: {
        Row: {
          audio_path: string | null
          created_at: string
          floor_gate: string | null
          id: string
          label: string | null
          landmark_description: string | null
          location: unknown
          photo_path: string | null
          quartier: string | null
          updated_at: string
          user_id: string
          zone_id: number | null
        }
        Insert: {
          audio_path?: string | null
          created_at?: string
          floor_gate?: string | null
          id?: string
          label?: string | null
          landmark_description?: string | null
          location?: unknown
          photo_path?: string | null
          quartier?: string | null
          updated_at?: string
          user_id: string
          zone_id?: number | null
        }
        Update: {
          audio_path?: string | null
          created_at?: string
          floor_gate?: string | null
          id?: string
          label?: string | null
          landmark_description?: string | null
          location?: unknown
          photo_path?: string | null
          quartier?: string | null
          updated_at?: string
          user_id?: string
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_remittances: {
        Row: {
          amount: number
          courier_id: string
          created_at: string
          id: string
          remitted_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          courier_id: string
          created_at?: string
          id?: string
          remitted_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          courier_id?: string
          created_at?: string
          id?: string
          remitted_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_remittances_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          active: boolean
          created_at: string
          id: number
          name: string
          region: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          name: string
          region?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          name?: string
          region?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      courier_documents: {
        Row: {
          courier_id: string
          created_at: string
          doc_type: string
          file_path: string
          id: string
          status: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          courier_id: string
          created_at?: string
          doc_type: string
          file_path: string
          id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          courier_id?: string
          created_at?: string
          doc_type?: string
          file_path?: string
          id?: string
          status?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_documents_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_profiles: {
        Row: {
          availability: Database["public"]["Enums"]["courier_availability"]
          cash_in_hand: number
          cash_limit: number
          created_at: string
          deposit: number
          id: string
          last_location: unknown
          last_seen_at: string | null
          plate: string | null
          status: Database["public"]["Enums"]["courier_status"]
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["courier_availability"]
          cash_in_hand?: number
          cash_limit?: number
          created_at?: string
          deposit?: number
          id: string
          last_location?: unknown
          last_seen_at?: string | null
          plate?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["courier_availability"]
          cash_in_hand?: number
          cash_limit?: number
          created_at?: string
          deposit?: number
          id?: string
          last_location?: unknown
          last_seen_at?: string | null
          plate?: string | null
          status?: Database["public"]["Enums"]["courier_status"]
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courier_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courier_shifts: {
        Row: {
          courier_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          courier_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
        }
        Update: {
          courier_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courier_shifts_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_jobs: {
        Row: {
          assigned_at: string | null
          courier_id: string | null
          created_at: string
          delivered_at: string | null
          dropoff_photo_path: string | null
          id: string
          job_type: Database["public"]["Enums"]["delivery_job_type"]
          order_id: string | null
          otp_hash: string | null
          parcel_id: string | null
          payout: number
          picked_up_at: string | null
          pickup_photo_path: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          courier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dropoff_photo_path?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["delivery_job_type"]
          order_id?: string | null
          otp_hash?: string | null
          parcel_id?: string | null
          payout?: number
          picked_up_at?: string | null
          pickup_photo_path?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          courier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dropoff_photo_path?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["delivery_job_type"]
          order_id?: string | null
          otp_hash?: string | null
          parcel_id?: string | null
          payout?: number
          picked_up_at?: string | null
          pickup_photo_path?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_jobs_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_jobs_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          courier_id: string
          created_at: string
          expires_at: string
          id: string
          job_id: string
          responded_at: string | null
          response: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          courier_id: string
          created_at?: string
          expires_at: string
          id?: string
          job_id: string
          responded_at?: string | null
          response?: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          courier_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          job_id?: string
          responded_at?: string | null
          response?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "delivery_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string | null
          account_type: string
          created_at: string
          credit: number
          debit: number
          id: string
          reference: string | null
          transaction_id: string
        }
        Insert: {
          account_id?: string | null
          account_type: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          reference?: string | null
          transaction_id: string
        }
        Update: {
          account_id?: string | null
          account_type?: string
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          reference?: string | null
          transaction_id?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          position: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          position?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          position?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      option_groups: {
        Row: {
          created_at: string
          id: string
          item_id: string
          max_select: number
          min_select: number
          name: string
          required: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          max_select?: number
          min_select?: number
          name: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          max_select?: number
          min_select?: number
          name?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          created_at: string
          group_id: string
          id: string
          name: string
          price_delta: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          name: string
          price_delta?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          price_delta?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          menu_item_id: string | null
          name_snapshot: string
          options_snapshot: Json
          order_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          menu_item_id?: string | null
          name_snapshot: string
          options_snapshot?: Json
          order_id: string
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          menu_item_id?: string | null
          name_snapshot?: string
          options_snapshot?: Json
          order_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address_id: string | null
          delivery_fee: number
          discount_total: number
          id: string
          idempotency_key: string
          items_total: number
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          prep_minutes: number | null
          pricing_snapshot: Json
          refusal_reason: string | null
          restaurant_id: string | null
          service_fee: number
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          zone_from: number | null
          zone_to: number | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address_id?: string | null
          delivery_fee?: number
          discount_total?: number
          id?: string
          idempotency_key: string
          items_total?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          prep_minutes?: number | null
          pricing_snapshot?: Json
          refusal_reason?: string | null
          restaurant_id?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          zone_from?: number | null
          zone_to?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address_id?: string | null
          delivery_fee?: number
          discount_total?: number
          id?: string
          idempotency_key?: string
          items_total?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          prep_minutes?: number | null
          pricing_snapshot?: Json
          refusal_reason?: string | null
          restaurant_id?: string | null
          service_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          zone_from?: number | null
          zone_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_zone_from_fkey"
            columns: ["zone_from"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_zone_to_fkey"
            columns: ["zone_to"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      parcels: {
        Row: {
          category: string | null
          cod_amount: number
          created_at: string
          declared_value: number
          dropoff_address_id: string | null
          id: string
          idempotency_key: string
          otp_hash: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          pickup_address_id: string | null
          price: number
          pricing_snapshot: Json
          prohibited_ack: boolean
          recipient_name: string
          recipient_phone: string
          sender_id: string
          size: string | null
          status: Database["public"]["Enums"]["parcel_status"]
          tracking_token: string
          updated_at: string
          weight_kg: number | null
          zone_from: number | null
          zone_to: number | null
        }
        Insert: {
          category?: string | null
          cod_amount?: number
          created_at?: string
          declared_value?: number
          dropoff_address_id?: string | null
          id?: string
          idempotency_key: string
          otp_hash?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pickup_address_id?: string | null
          price?: number
          pricing_snapshot?: Json
          prohibited_ack?: boolean
          recipient_name: string
          recipient_phone: string
          sender_id: string
          size?: string | null
          status?: Database["public"]["Enums"]["parcel_status"]
          tracking_token?: string
          updated_at?: string
          weight_kg?: number | null
          zone_from?: number | null
          zone_to?: number | null
        }
        Update: {
          category?: string | null
          cod_amount?: number
          created_at?: string
          declared_value?: number
          dropoff_address_id?: string | null
          id?: string
          idempotency_key?: string
          otp_hash?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          pickup_address_id?: string | null
          price?: number
          pricing_snapshot?: Json
          prohibited_ack?: boolean
          recipient_name?: string
          recipient_phone?: string
          sender_id?: string
          size?: string | null
          status?: Database["public"]["Enums"]["parcel_status"]
          tracking_token?: string
          updated_at?: string
          weight_kg?: number | null
          zone_from?: number | null
          zone_to?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parcels_dropoff_address_id_fkey"
            columns: ["dropoff_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_pickup_address_id_fkey"
            columns: ["pickup_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_zone_from_fkey"
            columns: ["zone_from"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcels_zone_to_fkey"
            columns: ["zone_to"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          payment_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          payment_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          idempotency_key: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string | null
          parcel_id: string | null
          provider_ref: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          idempotency_key: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          parcel_id?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          idempotency_key?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string | null
          parcel_id?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          courier_id: string
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          courier_id: string
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          courier_id?: string
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "courier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          phone: string | null
          status: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
          status?: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
          status?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          promo_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          promo_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          promo_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_redemptions: number | null
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          max_redemptions?: number | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_redemptions?: number | null
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          parcel_id: string | null
          rated_user_id: string | null
          rater_id: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          parcel_id?: string | null
          rated_user_id?: string | null
          rater_id: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          parcel_id?: string | null
          rated_user_id?: string | null
          rater_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          id: string
          referred_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string | null
          parcel_id: string | null
          payment_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          parcel_id?: string | null
          payment_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          parcel_id?: string | null
          payment_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_parcel_id_fkey"
            columns: ["parcel_id"]
            isOneToOne: false
            referencedRelation: "parcels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_hours: {
        Row: {
          close_time: string
          created_at: string
          id: string
          open_time: string
          restaurant_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          close_time: string
          created_at?: string
          id?: string
          open_time: string
          restaurant_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          close_time?: string
          created_at?: string
          id?: string
          open_time?: string
          restaurant_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_hours_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          created_at: string
          id: string
          member_role: Database["public"]["Enums"]["app_role"]
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["app_role"]
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_role?: Database["public"]["Enums"]["app_role"]
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          city_id: number | null
          commission_rate: number
          commission_valid_from: string
          commission_valid_to: string | null
          consecutive_refusals: number
          created_at: string
          id: string
          location: unknown
          logo_path: string | null
          name: string
          owner_id: string | null
          paused_until: string | null
          phone: string | null
          prep_time_minutes: number
          rating_avg: number | null
          rating_count: number
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          updated_at: string
          zone_id: number | null
        }
        Insert: {
          address?: string | null
          city_id?: number | null
          commission_rate?: number
          commission_valid_from?: string
          commission_valid_to?: string | null
          consecutive_refusals?: number
          created_at?: string
          id?: string
          location?: unknown
          logo_path?: string | null
          name: string
          owner_id?: string | null
          paused_until?: string | null
          phone?: string | null
          prep_time_minutes?: number
          rating_avg?: number | null
          rating_count?: number
          slug: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
          zone_id?: number | null
        }
        Update: {
          address?: string | null
          city_id?: number | null
          commission_rate?: number
          commission_valid_from?: string
          commission_valid_to?: string | null
          consecutive_refusals?: number
          created_at?: string
          id?: string
          location?: unknown
          logo_path?: string | null
          name?: string
          owner_id?: string | null
          paused_until?: string | null
          phone?: string | null
          prep_time_minutes?: number
          rating_avg?: number | null
          rating_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["restaurant_status"]
          updated_at?: string
          zone_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sms_send_log: {
        Row: {
          created_at: string
          id: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          note: string | null
          position: unknown
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          note?: string | null
          position?: unknown
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          note?: string | null
          position?: unknown
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          author_id: string | null
          created_at: string
          event_type: string
          id: string
          message: string | null
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          message?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          city_id: number | null
          created_at: string
          id: string
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id?: number | null
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          city_id?: number | null
          created_at?: string
          id?: string
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_prices: {
        Row: {
          created_at: string
          from_zone: number
          id: string
          price: number
          service: Database["public"]["Enums"]["delivery_job_type"]
          to_zone: number
          updated_at: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          from_zone: number
          id?: string
          price: number
          service: Database["public"]["Enums"]["delivery_job_type"]
          to_zone: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          from_zone?: number
          id?: string
          price?: number
          service?: Database["public"]["Enums"]["delivery_job_type"]
          to_zone?: number
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_prices_from_zone_fkey"
            columns: ["from_zone"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_prices_to_zone_fkey"
            columns: ["to_zone"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_waitlist: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          note: string | null
          phone: string
          quartier: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          phone: string
          quartier?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          note?: string | null
          phone?: string
          quartier?: string | null
        }
        Relationships: []
      }
      zones: {
        Row: {
          active: boolean
          area: unknown
          city_id: number | null
          created_at: string
          hours: Json
          id: number
          name: string
          number: number
          services_active: string[]
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area?: unknown
          city_id?: number | null
          created_at?: string
          hours?: Json
          id: number
          name: string
          number: number
          services_active?: string[]
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area?: unknown
          city_id?: number | null
          created_at?: string
          hours?: Json
          id?: number
          name?: string
          number?: number
          services_active?: string[]
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_zone: { Args: { _lat: number; _lng: number }; Returns: number }
      current_courier_id: { Args: never; Returns: string }
      get_job_contact: {
        Args: { _job_id: string }
        Returns: {
          recipient_name: string
          recipient_phone: string
        }[]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_finance_admin: { Args: never; Returns: boolean }
      is_restaurant_member: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      is_restaurant_owner: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
      my_addresses: {
        Args: never
        Returns: {
          id: string
          label: string
          lat: number
          lng: number
          quartier: string
          zone_id: number
        }[]
      }
      resto_accept_order: {
        Args: { _order_id: string; _prep_minutes: number }
        Returns: undefined
      }
      resto_add_option: {
        Args: { _group_id: string; _name: string; _price_delta: number }
        Returns: string
      }
      resto_add_option_group: {
        Args: {
          _item_id: string
          _name: string
          _min_select: number
          _max_select: number
          _required: boolean
        }
        Returns: string
      }
      resto_add_staff: {
        Args: { _restaurant_id: string; _phone: string }
        Returns: string
      }
      resto_delete_option: { Args: { _option_id: string }; Returns: undefined }
      resto_delete_option_group: { Args: { _group_id: string }; Returns: undefined }
      resto_history: {
        Args: { _restaurant_id: string; _limit?: number }
        Returns: {
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          refusal_reason: string | null
          prep_minutes: number | null
          created_at: string
        }[]
      }
      resto_list_staff: {
        Args: { _restaurant_id: string }
        Returns: {
          user_id: string
          full_name: string | null
          phone: string | null
          member_role: Database["public"]["Enums"]["app_role"]
          created_at: string
        }[]
      }
      resto_my_restaurants: {
        Args: never
        Returns: {
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["restaurant_status"]
          paused_until: string | null
          is_owner: boolean
        }[]
      }
      resto_order_ready: { Args: { _order_id: string }; Returns: undefined }
      resto_queue: {
        Args: { _restaurant_id: string }
        Returns: {
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          prep_minutes: number | null
          created_at: string
          items: Json
        }[]
      }
      resto_refuse_order: {
        Args: { _order_id: string; _reason: string }
        Returns: undefined
      }
      resto_remove_staff: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: undefined
      }
      resto_reports: {
        Args: { _restaurant_id: string; _from: string; _to: string }
        Returns: {
          orders_count: number
          gross_sales: number
          commission_total: number
          resto_payout: number
        }[]
      }
      resto_set_pause: {
        Args: { _restaurant_id: string; _minutes: number | null }
        Returns: string | null
      }
      resto_timeout_order: { Args: { _order_id: string }; Returns: undefined }
      resto_toggle_item: {
        Args: { _item_id: string; _available: boolean }
        Returns: undefined
      }
      track_parcel: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      app_role:
        | "client"
        | "courier"
        | "resto_owner"
        | "resto_staff"
        | "admin_super"
        | "admin_ops"
        | "admin_finance"
        | "admin_support"
        | "admin_sales"
        | "admin_auditor"
      courier_availability:
        | "HORS_LIGNE"
        | "EN_LIGNE_LIBRE"
        | "EN_MISSION"
        | "BLOQUE_CAISSE"
      courier_status:
        | "EN_ATTENTE"
        | "EN_REVUE"
        | "APPROUVE"
        | "REJETE"
        | "SUSPENDU"
      delivery_job_type: "food" | "parcel"
      order_status:
        | "EN_ATTENTE_PAIEMENT"
        | "ENVOYEE_RESTAURANT"
        | "ACCEPTEE"
        | "RECHERCHE_LIVREUR"
        | "LIVREUR_ASSIGNE"
        | "PRETE"
        | "RECUPEREE"
        | "ARRIVEE"
        | "LIVREE"
        | "TERMINEE"
        | "REFUSEE"
        | "ANNULEE"
        | "ECHEC"
      parcel_status:
        | "DEVIS"
        | "CONFIRMEE"
        | "RECHERCHE_LIVREUR"
        | "LIVREUR_ASSIGNE"
        | "EN_ROUTE_RETRAIT"
        | "ARRIVE_RETRAIT"
        | "RECUPERE"
        | "EN_ROUTE_LIVRAISON"
        | "ARRIVE"
        | "LIVRE"
        | "TERMINE"
        | "ECHEC_LIVRAISON"
        | "RETOUR"
        | "RETOURNE"
        | "ANNULEE"
      payment_method: "cash" | "wave" | "orange_money"
      restaurant_status:
        | "EN_ATTENTE"
        | "ACTIF"
        | "SUSPENDU"
        | "FERME"
        | "INACTIF"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: [
        "client",
        "courier",
        "resto_owner",
        "resto_staff",
        "admin_super",
        "admin_ops",
        "admin_finance",
        "admin_support",
        "admin_sales",
        "admin_auditor",
      ],
      courier_availability: [
        "HORS_LIGNE",
        "EN_LIGNE_LIBRE",
        "EN_MISSION",
        "BLOQUE_CAISSE",
      ],
      courier_status: [
        "EN_ATTENTE",
        "EN_REVUE",
        "APPROUVE",
        "REJETE",
        "SUSPENDU",
      ],
      delivery_job_type: ["food", "parcel"],
      order_status: [
        "EN_ATTENTE_PAIEMENT",
        "ENVOYEE_RESTAURANT",
        "ACCEPTEE",
        "RECHERCHE_LIVREUR",
        "LIVREUR_ASSIGNE",
        "PRETE",
        "RECUPEREE",
        "ARRIVEE",
        "LIVREE",
        "TERMINEE",
        "REFUSEE",
        "ANNULEE",
        "ECHEC",
      ],
      parcel_status: [
        "DEVIS",
        "CONFIRMEE",
        "RECHERCHE_LIVREUR",
        "LIVREUR_ASSIGNE",
        "EN_ROUTE_RETRAIT",
        "ARRIVE_RETRAIT",
        "RECUPERE",
        "EN_ROUTE_LIVRAISON",
        "ARRIVE",
        "LIVRE",
        "TERMINE",
        "ECHEC_LIVRAISON",
        "RETOUR",
        "RETOURNE",
        "ANNULEE",
      ],
      payment_method: ["cash", "wave", "orange_money"],
      restaurant_status: [
        "EN_ATTENTE",
        "ACTIF",
        "SUSPENDU",
        "FERME",
        "INACTIF",
      ],
    },
  },
} as const
