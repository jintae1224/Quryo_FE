"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { projectKeys } from "@/hooks/projects/useProjectDetail";
import { useApi } from "@/hooks/utils/useApi";

export const useDeleteProject = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      await api.post(`/api/project/delete`, { id });
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
    },
  });
};
