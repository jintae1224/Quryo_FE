"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import {
  TableDataListParams,
  TableDataRequest,
  TableRowData,
} from "@/types/tableData";

import { tableDataKeys } from "./useTableDataList";

export const useCreateTableData = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TableDataRequest): Promise<TableRowData> => {
      const response = await api.post<TableRowData>(
        "/api/table-data/create",
        data
      );
      return response!;
    },
    onSuccess: (data, variables) => {
      // 해당 테이블의 데이터 목록 캐시 무효화
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "tableData" &&
          query.queryKey[1] === "list" &&
          (query.queryKey[2] as TableDataListParams)?.table_id ===
            variables.table_id,
      });

      // 통계 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: tableDataKeys.stat(variables.table_id),
      });
    },
  });
};
