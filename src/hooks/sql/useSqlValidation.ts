"use client";

import { useMemo } from "react";

import { parseSqlQuery } from "@/utils/sql-parser";

interface UseSqlValidationParams {
  query: string;
}

export const useSqlValidation = ({ query }: UseSqlValidationParams) => {
  const validation = useMemo(() => {
    if (!query.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      };
    }

    try {
      const parsed = parseSqlQuery(query);
      return {
        isValid: parsed.isValid,
        error: parsed.error || null,
        isEmpty: false,
        parsedQuery: parsed,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Invalid SQL syntax",
        isEmpty: false,
      };
    }
  }, [query]);

  return validation;
};
