"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { ColumnBulkCreateRequest, ColumnData, ColumnRequest } from "@/types/column";

export const columnKeys = {
  all: ["columns"] as const,
  lists: () => [...columnKeys.all, "list"] as const,
  list: (tableId: string) => [...columnKeys.lists(), tableId] as const,
};

export const useCreateColumn = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: ColumnRequest | ColumnBulkCreateRequest
    ): Promise<ColumnData | ColumnData[]> => {
      const response = await api.post<ColumnData | ColumnData[]>(
        "/api/column/create",
        data
      );
      return response!;
    },
    retry: false, // 무한 재시도 방지
    onSuccess: (_, variables) => {
      // 테이블의 컬럼 목록 캐시 무효화
      const tableId = 'columns' in variables 
        ? variables.table_id 
        : variables.table_id;
      
      queryClient.invalidateQueries({ 
        queryKey: columnKeys.list(tableId) 
      });
    },
    onError: (error) => {
      console.error("컬럼 생성 실패:", error);
    },
  });
};