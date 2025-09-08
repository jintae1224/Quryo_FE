"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { TableDataListParams } from "@/types/tableData";

import { tableDataKeys } from "./useTableDataList";

interface DeleteTableDataVariables {
  rowId: string;
  tableId: string;
}

export const useDeleteTableData = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rowId }: DeleteTableDataVariables): Promise<void> => {
      await api.delete(`/api/table-data/delete?row_id=${rowId}`);
    },
    onSuccess: (_, variables) => {
      // 해당 테이블의 데이터 목록 캐시 무효화
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "tableData" &&
          query.queryKey[1] === "list" &&
          (query.queryKey[2] as TableDataListParams)?.table_id === variables.tableId,
      });

      // 통계 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: tableDataKeys.stat(variables.tableId),
      });
    },
  });
};
