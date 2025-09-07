"use client";

import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { ProjectData } from "@/types/project";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: Record<string, unknown> = {}) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

export const useProjectDetail = (id: string) => {
  const api = useApi();

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async (): Promise<ProjectData> => {
      const response = await api.get<ProjectData>(
        `/api/project/detail?id=${id}`
      );
      return response!;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
};
