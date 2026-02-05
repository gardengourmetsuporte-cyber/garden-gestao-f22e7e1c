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
      cash_closings: {
        Row: {
          cash_amount: number
          cash_difference: number | null
          created_at: string
          credit_amount: number
          date: string
          debit_amount: number
          delivery_amount: number
          expenses: Json | null
          financial_integrated: boolean
          id: string
          initial_cash: number
          meal_voucher_amount: number
          notes: string | null
          pix_amount: number
          receipt_url: string
          status: Database["public"]["Enums"]["cash_closing_status"]
          total_amount: number | null
          unit_name: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          cash_amount?: number
          cash_difference?: number | null
          created_at?: string
          credit_amount?: number
          date: string
          debit_amount?: number
          delivery_amount?: number
          expenses?: Json | null
          financial_integrated?: boolean
          id?: string
          initial_cash?: number
          meal_voucher_amount?: number
          notes?: string | null
          pix_amount?: number
          receipt_url: string
          status?: Database["public"]["Enums"]["cash_closing_status"]
          total_amount?: number | null
          unit_name?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          cash_amount?: number
          cash_difference?: number | null
          created_at?: string
          credit_amount?: number
          date?: string
          debit_amount?: number
          delivery_amount?: number
          expenses?: Json | null
          financial_integrated?: boolean
          id?: string
          initial_cash?: number
          meal_voucher_amount?: number
          notes?: string | null
          pix_amount?: number
          receipt_url?: string
          status?: Database["public"]["Enums"]["cash_closing_status"]
          total_amount?: number | null
          unit_name?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_completions: {
        Row: {
          awarded_points: boolean
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          completed_at: string
          completed_by: string
          date: string
          id: string
          item_id: string
          notes: string | null
        }
        Insert: {
          awarded_points?: boolean
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          completed_at?: string
          completed_by: string
          date?: string
          id?: string
          item_id: string
          notes?: string | null
        }
        Update: {
          awarded_points?: boolean
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          completed_at?: string
          completed_by?: string
          date?: string
          id?: string
          item_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_type: Database["public"]["Enums"]["checklist_type"]
          created_at: string
          deleted_at: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          subcategory_id: string
          updated_at: string
        }
        Insert: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          subcategory_id: string
          updated_at?: string
        }
        Update: {
          checklist_type?: Database["public"]["Enums"]["checklist_type"]
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          subcategory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "checklist_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_sectors: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      checklist_subcategories: {
        Row: {
          created_at: string
          id: string
          name: string
          sector_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sector_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sector_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_subcategories_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "checklist_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoices: {
        Row: {
          account_id: string
          close_date: string
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          notes: string | null
          paid_at: string | null
          paid_from_account_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          close_date: string
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          paid_from_account_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          close_date?: string
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
          paid_from_account_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoices_paid_from_account_id_fkey"
            columns: ["paid_from_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          balance: number
          color: string
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_budgets: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          month: number
          planned_amount: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          month: number
          planned_amount: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          month?: number
          planned_amount?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_system: boolean
          name: string
          parent_id: string | null
          sort_order: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name: string
          parent_id?: string | null
          sort_order?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_system?: boolean
          name?: string
          parent_id?: string | null
          sort_order?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category_id: string | null
          created_at: string
          credit_card_invoice_id: string | null
          date: string
          description: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_fixed: boolean
          is_paid: boolean
          is_recurring: boolean
          notes: string | null
          recurring_interval: string | null
          tags: string[] | null
          to_account_id: string | null
          total_installments: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          credit_card_invoice_id?: string | null
          date?: string
          description: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          total_installments?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          credit_card_invoice_id?: string | null
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_paid?: boolean
          is_recurring?: boolean
          notes?: string | null
          recurring_interval?: string | null
          tags?: string[] | null
          to_account_id?: string | null
          total_installments?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_credit_card_invoice_id_fkey"
            columns: ["credit_card_invoice_id"]
            isOneToOne: false
            referencedRelation: "credit_card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          current_stock: number
          id: string
          min_stock: number
          name: string
          recipe_unit_price: number | null
          recipe_unit_type: string | null
          supplier_id: string | null
          unit_price: number | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name: string
          recipe_unit_price?: number | null
          recipe_unit_type?: string | null
          supplier_id?: string | null
          unit_price?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name?: string
          recipe_unit_price?: number | null
          recipe_unit_type?: string | null
          supplier_id?: string | null
          unit_price?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          scheduled_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          scheduled_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          scheduled_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manager_tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          date: string
          due_date: string | null
          due_time: string | null
          id: string
          is_completed: boolean
          is_system_generated: boolean
          notes: string | null
          period: Database["public"]["Enums"]["day_period"]
          priority: Database["public"]["Enums"]["task_priority"]
          sort_order: number | null
          source_data: Json | null
          system_source: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean
          is_system_generated?: boolean
          notes?: string | null
          period?: Database["public"]["Enums"]["day_period"]
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number | null
          source_data?: Json | null
          system_source?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          is_completed?: boolean
          is_system_generated?: boolean
          notes?: string | null
          period?: Database["public"]["Enums"]["day_period"]
          priority?: Database["public"]["Enums"]["task_priority"]
          sort_order?: number | null
          source_data?: Json | null
          system_source?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          order_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          order_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
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
          created_by: string | null
          id: string
          notes: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_settings: {
        Row: {
          create_transaction: boolean
          created_at: string
          fee_percentage: number | null
          id: string
          is_active: boolean | null
          method_key: string
          method_name: string
          settlement_day_of_week: number | null
          settlement_days: number | null
          settlement_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          create_transaction?: boolean
          created_at?: string
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method_key: string
          method_name: string
          settlement_day_of_week?: number | null
          settlement_days?: number | null
          settlement_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          create_transaction?: boolean
          created_at?: string
          fee_percentage?: number | null
          id?: string
          is_active?: boolean | null
          method_key?: string
          method_name?: string
          settlement_day_of_week?: number | null
          settlement_days?: number | null
          settlement_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          quantity: number
          recipe_id: string
          sort_order: number | null
          source_recipe_id: string | null
          source_type: string
          total_cost: number
          unit_cost: number
          unit_type: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity: number
          recipe_id: string
          sort_order?: number | null
          source_recipe_id?: string | null
          source_type?: string
          total_cost?: number
          unit_cost?: number
          unit_type: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          quantity?: number
          recipe_id?: string
          sort_order?: number | null
          source_recipe_id?: string | null
          source_type?: string
          total_cost?: number
          unit_cost?: number
          unit_type?: Database["public"]["Enums"]["recipe_unit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_source_recipe_id_fkey"
            columns: ["source_recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          cost_per_portion: number
          cost_updated_at: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          preparation_notes: string | null
          total_cost: number
          updated_at: string
          yield_quantity: number
          yield_unit: string
        }
        Insert: {
          category_id?: string | null
          cost_per_portion?: number
          cost_updated_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          preparation_notes?: string | null
          total_cost?: number
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Update: {
          category_id?: string | null
          cost_per_portion?: number
          cost_updated_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          preparation_notes?: string | null
          total_cost?: number
          updated_at?: string
          yield_quantity?: number
          yield_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recipe_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          points_cost: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          points_cost: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          points_cost?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          points_spent: number
          product_id: string
          status: Database["public"]["Enums"]["reward_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent: number
          product_id: string
          status?: Database["public"]["Enums"]["reward_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          points_spent?: number
          product_id?: string
          status?: Database["public"]["Enums"]["reward_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "reward_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          quantity: number
          type: Database["public"]["Enums"]["movement_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          type: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          type?: Database["public"]["Enums"]["movement_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      task_categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          approved_by: string | null
          created_at: string
          day_off: number
          id: string
          month: number
          notes: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          day_off: number
          id?: string
          month: number
          notes?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          day_off?: number
          id?: string
          month?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "funcionario"
      cash_closing_status: "pending" | "approved" | "divergent"
      checklist_type: "abertura" | "fechamento" | "limpeza"
      day_period: "morning" | "afternoon" | "evening"
      movement_type: "entrada" | "saida"
      order_status: "draft" | "sent" | "received" | "cancelled"
      recipe_unit_type: "unidade" | "kg" | "g" | "litro" | "ml"
      reward_status: "pending" | "approved" | "delivered" | "cancelled"
      schedule_status: "pending" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high"
      transaction_type: "income" | "expense" | "transfer" | "credit_card"
      unit_type: "unidade" | "kg" | "litro"
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
      app_role: ["admin", "funcionario"],
      cash_closing_status: ["pending", "approved", "divergent"],
      checklist_type: ["abertura", "fechamento", "limpeza"],
      day_period: ["morning", "afternoon", "evening"],
      movement_type: ["entrada", "saida"],
      order_status: ["draft", "sent", "received", "cancelled"],
      recipe_unit_type: ["unidade", "kg", "g", "litro", "ml"],
      reward_status: ["pending", "approved", "delivered", "cancelled"],
      schedule_status: ["pending", "approved", "rejected"],
      task_priority: ["low", "medium", "high"],
      transaction_type: ["income", "expense", "transfer", "credit_card"],
      unit_type: ["unidade", "kg", "litro"],
    },
  },
} as const
