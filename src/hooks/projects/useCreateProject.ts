"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectKeys } from "@/hooks/projects/useProjectDetail";
import { useApi } from "@/hooks/utils/useApi";
import { ProjectData, ProjectRequest } from "@/types/project";

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
