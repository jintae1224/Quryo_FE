import { DATABASES } from "@/constants/database";
import { DatabaseType } from "@/types/database";

export const getDatabaseColor = (dbType: DatabaseType | string) => {
  const database = DATABASES.find((db) => db.value === dbType);
  return database?.color || "#000000";
};

export const getDatabaseLabel = (dbType: DatabaseType | string) => {
  const database = DATABASES.find((db) => db.value === dbType);
  return database?.label || dbType;
};

export const getDatabaseDescription = (dbType: DatabaseType | string) => {
  const database = DATABASES.find((db) => db.value === dbType);
  return database?.description || "";
};

// CSS 클래스명을 위한 함수 (ProjectList에서 사용)
export const getDatabaseClassName = (dbType: DatabaseType | string) => {
  const classNames = {
    postgresql: "postgresql",
    mysql: "mysql",
    sqlite: "sqlite",
    oracle: "oracle",
    sqlserver: "sqlserver",
  } as const;

  return classNames[dbType as keyof typeof classNames] || "default";
};
