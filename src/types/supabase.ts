export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            accounts: {
                Row: {
                    balance: number | null
                    created_at: string | null
                    id: string
                    name: string
                    type: string
                    user_id: string
                }
                Insert: {
                    balance?: number | null
                    created_at?: string | null
                    id?: string
                    name: string
                    type: string
                    user_id: string
                }
                Update: {
                    balance?: number | null
                    created_at?: string | null
                    id?: string
                    name?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "accounts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            budgets: {
                Row: {
                    activity: number | null
                    assigned: number | null
                    available: number | null
                    category_id: string
                    id: string
                    month: string
                    user_id: string
                }
                Insert: {
                    activity?: number | null
                    assigned?: number | null
                    available?: number | null
                    category_id: string
                    id?: string
                    month: string
                    user_id: string
                }
                Update: {
                    activity?: number | null
                    assigned?: number | null
                    available?: number | null
                    category_id?: string
                    id?: string
                    month?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "budgets_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "budgets_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    created_at: string | null
                    group_id: string
                    id: string
                    name: string
                    target_amount: number | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    group_id: string
                    id?: string
                    name: string
                    target_amount?: number | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    group_id?: string
                    id?: string
                    name?: string
                    target_amount?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_group_id_fkey"
                        columns: ["group_id"]
                        isOneToOne: false
                        referencedRelation: "category_groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "categories_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            category_groups: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "category_groups_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            transactions: {
                Row: {
                    account_id: string | null
                    amount: number
                    category_id: string | null
                    cleared: boolean | null
                    created_at: string | null
                    date: string
                    id: string
                    memo: string | null
                    payee: string | null
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    amount: number
                    category_id?: string | null
                    cleared?: boolean | null
                    created_at?: string | null
                    date: string
                    id?: string
                    memo?: string | null
                    payee?: string | null
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    amount?: number
                    category_id?: string | null
                    cleared?: boolean | null
                    created_at?: string | null
                    date?: string
                    id?: string
                    memo?: string | null
                    payee?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
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
