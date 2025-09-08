"use client";

import { useQuery } from "@tanstack/react-query";

import { tableKeys } from "@/hooks/tables/useCreateTable";
import { useApi } from "@/hooks/utils/useApi";
import { ForeignKeyOption } from "@/types/column";

export const useForeignKeyOptions = (projectId: string) => {
  const api = useApi();

  return useQuery({
    queryKey: [...tableKeys.list(projectId), 'foreign-key-options'],
    queryFn: async () => {
      const response = await api.get<ForeignKeyOption[]>(
        `/api/table/foreign-key-options?project_id=${projectId}`
      );
      return response || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};