'use client';

import { useMemo } from 'react';

import { SqlQueryResponse } from '@/types/sql';
import { downloadCSV, downloadJSON } from '@/utils/sql-export';

interface UseSqlResultsParams {
  result: SqlQueryResponse | null | undefined;
}

export function useSqlResults({ result }: UseSqlResultsParams) {
  const { data, executionTime, hasData } = useMemo(() => {
    if (!result) {
      return { data: [], executionTime: undefined, hasData: false };
    }

    const resolvedData = Array.isArray(result) ? result : result.data;
    const resolvedExecutionTime = Array.isArray(result)
      ? undefined
      : result.executionTime;

    return {
      data: resolvedData || [],
      executionTime: resolvedExecutionTime,
      hasData: resolvedData && resolvedData.length > 0,
    };
  }, [result]);

  const handleDownloadCSV = () => {
    if (result) {
      downloadCSV(result);
    }
  };

  const handleDownloadJSON = () => {
    if (result) {
      downloadJSON(result);
    }
  };

  return {
    data,
    executionTime,
    hasData,
    handleDownloadCSV,
    handleDownloadJSON,
  };
}