"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { columnKeys } from "@/hooks/columns/useCreateColumn";
import { useApi } from "@/hooks/utils/useApi";
import { ColumnData, ColumnUpdateRequest } from "@/types/column";

interface UpdateColumnParams {
  id: string;
  tableId: string;
  data: ColumnUpdateRequest;
}

export const useUpdateColumn = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateColumnParams): Promise<ColumnData> => {
      const response = await api.put<ColumnData>(
        `/api/column/update?id=${id}`,
        data
      );
      return response!;
    },
    onSuccess: (_, variables) => {
      // 컬럼 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: columnKeys.list(variables.tableId) 
      });
    },
  });
};