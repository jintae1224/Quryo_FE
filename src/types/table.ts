export interface TableData {
  id: string;
  table_name: string;
  description: string | null;
  project_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface TableRequest {
  table_name: string;
  description?: string;
  project_id: string;
}

export interface TableUpdateRequest {
  table_name?: string;
  description?: string;
}

export interface TableListParams {
  project_id: string;
}