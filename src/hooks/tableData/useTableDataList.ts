"use client";

import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { TableDataListParams, TableDataListResponse } from "@/types/tableData";

export const tableDataKeys = {
  all: ["tableData"] as const,
  lists: () => [...tableDataKeys.all, "list"] as const,
  list: (params: TableDataListParams) =>
    [...tableDataKeys.lists(), params] as const,
  stats: () => [...tableDataKeys.all, "stats"] as const,
  stat: (tableId: string) => [...tableDataKeys.stats(), tableId] as const,
};

export const useTableDataList = (params: TableDataListParams) => {
  const api = useApi();

  return useQuery({
    queryKey: tableDataKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append("table_id", params.table_id);

      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sort_by) searchParams.append("sort_by", params.sort_by);
      if (params.sort_order)
        searchParams.append("sort_order", params.sort_order);
      if (params.search) searchParams.append("search", params.search);

      // filters를 쿼리 파라미터로 변환 (필요한 경우)
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            searchParams.append(`filter_${key}`, value.toString());
          }
        });
      }

      const response = await api.get<TableDataListResponse>(
        `/api/table-data/list?${searchParams.toString()}`
      );
      return response!;
    },
    enabled: !!params.table_id,
  });
};
