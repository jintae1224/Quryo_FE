"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/tables/useCreateTable";
import { useApi } from "@/hooks/utils/useApi";

interface DeleteTableParams {
  id: string;
  projectId: string;
}

export const useDeleteTable = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: DeleteTableParams): Promise<void> => {
      await api.delete(`/api/table/delete?id=${id}`);
    },
    onSuccess: (_, variables) => {
      // 테이블 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: tableKeys.list(variables.projectId) 
      });
      // 삭제된 테이블 상세 캐시 제거
      queryClient.removeQueries({ 
        queryKey: tableKeys.detail(variables.id) 
      });
    },
  });
};