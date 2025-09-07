"use client";

import { useQuery } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import { ProjectData } from "@/types/project";

import { projectKeys } from "./useProjectDetail";

export const useProjectList = () => {
  const api = useApi();

  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async (): Promise<ProjectData[]> => {
      const response = await api.get<ProjectData[]>("/api/project/list");
      return response || [];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
