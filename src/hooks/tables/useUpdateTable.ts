"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/tables/useCreateTable";
import { useApi } from "@/hooks/utils/useApi";
import { TableData, TableUpdateRequest } from "@/types/table";

interface UpdateTableParams {
  id: string;
  data: TableUpdateRequest;
}

export const useUpdateTable = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateTableParams): Promise<TableData> => {
      const response = await api.put<TableData>(
        `/api/table/update?id=${id}`,
        data
      );
      return response!;
    },
    onSuccess: (data) => {
      // 테이블 상세 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: tableKeys.detail(data.id) 
      });
      // 테이블 목록 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: tableKeys.list(data.project_id) 
      });
    },
  });
};