import { useCallback } from "react";

import { useColumnList } from "@/hooks/columns/useColumnList";
import { useDeleteTable } from "@/hooks/tables/useDeleteTable";
import { useSheet } from "@/hooks/utils/useSheet";
import { TableData } from "@/types/table";

export interface UseTableItemOptions {
  table: TableData;
  isExpanded: boolean;  // UI 상태를 받아서 데이터 fetch 최적화
}

/**
 * 테이블 아이템의 비즈니스 로직을 관리하는 훅
 * UI 상태는 useSheet로, 비즈니스 로직은 여기서 처리
 */
export function useTableItem({
  table,
  isExpanded,
}: UseTableItemOptions) {
  // Sheet 상태 (UI)
  const editSheet = useSheet();
  const deleteConfirm = useSheet();  // 삭제 확인은 Sheet가 아니라 dropdown이지만 일단 재사용
  const addColumnSheet = useSheet();
  
  // 데이터 페칭 (isExpanded일 때만 fetch - 성능 최적화)
  const { data: columns = [], isLoading: columnsLoading } = useColumnList(
    isExpanded ? table.id : null
  );
  
  // Mutations
  const { mutateAsync: deleteTable, isPending: isDeleting } = useDeleteTable();

  // 비즈니스 로직: 테이블 삭제
  const handleDelete = useCallback(async () => {
    try {
      await deleteTable({ 
        id: table.id, 
        projectId: table.project_id 
      });
      deleteConfirm.closeSheet();
      // React Query가 자동으로 캐시 무효화
    } catch (error) {
      console.error("테이블 삭제 실패:", error);
      // TODO: 에러 토스트 표시
    }
  }, [deleteTable, table.id, table.project_id, deleteConfirm]);



  return {
    // Sheet 상태
    editSheet,
    deleteConfirm,
    addColumnSheet,
    
    // 데이터
    columns,
    columnsLoading,
    isDeleting,
    
    // 비즈니스 로직 핸들러
    handleDelete,
  };
}