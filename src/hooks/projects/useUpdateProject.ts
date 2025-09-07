"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectKeys } from "@/hooks/projects/useProjectDetail";
import { useApi } from "@/hooks/utils/useApi";
import { ProjectData, ProjectRequest } from "@/types/project";

export const useUpdateProject = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ProjectRequest;
    }): Promise<ProjectData> => {
      const response = await api.put<ProjectData>(`/api/project/update`, {
        id,
        ...data,
      });
      return response!;
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(updatedProject.id),
      });
    },
  });
};
