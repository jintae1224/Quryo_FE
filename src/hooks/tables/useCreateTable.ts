"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { TableData, TableRequest } from "@/types/table";

export const tableKeys = {
  all: ["tables"] as const,
  lists: () => [...tableKeys.all, "list"] as const,
  list: (projectId: string) => [...tableKeys.lists(), projectId] as const,
  details: () => [...tableKeys.all, "detail"] as const,
  detail: (id: string) => [...tableKeys.details(), id] as const,
};

export const useCreateTable = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TableRequest): Promise<TableData> => {
      const response = await api.post<TableData>("/api/table/create", data);
      return response!;
    },
    onSuccess: (data, variables) => {
      // 해당 프로젝트의 테이블 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: tableKeys.list(variables.project_id) 
      });
    },
  });
};