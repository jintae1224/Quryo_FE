// 테이블 데이터 관리를 위한 타입 정의

// 테이블 행 데이터에서 사용할 수 있는 값 타입들
export type RowDataValue = string | number | boolean | null;

// 테이블 행 데이터 타입
export type RowData = Record<string, RowDataValue>;

export interface TableRowData {
  id: string;
  table_id: string;
  row_data: RowData;
  row_order: number;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface TableDataRequest {
  table_id: string;
  row_data: RowData;
  row_order?: number;
}

export interface TableDataUpdateRequest {
  row_data: RowData;
  row_order?: number;
}

export interface TableDataHistory {
  id: string;
  row_id: string | null;
  table_id: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  old_data: RowData | null;
  new_data: RowData | null;
  changed_by: string | null;
  changed_at: string | null;
}

export interface TableDataListParams {
  table_id: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  search?: string;
  filters?: Record<string, RowDataValue>;
}

export interface TableDataListResponse {
  rows: TableRowData[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface TableDataStats {
  table_id: string;
  table_name: string;
  project_name: string;
  total_rows: number;
  first_record_at: string | null;
  last_updated_at: string | null;
  contributors_count: number;
}

export interface TableDataValidationError {
  column_name: string;
  error_type:
    | "required"
    | "type_mismatch"
    | "constraint_violation"
    | "foreign_key_violation";
  message: string;
}

export interface TableDataValidationResult {
  is_valid: boolean;
  errors: TableDataValidationError[];
}

// 컬럼 정보와 함께 제공되는 확장된 데이터 타입
export interface TableDataWithSchema {
  row_id: string;
  row_data: RowData;
  created_at: string | null;
  updated_at: string | null;
  columns_info: Array<{
    column_name: string;
    data_type: string;
    is_nullable: boolean;
    is_primary_key: boolean;
  }>;
}

// 데이터 필터링을 위한 조건 타입들
export type DataFilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "greater_equal"
  | "less_equal"
  | "is_null"
  | "is_not_null";

export interface DataFilter {
  column_name: string;
  operator: DataFilterOperator;
  value: RowDataValue;
}

export interface TableDataSearchParams {
  table_id: string;
  filters: DataFilter[];
  search_query?: string;
  sort_column?: string;
  sort_direction?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// 데이터 내보내기를 위한 타입들
export type ExportFormat = "csv" | "json" | "excel";

export interface DataExportRequest {
  table_id: string;
  format: ExportFormat;
  filters?: DataFilter[];
  columns?: string[]; // 특정 컬럼만 내보내기
  include_headers?: boolean;
}

// 대량 데이터 삽입을 위한 타입들
export interface BulkDataInsertRequest {
  table_id: string;
  rows: RowData[];
  validate_data?: boolean;
  skip_errors?: boolean; // 에러가 있는 행은 건너뛰고 계속 진행
}

export interface BulkDataInsertResult {
  success_count: number;
  error_count: number;
  total_count: number;
  errors: Array<{
    row_index: number;
    errors: TableDataValidationError[];
  }>;
  inserted_ids: string[];
}
