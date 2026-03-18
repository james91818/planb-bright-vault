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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          api_key: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          status: string
        }
        Insert: {
          api_key?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string
        }
        Update: {
          api_key?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          agent_id: string
          client_id: string | null
          color: string | null
          created_at: string
          description: string | null
          end_at: string
          id: string
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          client_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          created_at: string
          enabled: boolean
          icon_url: string | null
          id: string
          leverage_max: number
          market_days: number[] | null
          market_hours_end: string | null
          market_hours_start: string | null
          name: string
          symbol: string
          type: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          leverage_max?: number
          market_days?: number[] | null
          market_hours_end?: string | null
          market_hours_start?: string | null
          name: string
          symbol: string
          type?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          leverage_max?: number
          market_days?: number[] | null
          market_hours_end?: string | null
          market_hours_start?: string | null
          name?: string
          symbol?: string
          type?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          room_id: string
          sender_id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          room_id: string
          sender_id: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          room_id?: string
          sender_id?: string
          type?: string
        }
        Relationships: []
      }
      client_bank_details: {
        Row: {
          account_holder: string
          bank_name: string
          created_at: string
          iban: string
          id: string
          notes: string | null
          reference: string | null
          swift_bic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          notes?: string | null
          reference?: string | null
          swift_bic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          bank_name?: string
          created_at?: string
          iban?: string
          id?: string
          notes?: string | null
          reference?: string | null
          swift_bic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_bank_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_crypto_addresses: {
        Row: {
          address: string
          created_at: string
          currency: string
          id: string
          label: string | null
          network: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          currency: string
          id?: string
          label?: string | null
          network?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          currency?: string
          id?: string
          label?: string | null
          network?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_crypto_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copied_trades: {
        Row: {
          created_at: string | null
          id: string
          source_trade_id: string | null
          status: string | null
          subscription_id: string
          trade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_trade_id?: string | null
          status?: string | null
          subscription_id: string
          trade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          source_trade_id?: string | null
          status?: string | null
          subscription_id?: string
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copied_trades_source_trade_id_fkey"
            columns: ["source_trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copied_trades_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "copy_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copied_trades_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_subscriptions: {
        Row: {
          created_at: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean | null
          mode: string
          trader_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          mode?: string
          trader_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean | null
          mode?: string
          trader_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copy_subscriptions_trader_id_fkey"
            columns: ["trader_id"]
            isOneToOne: false
            referencedRelation: "copy_traders"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_traders: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          display_name: string
          followers_count: number | null
          id: string
          is_admin_managed: boolean | null
          is_visible: boolean | null
          total_pnl: number | null
          total_trades: number | null
          user_id: string | null
          win_rate: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          followers_count?: number | null
          id?: string
          is_admin_managed?: boolean | null
          is_visible?: boolean | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          followers_count?: number | null
          id?: string
          is_admin_managed?: boolean | null
          is_visible?: boolean | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id?: string | null
          win_rate?: number | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          processed_by: string | null
          proof_url: string | null
          status: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          processed_by?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          processed_by?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      lead_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_admin_post: boolean
          published_at: string
          source: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_post?: boolean
          published_at?: string
          source?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin_post?: boolean
          published_at?: string
          source?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          id: string
          key: string
          label: string
        }
        Insert: {
          category: string
          id?: string
          key: string
          label: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          asset_id: string
          created_at: string
          direction: string
          id: string
          target_price: number
          triggered: boolean
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          direction?: string
          id?: string
          target_price: number
          triggered?: boolean
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          direction?: string
          id?: string
          target_price?: number
          triggered?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      price_cache: {
        Row: {
          id: string
          price: number
          source: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          id?: string
          price: number
          source?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          id?: string
          price?: number
          source?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliate: string | null
          assigned_agent: string | null
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          first_deposit_at: string | null
          full_name: string | null
          funnel: string | null
          id: string
          is_lead: boolean | null
          kyc_status: string | null
          phone: string | null
          status: string | null
          two_factor_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          affiliate?: string | null
          assigned_agent?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_deposit_at?: string | null
          full_name?: string | null
          funnel?: string | null
          id: string
          is_lead?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          affiliate?: string | null
          assigned_agent?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_deposit_at?: string | null
          full_name?: string | null
          funnel?: string | null
          id?: string
          is_lead?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number | null
          created_at: string
          deposit_id: string | null
          id: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number | null
          created_at?: string
          deposit_id?: string | null
          id?: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number | null
          created_at?: string
          deposit_id?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      staking_plans: {
        Row: {
          apy: number
          asset: string
          created_at: string
          enabled: boolean
          id: string
          lock_period_days: number
          min_amount: number
          name: string
        }
        Insert: {
          apy: number
          asset: string
          created_at?: string
          enabled?: boolean
          id?: string
          lock_period_days: number
          min_amount?: number
          name: string
        }
        Update: {
          apy?: number
          asset?: string
          created_at?: string
          enabled?: boolean
          id?: string
          lock_period_days?: number
          min_amount?: number
          name?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
        }
        Insert: {
          team_id: string
          user_id: string
        }
        Update: {
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          is_default: boolean
          rating: number
          visible: boolean
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          rating?: number
          visible?: boolean
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          rating?: number
          visible?: boolean
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_overrides: {
        Row: {
          applied_by: string | null
          created_at: string
          id: string
          is_active: boolean
          override_mode: string
          target_value: number | null
          trade_id: string
          updated_at: string
        }
        Insert: {
          applied_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          override_mode?: string
          target_value?: number | null
          trade_id: string
          updated_at?: string
        }
        Update: {
          applied_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          override_mode?: string
          target_value?: number | null
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_overrides_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: true
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_id: string
          closed_at: string | null
          current_price: number | null
          direction: string
          entry_price: number
          id: string
          leverage: number
          opened_at: string
          order_type: string
          pnl: number | null
          size: number
          status: string
          stop_loss: number | null
          take_profit: number | null
          user_id: string
        }
        Insert: {
          asset_id: string
          closed_at?: string | null
          current_price?: number | null
          direction?: string
          entry_price: number
          id?: string
          leverage?: number
          opened_at?: string
          order_type?: string
          pnl?: number | null
          size: number
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          user_id: string
        }
        Update: {
          asset_id?: string
          closed_at?: string | null
          current_price?: number | null
          direction?: string
          entry_price?: number
          id?: string
          leverage?: number
          opened_at?: string
          order_type?: string
          pnl?: number | null
          size?: number
          status?: string
          stop_loss?: number | null
          take_profit?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stakes: {
        Row: {
          amount: number
          claimed: boolean | null
          id: string
          plan_id: string
          rewards_earned: number | null
          started_at: string
          unlocks_at: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed?: boolean | null
          id?: string
          plan_id: string
          rewards_earned?: number | null
          started_at?: string
          unlocks_at: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed?: boolean | null
          id?: string
          plan_id?: string
          rewards_earned?: number | null
          started_at?: string
          unlocks_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stakes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "staking_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string
          destination: string | null
          id: string
          method: string
          processed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          method?: string
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          method?: string
          processed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role_by_name: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
