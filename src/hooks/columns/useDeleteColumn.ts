"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { columnKeys } from "@/hooks/columns/useCreateColumn";
import { useApi } from "@/hooks/utils/useApi";

interface DeleteColumnParams {
  id: string;
  tableId: string;
}

export const useDeleteColumn = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteColumnParams): Promise<void> => {
      await api.delete(`/api/column/delete?id=${id}`);
    },
    onSuccess: (_, variables) => {
      // 컬럼 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: columnKeys.list(variables.tableId) 
      });
    },
  });
};