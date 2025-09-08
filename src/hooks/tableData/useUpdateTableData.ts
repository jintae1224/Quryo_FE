"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import {
  TableDataListParams,
  TableDataUpdateRequest,
  TableRowData,
} from "@/types/tableData";

import { tableDataKeys } from "./useTableDataList";

interface UpdateTableDataVariables {
  rowId: string;
  tableId: string;
  data: TableDataUpdateRequest;
}

export const useUpdateTableData = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rowId,
      data,
    }: UpdateTableDataVariables): Promise<TableRowData> => {
      const response = await api.put<TableRowData>(
        `/api/table-data/update?row_id=${rowId}`,
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
            variables.tableId,
      });

      // 통계 캐시도 무효화
      queryClient.invalidateQueries({
        queryKey: tableDataKeys.stat(variables.tableId),
      });
    },
  });
};
