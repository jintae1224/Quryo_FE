export interface ColumnData {
  id: string;
  column_name: string;
  data_type: string;
  column_order: number;
  description: string | null;
  is_nullable: boolean | null;
  is_primary_key: boolean | null;
  default_value: string | null;
  table_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ColumnRequest {
  column_name: string;
  data_type: string;
  column_order?: number;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  default_value?: string;
  table_id: string;
}

export interface ColumnUpdateRequest {
  column_name?: string;
  data_type?: string;
  column_order?: number;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  default_value?: string;
}

export interface ColumnListParams {
  table_id: string;
}

export interface ColumnBulkCreateRequest {
  columns: Omit<ColumnRequest, "table_id">[];
  table_id: string;
}