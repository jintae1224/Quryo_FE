import { DatabaseType } from "@/types/database";

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