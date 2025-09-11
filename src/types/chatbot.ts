export interface ChatBotRequest {
  project_id: string;
  query: string;
  target_database: 'postgresql' | 'mysql' | 'sqlite';
}

export interface ChatBotStreamingResponse {
  stage: 'starting' | 'table_selection' | 'column_selection' | 'foreign_key_analysis' | 'sql_generation' | 'completed';
  message: string;
  data: TableSelectionData | ColumnSelectionData | ForeignKeyAnalysisData | SqlGenerationData | CompletedData;
  timestamp: number;
  progress: number;
}

export interface SelectedTable {
  table_name: string;
  table_id: string;
  reason: string;
  confidence: number;
  description: string;
  priority: number;
}

export interface SelectedColumn {
  table_name: string;
  column_name: string;
  column_id: string;
  usage_type: string;
  confidence: number;
  data_type: string;
  description: string;
}

export interface ForeignKeyRelationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  constraint_name: string;
}

export interface TableSelectionData {
  selected_tables: SelectedTable[];
  reasoning: string;
  confidence: number;
  query_complexity: string;
}

export interface ColumnSelectionData {
  selected_columns: SelectedColumn[];
  reasoning: string;
  confidence: number;
}

export interface ForeignKeyAnalysisData {
  foreign_key_relationships: ForeignKeyRelationship[];
  reasoning: string;
  confidence: number;
}

export interface SqlGenerationData {
  sql_query: string;
  explanation: string;
  confidence: number;
  warnings: string[];
}

export interface CompletedData {
  final_result: {
    sql_query: string;
    explanation: string;
    confidence: number;
    query_complexity: string;
    intermediate_steps: {
      table_selection: TableSelectionData & { processing_time: number };
      column_selection: ColumnSelectionData & { processing_time: number };
      foreign_key_analysis: ForeignKeyAnalysisData & { processing_time: number };
    };
    warnings: string[];
    total_processing_time: number;
  };
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingData?: ChatBotStreamingResponse;
  allStreamingData?: ChatBotStreamingResponse[]; // 모든 스트리밍 단계 저장
  finalData?: CompletedData; // 최종 완료 데이터
}