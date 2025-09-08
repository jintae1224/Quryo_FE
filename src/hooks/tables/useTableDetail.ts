"use client";

import { useQuery } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/tables/useCreateTable";
import { useApi } from "@/hooks/utils/useApi";
import { TableData } from "@/types/table";

export const useTableDetail = (tableId: string | null) => {
  const api = useApi();

  return useQuery({
    queryKey: tableKeys.detail(tableId || ""),
    queryFn: async () => {
      if (!tableId) return null;
      const response = await api.get<TableData>(
        `/api/table/detail?id=${tableId}`
      );
      return response;
    },
    enabled: !!tableId,
  });
};