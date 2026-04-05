export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          store_id: string;
          role: "admin" | "torrador" | "barista";
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          store_id: string;
          role: "admin" | "torrador" | "barista";
          full_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          role?: "admin" | "torrador" | "barista";
          full_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      green_coffee_lots: {
        Row: {
          id: string;
          store_id: string;
          origin_country: string;
          farm_producer: string | null;
          variety: string;
          process_method: string;
          quantity_kg: number;
          current_stock_kg: number;
          purchase_date: string;
          supplier: string | null;
          price_per_kg: number | null;
          notes: string | null;
          label_image_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          origin_country: string;
          farm_producer?: string | null;
          variety: string;
          process_method: string;
          quantity_kg: number;
          current_stock_kg: number;
          purchase_date: string;
          supplier?: string | null;
          price_per_kg?: number | null;
          notes?: string | null;
          label_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          origin_country?: string;
          farm_producer?: string | null;
          variety?: string;
          process_method?: string;
          quantity_kg?: number;
          current_stock_kg?: number;
          purchase_date?: string;
          supplier?: string | null;
          price_per_kg?: number | null;
          notes?: string | null;
          label_image_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roast_sessions: {
        Row: {
          id: string;
          store_id: string;
          green_coffee_lot_id: string;
          roast_date: string;
          input_weight_kg: number;
          output_weight_kg: number;
          loss_percentage: number;
          roast_level: "light" | "medium" | "medium-dark" | "dark";
          temperature_notes: string | null;
          roast_profile_notes: string | null;
          roasted_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          green_coffee_lot_id: string;
          roast_date?: string;
          input_weight_kg: number;
          output_weight_kg: number;
          roast_level: "light" | "medium" | "medium-dark" | "dark";
          temperature_notes?: string | null;
          roast_profile_notes?: string | null;
          roasted_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          green_coffee_lot_id?: string;
          roast_date?: string;
          input_weight_kg?: number;
          output_weight_kg?: number;
          roast_level?: "light" | "medium" | "medium-dark" | "dark";
          temperature_notes?: string | null;
          roast_profile_notes?: string | null;
          roasted_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      roasted_coffee_inventory: {
        Row: {
          id: string;
          store_id: string;
          roast_session_id: string;
          quantity_kg: number;
          current_stock_kg: number;
          roast_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          roast_session_id: string;
          quantity_kg: number;
          current_stock_kg: number;
          roast_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          roast_session_id?: string;
          quantity_kg?: number;
          current_stock_kg?: number;
          roast_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flavor_profiles: {
        Row: {
          id: string;
          roast_session_id: string;
          acidity: number | null;
          body: number | null;
          sweetness: number | null;
          bitterness: number | null;
          aftertaste: number | null;
          tasting_notes: string | null;
          sca_score: number | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          roast_session_id: string;
          acidity?: number | null;
          body?: number | null;
          sweetness?: number | null;
          bitterness?: number | null;
          aftertaste?: number | null;
          tasting_notes?: string | null;
          sca_score?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          roast_session_id?: string;
          acidity?: number | null;
          body?: number | null;
          sweetness?: number | null;
          bitterness?: number | null;
          aftertaste?: number | null;
          tasting_notes?: string | null;
          sca_score?: number | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          store_id: string;
          roast_session_id: string | null;
          green_coffee_lot_id: string | null;
          title: string;
          method: string;
          dose_grams: number | null;
          water_ml: number | null;
          temperature_celsius: number | null;
          brew_time_seconds: number | null;
          grind_size: string | null;
          instructions: string | null;
          is_shared: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          roast_session_id?: string | null;
          green_coffee_lot_id?: string | null;
          title: string;
          method: string;
          dose_grams?: number | null;
          water_ml?: number | null;
          temperature_celsius?: number | null;
          brew_time_seconds?: number | null;
          grind_size?: string | null;
          instructions?: string | null;
          is_shared?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          roast_session_id?: string | null;
          green_coffee_lot_id?: string | null;
          title?: string;
          method?: string;
          dose_grams?: number | null;
          water_ml?: number | null;
          temperature_celsius?: number | null;
          brew_time_seconds?: number | null;
          grind_size?: string | null;
          instructions?: string | null;
          is_shared?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_comments: {
        Row: {
          id: string;
          recipe_id: string;
          content: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          content: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          content?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_store_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
