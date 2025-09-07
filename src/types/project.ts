import { DatabaseType } from "./database";

export interface ProjectData {
  id: string;
  project_name: string;
  description?: string;
  database_type: DatabaseType;
  user_email: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectRequest {
  project_name?: string;
  description?: string;
  database_type?: DatabaseType;
}
