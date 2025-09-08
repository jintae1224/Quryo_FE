import { useState } from "react";

import { useForeignKeyOptions } from "@/hooks/tables/useForeignKeyOptions";

export interface UseForeignKeySelectorOptions {
  projectId: string;
  currentTableId?: string;
  isForeignKey: boolean;
  foreignTableId: string;
  onForeignKeyToggle: (enabled: boolean) => void;
}

export function useForeignKeySelector({
  projectId,
  currentTableId,
  isForeignKey,
  foreignTableId,
  onForeignKeyToggle,
}: UseForeignKeySelectorOptions) {
  const [isExpanded, setIsExpanded] = useState(isForeignKey);

  // 외래키 옵션 조회
  const { data: foreignKeyOptions, isLoading, error } = useForeignKeyOptions(projectId);
  
  // 현재 테이블 제외한 사용 가능한 테이블 목록
  const availableTables = (foreignKeyOptions || []).filter(
    table => currentTableId ? table.table_id !== currentTableId : true
  );
  
  const selectedTable = availableTables.find(table => table.table_id === foreignTableId);
  const availableColumns = selectedTable ? selectedTable.columns : [];

  const handleForeignKeyToggle = (checked: boolean) => {
    setIsExpanded(checked);
    onForeignKeyToggle(checked);
  };

  return {
    // UI 상태
    isExpanded,
    setIsExpanded,
    
    // 데이터
    availableTables,
    selectedTable,
    availableColumns,
    
    // 로딩 상태
    isLoading,
    error,
    
    // 핸들러
    handleForeignKeyToggle,
  };
}