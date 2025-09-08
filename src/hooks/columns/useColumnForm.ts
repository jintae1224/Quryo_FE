import { useCallback, useEffect, useState } from "react";

import { DATA_TYPES, INITIAL_COLUMN_FORM_DATA } from "@/constants/database";
import { useCreateColumn } from "@/hooks/columns/useCreateColumn";
import { useUpdateColumn } from "@/hooks/columns/useUpdateColumn";
import { ColumnData, ColumnRequest } from "@/types/column";

export interface UseColumnFormOptions {
  mode: "create" | "edit";
  tableId: string;
  column?: ColumnData; // edit 모드일 때만 필요
  onColumnCreated?: (column: ColumnData) => void;
  onColumnUpdated?: (column: ColumnData) => void;
  onCancel?: () => void;
}

export function useColumnForm({
  mode,
  tableId,
  column,
  onColumnCreated,
  onColumnUpdated,
  onCancel,
}: UseColumnFormOptions) {
  const createMutation = useCreateColumn();
  const updateMutation = useUpdateColumn();

  const [formData, setFormData] = useState(INITIAL_COLUMN_FORM_DATA);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isCreateMode = mode === "create";
  const mutation = isCreateMode ? createMutation : updateMutation;

  // Edit 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (mode === "edit" && column) {
      setFormData({
        column_name: column.column_name,
        data_type: column.data_type,
        description: column.description || "",
        default_value: column.default_value || "",
        is_nullable: column.is_nullable ?? true,
        is_primary_key: column.is_primary_key ?? false,
      });
      setErrors({});
    } else if (mode === "create") {
      setFormData(INITIAL_COLUMN_FORM_DATA);
      setErrors({});
    }
  }, [mode, column]);

  // 폼 유효성 체크
  const isFormValid = 
    !!formData.column_name?.trim() &&
    !!formData.data_type &&
    !Object.values(errors).some((error) => error);

  // Edit 모드에서 변경사항 확인
  const hasChanges = isCreateMode || !column ? true : (
    formData.column_name.trim() !== column.column_name ||
    formData.data_type !== column.data_type ||
    (formData.description || "").trim() !== (column.description || "") ||
    (formData.default_value || "").trim() !== (column.default_value || "") ||
    formData.is_nullable !== (column.is_nullable ?? true) ||
    formData.is_primary_key !== (column.is_primary_key ?? false)
  );

  // 폼 초기화
  const resetForm = useCallback(() => {
    if (mode === "create") {
      setFormData(INITIAL_COLUMN_FORM_DATA);
    } else if (column) {
      setFormData({
        column_name: column.column_name,
        data_type: column.data_type,
        description: column.description || "",
        default_value: column.default_value || "",
        is_nullable: column.is_nullable ?? true,
        is_primary_key: column.is_primary_key ?? false,
      });
    }
    setErrors({});
    mutation.reset();
  }, [mode, column, mutation]);

  // 필드 값 변경 핸들러
  const handleFieldChange = useCallback((field: keyof typeof INITIAL_COLUMN_FORM_DATA, value: string | boolean) => {
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

  // Primary Key 변경 시 특별 처리
  const handlePrimaryKeyChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_primary_key: checked,
      is_nullable: checked ? false : prev.is_nullable, // PK이면 NOT NULL 강제
    }));
  }, []);

  // 폼 검증
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.column_name.trim()) {
      newErrors.columnName = "컬럼 이름을 입력해주세요";
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.column_name.trim())) {
      newErrors.columnName = "컬럼 이름은 영문자로 시작하고 영문자, 숫자, 언더스코어만 사용할 수 있습니다";
    }

    if (!formData.data_type) {
      newErrors.dataType = "데이터 타입을 선택해주세요";
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
        const columnRequest: ColumnRequest = {
          table_id: tableId,
          column_name: formData.column_name.trim(),
          data_type: formData.data_type,
          description: (formData.description || "").trim() || undefined,
          default_value: (formData.default_value || "").trim() || undefined,
          is_nullable: formData.is_nullable,
          is_primary_key: formData.is_primary_key,
        };

        const newColumn = await createMutation.mutateAsync(columnRequest);
        resetForm();
        onColumnCreated?.(newColumn as ColumnData);
      } else {
        // Edit 모드
        if (!column) return;
        
        const updateData: Partial<ColumnRequest> = {};
        
        if (formData.column_name.trim() !== column.column_name) {
          updateData.column_name = formData.column_name.trim();
        }
        if (formData.data_type !== column.data_type) {
          updateData.data_type = formData.data_type;
        }
        if ((formData.description || "").trim() !== (column.description || "")) {
          updateData.description = (formData.description || "").trim() || undefined;
        }
        if ((formData.default_value || "").trim() !== (column.default_value || "")) {
          updateData.default_value = (formData.default_value || "").trim() || undefined;
        }
        if (formData.is_nullable !== (column.is_nullable ?? true)) {
          updateData.is_nullable = formData.is_nullable;
        }
        if (formData.is_primary_key !== (column.is_primary_key ?? false)) {
          updateData.is_primary_key = formData.is_primary_key;
        }

        const updatedColumn = await updateMutation.mutateAsync({
          id: column.id,
          tableId: column.table_id,
          data: updateData,
        });
        
        onColumnUpdated?.(updatedColumn as ColumnData);
      }
    } catch (err) {
      console.error(`컬럼 ${isCreateMode ? '생성' : '수정'} 실패:`, err);
    }
  }, [formData, tableId, validateForm, isCreateMode, hasChanges, column, createMutation, updateMutation, resetForm, onColumnCreated, onColumnUpdated, onCancel]);

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
    dataTypes: DATA_TYPES,
    handleFieldChange,
    handlePrimaryKeyChange,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}