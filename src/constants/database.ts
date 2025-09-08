import { ColumnRequest } from "@/types/column";
import { DatabaseType } from "@/types/database";
import { TableRequest } from "@/types/table";

export interface DatabaseOption {
  value: DatabaseType;
  label: string;
  color: string;
  description?: string;
}

export const DATABASES: DatabaseOption[] = [
  {
    value: "postgresql",
    label: "PostgreSQL",
    color: "#336791",
    description: "Advanced open source database with JSON support",
  },
  {
    value: "mysql",
    label: "MySQL",
    color: "#00758f",
    description: "Popular open source relational database",
  },
  {
    value: "sqlite",
    label: "SQLite",
    color: "#003b57",
    description: "Lightweight file-based database",
  },
  {
    value: "oracle",
    label: "Oracle",
    color: "#f80000",
    description: "Enterprise-grade database system",
  },
  {
    value: "sqlserver",
    label: "SQL Server",
    color: "#cc2927",
    description: "Microsoft's relational database system",
  },
];

export const DEFAULT_DATABASE: DatabaseType = "postgresql";

// 컬럼 데이터 타입 옵션
export const DATA_TYPES = [
  { value: "VARCHAR(255)", label: "VARCHAR(255)" },
  { value: "TEXT", label: "TEXT" },
  { value: "INT", label: "INTEGER" },
  { value: "BIGINT", label: "BIGINT" },
  { value: "DECIMAL(10,2)", label: "DECIMAL(10,2)" },
  { value: "BOOLEAN", label: "BOOLEAN" },
  { value: "DATE", label: "DATE" },
  { value: "DATETIME", label: "DATETIME" },
  { value: "TIMESTAMP", label: "TIMESTAMP" },
  { value: "JSON", label: "JSON" },
  { value: "UUID", label: "UUID" },
];

// 초기 컬럼 폼 데이터
export const INITIAL_COLUMN_FORM_DATA: Omit<ColumnRequest, 'table_id'> = {
  column_name: "",
  data_type: "",
  description: "",
  default_value: "",
  is_nullable: true,
  is_primary_key: false,
};

// 초기 테이블 폼 데이터
export const INITIAL_TABLE_FORM_DATA: Omit<TableRequest, 'project_id'> = {
  table_name: "",
  description: "",
};