import { useCallback, useEffect, useState } from "react";

import { INITIAL_TABLE_FORM_DATA } from "@/constants/database";
import { useCreateTable } from "@/hooks/tables/useCreateTable";
import { useUpdateTable } from "@/hooks/tables/useUpdateTable";
import { TableData, TableRequest } from "@/types/table";

export interface UseTableFormOptions {
  mode: "create" | "edit";
  projectId: string;
  table?: TableData; // edit 모드일 때만 필요
  onTableCreated?: (table: TableData) => void;
  onTableUpdated?: (table: TableData) => void;
  onCancel?: () => void;
}

export function useTableForm({
  mode,
  projectId,
  table,
  onTableCreated,
  onTableUpdated,
  onCancel,
}: UseTableFormOptions) {
  const createMutation = useCreateTable();
  const updateMutation = useUpdateTable();

  const [formData, setFormData] = useState(INITIAL_TABLE_FORM_DATA);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isCreateMode = mode === "create";
  const mutation = isCreateMode ? createMutation : updateMutation;

  // Edit 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && table) {
      setFormData({
        table_name: table.table_name,
        description: table.description || "",
      });
      setErrors({});
    } else if (mode === "create") {
      setFormData(INITIAL_TABLE_FORM_DATA);
      setErrors({});
    }
  }, [mode, table]);

  // 폼 유효성 체크
  const isFormValid = 
    !!formData.table_name?.trim() &&
    !Object.values(errors).some((error) => error);

  // Edit 모드에서 변경사항 확인
  const hasChanges = isCreateMode || !table ? true : (
    formData.table_name.trim() !== table.table_name ||
    (formData.description || "").trim() !== (table.description || "")
  );

  // 폼 초기화
  const resetForm = useCallback(() => {
    if (mode === "create") {
      setFormData(INITIAL_TABLE_FORM_DATA);
    } else if (table) {
      setFormData({
        table_name: table.table_name,
        description: table.description || "",
      });
    }
    setErrors({});
    mutation.reset();
  }, [mode, table, mutation]);

  // 필드 값 변경 핸들러
  const handleFieldChange = useCallback((field: keyof typeof INITIAL_TABLE_FORM_DATA, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 값이 변경되면 해당 필드의 에러 클리어
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // API 에러가 있으면 클리어
    if (mutation.error) {
      mutation.reset();
    }
  }, [errors, mutation]);

  // 폼 검증
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.table_name.trim()) {
      newErrors.tableName = "테이블 이름을 입력해주세요";
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.table_name.trim())) {
      newErrors.tableName = "테이블 이름은 영문자로 시작하고 영문자, 숫자, 언더스코어만 사용할 수 있습니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 폼 제출 핸들러
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Edit 모드에서 변경사항이 없으면 그냥 닫기
    if (!isCreateMode && !hasChanges) {
      onCancel?.();
      return;
    }

    try {
      if (isCreateMode) {
        // Create 모드
        const tableRequest: TableRequest = {
          project_id: projectId,
          table_name: formData.table_name.trim(),
          description: (formData.description || "").trim() || undefined,
        };

        const newTable = await createMutation.mutateAsync(tableRequest);
        resetForm();
        onTableCreated?.(newTable as TableData);
      } else {
        // Edit 모드
        if (!table) return;
        
        const updateData: Partial<TableRequest> = {};
        
        if (formData.table_name.trim() !== table.table_name) {
          updateData.table_name = formData.table_name.trim();
        }
        if ((formData.description || "").trim() !== (table.description || "")) {
          updateData.description = (formData.description || "").trim() || undefined;
        }

        const updatedTable = await updateMutation.mutateAsync({
          id: table.id,
          data: updateData,
        });
        
        onTableUpdated?.(updatedTable as TableData);
      }
    } catch (err) {
      console.error(`테이블 ${isCreateMode ? '생성' : '수정'} 실패:`, err);
    }
  }, [formData, projectId, validateForm, isCreateMode, hasChanges, table, createMutation, updateMutation, resetForm, onTableCreated, onTableUpdated, onCancel]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    resetForm();
    onCancel?.();
  }, [resetForm, onCancel]);

  return {
    formData,
    errors,
    isLoading: mutation.isPending,
    isFormValid,
    hasChanges,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}