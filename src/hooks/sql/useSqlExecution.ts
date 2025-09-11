"use client";

import { useMutation } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { ApiResponse } from "@/types/api";
import { SqlQueryRequest, SqlQueryResponse } from "@/types/sql";

export const useSqlExecution = () => {
  const api = useApi();

  return useMutation<SqlQueryResponse, Error, SqlQueryRequest>({
    mutationFn: async ({ projectId, query }: SqlQueryRequest) => {
      const response = await api.post("/api/sql/execute", {
        project_id: projectId,
        query,
      });
      return (response as ApiResponse<SqlQueryResponse>).data!;
    },
  });
};