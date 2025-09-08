"use client";

import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { TableDataStats } from "@/types/tableData";

import { tableDataKeys } from "./useTableDataList";

export const useTableDataStats = (tableId: string) => {
  const api = useApi();

  return useQuery({
    queryKey: tableDataKeys.stat(tableId),
    queryFn: async () => {
      const response = await api.get<TableDataStats>(
        `/api/table-data/stats?table_id=${tableId}`
      );
      return response!;
    },
    enabled: !!tableId,
  });
};
