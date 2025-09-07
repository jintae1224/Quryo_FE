export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
  error?: {
    code?: string;
    details?: unknown;
  };
}
