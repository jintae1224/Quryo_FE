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
  // Foreign Key fields
  is_foreign_key: boolean | null;
  foreign_table_id: string | null;
  foreign_column_id: string | null;
  foreign_key_constraint_name: string | null;
  on_delete_action: ForeignKeyAction | null;
  on_update_action: ForeignKeyAction | null;
  // Foreign Key reference names (for display)
  foreign_table_name?: string | null;
  foreign_column_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ForeignKeyAction = 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'NO_ACTION' | 'SET_DEFAULT';

export interface ColumnRequest {
  column_name: string;
  data_type: string;
  column_order?: number;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  default_value?: string;
  table_id: string;
  // Foreign Key fields
  is_foreign_key?: boolean;
  foreign_table_id?: string;
  foreign_column_id?: string;
  foreign_key_constraint_name?: string;
  on_delete_action?: ForeignKeyAction;
  on_update_action?: ForeignKeyAction;
}

export interface ColumnUpdateRequest {
  column_name?: string;
  data_type?: string;
  column_order?: number;
  description?: string;
  is_nullable?: boolean;
  is_primary_key?: boolean;
  default_value?: string;
  // Foreign Key fields
  is_foreign_key?: boolean;
  foreign_table_id?: string;
  foreign_column_id?: string;
  foreign_key_constraint_name?: string;
  on_delete_action?: ForeignKeyAction;
  on_update_action?: ForeignKeyAction;
}

export interface ColumnListParams {
  table_id: string;
}

export interface ColumnBulkCreateRequest {
  columns: Omit<ColumnRequest, "table_id">[];
  table_id: string;
}

// Foreign Key related types
export interface ForeignKeyReference {
  table_id: string;
  table_name: string;
  column_id: string;
  column_name: string;
  data_type: string;
}

export interface ForeignKeyOption {
  table_id: string;
  table_name: string;
  columns: {
    id: string;
    name: string;
    data_type: string;
    is_primary_key: boolean;
  }[];
}

export const FOREIGN_KEY_ACTIONS: { value: ForeignKeyAction; label: string; description: string }[] = [
  { 
    value: 'CASCADE', 
    label: 'CASCADE', 
    description: '참조된 행이 삭제/수정되면 이 행도 삭제/수정됩니다' 
  },
  { 
    value: 'RESTRICT', 
    label: 'RESTRICT', 
    description: '참조된 행이 삭제/수정되는 것을 방지합니다' 
  },
  { 
    value: 'SET_NULL', 
    label: 'SET NULL', 
    description: '참조된 행이 삭제/수정되면 이 컬럼을 NULL로 설정합니다' 
  },
  { 
    value: 'NO_ACTION', 
    label: 'NO ACTION', 
    description: '참조 무결성 검사를 트랜잭션 끝까지 지연합니다' 
  },
  { 
    value: 'SET_DEFAULT', 
    label: 'SET DEFAULT', 
    description: '참조된 행이 삭제/수정되면 이 컬럼을 기본값으로 설정합니다' 
  }
];