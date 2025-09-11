export interface SqlQueryRequest {
  projectId: string;
  query: string;
}

export interface SqlQueryResponse {
  query: string;
  data: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
  affectedTables: string[];
}

export interface SqlQueryError {
  message: string;
  line?: number;
  position?: number;
  code?: string;
}

// SQL 파싱 관련 타입
export interface ParsedSqlQuery {
  type: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "UNKNOWN";
  tables: string[];
  columns: string[];
  conditions: ParsedCondition[];
  joins?: ParsedJoin[];
  orderBy?: ParsedOrderBy[];
  groupBy?: string[];
  having?: ParsedCondition[];
  limit?: number;
  offset?: number;
  aggregates?: ParsedAggregate[];
  tableAliases?: Map<string, string>; // 별칭 -> 실제 테이블명 매핑
  isValid: boolean;
  error?: string;
}

export interface ParsedCondition {
  column: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE" | "IN" | "IS NULL" | "IS NOT NULL";
  value: unknown;
  table?: string;
  logicalOperator?: "AND" | "OR";
}

export interface ParsedJoin {
  type: "INNER" | "LEFT" | "RIGHT" | "FULL";
  table: string;
  alias?: string;
  on: {
    left: string;
    right: string;
    operator: string;
  };
}

export interface ParsedOrderBy {
  column: string;
  direction: "ASC" | "DESC";
  table?: string;
}

export interface ParsedAggregate {
  function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
  column: string;
  alias?: string;
}