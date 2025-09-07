"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/hooks/utils/useApi";
import type { ProjectData, ProjectRequest } from "@/types";
import { projectKeys } from "@/hooks/projects/useProjectDetail";

export const useCreateProject = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: ProjectRequest;
    }): Promise<ProjectData> => {
      const response = await api.post<ProjectData>("/api/project/create", data);
      return response!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};
