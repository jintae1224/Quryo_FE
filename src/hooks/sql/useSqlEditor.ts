"use client";

import { useCallback, useState } from "react";

import { useSqlExecution } from "@/hooks/sql/useSqlExecution";

interface UseSqlEditorParams {
  projectId: string;
}

export function useSqlEditor({ projectId }: UseSqlEditorParams) {
  const [query, setQuery] = useState("");

  const {
    data: queryResult,
    isPending: isExecuting,
    error: executionError,
    mutateAsync: executeQuery,
  } = useSqlExecution();

  const handleExecuteQuery = useCallback(async () => {
    if (!query.trim() || isExecuting) return;

    try {
      await executeQuery({
        projectId,
        query: query.trim(),
      });
    } catch (error) {
      console.error("Query execution failed:", error);
    }
  }, [query, projectId, executeQuery, isExecuting]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  return {
    query,
    queryResult,
    isExecuting,
    executionError,
    handleExecuteQuery,
    handleQueryChange,
  };
}