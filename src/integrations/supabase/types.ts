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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          created_at: string
          follower_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook: {
        Row: {
          author_name: string
          created_at: string
          id: string
          message: string
          profile_id: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          message: string
          profile_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string
          uses_remaining: number
        }
        Insert: {
          code: string
          created_at?: string
          uses_remaining?: number
        }
        Update: {
          code?: string
          created_at?: string
          uses_remaining?: number
        }
        Relationships: []
      }
      links: {
        Row: {
          accent_color: string | null
          created_at: string
          icon: string | null
          id: string
          label: string
          profile_id: string
          sort_order: number
          url: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          profile_id: string
          sort_order?: number
          url: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          profile_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_signups: {
        Row: {
          created_at: string
          email: string
          handle: string
          invite_code: string
          password: string
        }
        Insert: {
          created_at?: string
          email: string
          handle: string
          invite_code: string
          password: string
        }
        Update: {
          created_at?: string
          email?: string
          handle?: string
          invite_code?: string
          password?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accent_color: string | null
          animated_bg: string
          avatar_shape: string
          avatar_url: string | null
          background_type: string
          background_url: string | null
          badges: string[]
          ban_reason: string | null
          banned: boolean
          bg_blur: number
          bio: string | null
          blur_amount: number
          card_opacity: number
          created_at: string
          cursor_trail: boolean
          cursor_url: string | null
          custom_css: string | null
          custom_title: string | null
          discord_id: string | null
          discord_username: string | null
          display_name: string | null
          effect: string
          emoji_rain: string | null
          font_family: string | null
          font_url: string | null
          for_sale: boolean
          glow_text: boolean
          handle: string
          hide_views: boolean
          id: string
          intro_enabled: boolean
          intro_text: string | null
          is_admin: boolean
          link_style: string
          music_url: string | null
          particle_density: number
          plan: string
          sale_price: number | null
          scanlines: boolean
          soft_banned: boolean
          text_align: string
          theme: string
          tilt_card: boolean
          uid: number | null
          unlocked_badges: string[]
          updated_at: string
          views: number
          visualizer: boolean
        }
        Insert: {
          accent_color?: string | null
          animated_bg?: string
          avatar_shape?: string
          avatar_url?: string | null
          background_type?: string
          background_url?: string | null
          badges?: string[]
          ban_reason?: string | null
          banned?: boolean
          bg_blur?: number
          bio?: string | null
          blur_amount?: number
          card_opacity?: number
          created_at?: string
          cursor_trail?: boolean
          cursor_url?: string | null
          custom_css?: string | null
          custom_title?: string | null
          discord_id?: string | null
          discord_username?: string | null
          display_name?: string | null
          effect?: string
          emoji_rain?: string | null
          font_family?: string | null
          font_url?: string | null
          for_sale?: boolean
          glow_text?: boolean
          handle: string
          hide_views?: boolean
          id: string
          intro_enabled?: boolean
          intro_text?: string | null
          is_admin?: boolean
          link_style?: string
          music_url?: string | null
          particle_density?: number
          plan?: string
          sale_price?: number | null
          scanlines?: boolean
          soft_banned?: boolean
          text_align?: string
          theme?: string
          tilt_card?: boolean
          uid?: number | null
          unlocked_badges?: string[]
          updated_at?: string
          views?: number
          visualizer?: boolean
        }
        Update: {
          accent_color?: string | null
          animated_bg?: string
          avatar_shape?: string
          avatar_url?: string | null
          background_type?: string
          background_url?: string | null
          badges?: string[]
          ban_reason?: string | null
          banned?: boolean
          bg_blur?: number
          bio?: string | null
          blur_amount?: number
          card_opacity?: number
          created_at?: string
          cursor_trail?: boolean
          cursor_url?: string | null
          custom_css?: string | null
          custom_title?: string | null
          discord_id?: string | null
          discord_username?: string | null
          display_name?: string | null
          effect?: string
          emoji_rain?: string | null
          font_family?: string | null
          font_url?: string | null
          for_sale?: boolean
          glow_text?: boolean
          handle?: string
          hide_views?: boolean
          id?: string
          intro_enabled?: boolean
          intro_text?: string | null
          is_admin?: boolean
          link_style?: string
          music_url?: string | null
          particle_density?: number
          plan?: string
          sale_price?: number | null
          scanlines?: boolean
          soft_banned?: boolean
          text_align?: string
          theme?: string
          tilt_card?: boolean
          uid?: number | null
          unlocked_badges?: string[]
          updated_at?: string
          views?: number
          visualizer?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_profile_views: {
        Args: { _amount: number; _handle: string }
        Returns: number
      }
      admin_change_handle: {
        Args: { _new: string; _old: string }
        Returns: boolean
      }
      admin_clear_bio: { Args: { _handle: string }; Returns: boolean }
      admin_create_invite: {
        Args: { _code?: string; _uses?: number }
        Returns: string
      }
      admin_delete_invite: { Args: { _code: string }; Returns: boolean }
      admin_delete_profile: { Args: { _handle: string }; Returns: boolean }
      admin_list_invites: {
        Args: never
        Returns: {
          code: string
          created_at: string
          uses_remaining: number
        }[]
      }
      admin_set_admin: {
        Args: { _admin: boolean; _handle: string }
        Returns: boolean
      }
      admin_set_badges: {
        Args: { _badges: string[]; _handle: string }
        Returns: boolean
      }
      admin_set_ban: {
        Args: {
          _handle: string
          _hard: boolean
          _reason: string
          _soft: boolean
        }
        Returns: boolean
      }
      admin_set_config: {
        Args: { _key: string; _value: string }
        Returns: boolean
      }
      admin_set_invite_uses: {
        Args: { _code: string; _uses: number }
        Returns: boolean
      }
      admin_set_plan: {
        Args: { _handle: string; _plan: string }
        Returns: boolean
      }
      admin_set_sale: {
        Args: { _for_sale: boolean; _handle: string; _price: number }
        Returns: boolean
      }
      admin_set_uid: {
        Args: { _handle: string; _uid: number }
        Returns: boolean
      }
      admin_set_unlocked_badges: {
        Args: { _badges: string[]; _handle: string }
        Returns: boolean
      }
      admin_set_views: {
        Args: { _handle: string; _views: number }
        Returns: boolean
      }
      admin_wipe_customization: { Args: { _handle: string }; Returns: boolean }
      change_my_handle: { Args: { _new: string }; Returns: string }
      current_user_is_admin: { Args: never; Returns: boolean }
      grant_admin: {
        Args: { _handle: string; _password: string }
        Returns: boolean
      }
      increment_profile_views: { Args: { _handle: string }; Returns: undefined }
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
