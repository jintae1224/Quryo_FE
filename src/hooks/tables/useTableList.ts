"use client";

import { useQuery } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/tables/useCreateTable";
import { useApi } from "@/hooks/utils/useApi";
import { TableData } from "@/types/table";

export const useTableList = (projectId: string) => {
  const api = useApi();

  return useQuery({
    queryKey: tableKeys.list(projectId),
    queryFn: async () => {
      const response = await api.get<TableData[]>(
        `/api/table/list?project_id=${projectId}`
      );
      return response || [];
    },
    enabled: !!projectId,
  });
};