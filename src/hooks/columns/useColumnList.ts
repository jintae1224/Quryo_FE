"use client";

import { useQuery } from "@tanstack/react-query";

import { columnKeys } from "@/hooks/columns/useCreateColumn";
import { useApi } from "@/hooks/utils/useApi";
import { ColumnData } from "@/types/column";

export const useColumnList = (tableId: string | null) => {
  const api = useApi();

  return useQuery({
    queryKey: columnKeys.list(tableId || ""),
    queryFn: async () => {
      if (!tableId) return [];
      const response = await api.get<ColumnData[]>(
        `/api/column/list?table_id=${tableId}`
      );
      return response || [];
    },
    enabled: !!tableId,
  });
};