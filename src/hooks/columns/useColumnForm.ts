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
        // Foreign Key fields
        is_foreign_key: column.is_foreign_key ?? false,
        foreign_table_id: column.foreign_table_id || "",
        foreign_column_id: column.foreign_column_id || "",
        foreign_key_constraint_name: column.foreign_key_constraint_name || "",
        on_delete_action: column.on_delete_action || "CASCADE",
        on_update_action: column.on_update_action || "CASCADE",
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
    formData.is_primary_key !== (column.is_primary_key ?? false) ||
    // Foreign Key changes
    formData.is_foreign_key !== (column.is_foreign_key ?? false) ||
    formData.foreign_table_id !== (column.foreign_table_id || "") ||
    formData.foreign_column_id !== (column.foreign_column_id || "") ||
    formData.foreign_key_constraint_name !== (column.foreign_key_constraint_name || "") ||
    formData.on_delete_action !== (column.on_delete_action || "CASCADE") ||
    formData.on_update_action !== (column.on_update_action || "CASCADE")
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
        // Foreign Key fields
        is_foreign_key: column.is_foreign_key ?? false,
        foreign_table_id: column.foreign_table_id || "",
        foreign_column_id: column.foreign_column_id || "",
        foreign_key_constraint_name: column.foreign_key_constraint_name || "",
        on_delete_action: column.on_delete_action || "CASCADE",
        on_update_action: column.on_update_action || "CASCADE",
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
      is_foreign_key: checked ? false : prev.is_foreign_key, // PK이면 FK 해제
    }));
  }, []);

  // Foreign Key 변경 시 특별 처리
  const handleForeignKeyChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      is_foreign_key: checked,
      is_primary_key: checked ? false : prev.is_primary_key, // FK이면 PK 해제
      // FK가 해제되면 관련 필드 초기화
      foreign_table_id: checked ? prev.foreign_table_id : "",
      foreign_column_id: checked ? prev.foreign_column_id : "",
      foreign_key_constraint_name: checked ? prev.foreign_key_constraint_name : "",
      on_delete_action: checked ? prev.on_delete_action : "CASCADE",
      on_update_action: checked ? prev.on_update_action : "CASCADE",
    }));
  }, []);

  // Foreign Table 변경 시 Column 초기화
  const handleForeignTableChange = useCallback((tableId: string) => {
    setFormData((prev) => ({
      ...prev,
      foreign_table_id: tableId,
      foreign_column_id: "", // 테이블이 변경되면 컬럼 초기화
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

    // Foreign Key 검증
    if (formData.is_foreign_key) {
      if (!formData.foreign_table_id) {
        newErrors.foreignTable = "참조할 테이블을 선택해주세요";
      }
      if (!formData.foreign_column_id) {
        newErrors.foreignColumn = "참조할 컬럼을 선택해주세요";
      }
    }

    // Primary Key와 Foreign Key 동시 선택 검증
    if (formData.is_primary_key && formData.is_foreign_key) {
      newErrors.primaryKey = "Primary Key와 Foreign Key는 동시에 설정할 수 없습니다";
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
          // Foreign Key fields
          is_foreign_key: formData.is_foreign_key,
          foreign_table_id: formData.is_foreign_key ? formData.foreign_table_id : undefined,
          foreign_column_id: formData.is_foreign_key ? formData.foreign_column_id : undefined,
          foreign_key_constraint_name: formData.is_foreign_key && formData.foreign_key_constraint_name ? formData.foreign_key_constraint_name : undefined,
          on_delete_action: formData.is_foreign_key ? formData.on_delete_action : undefined,
          on_update_action: formData.is_foreign_key ? formData.on_update_action : undefined,
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
        // Foreign Key fields
        if (formData.is_foreign_key !== (column.is_foreign_key ?? false)) {
          updateData.is_foreign_key = formData.is_foreign_key;
        }
        if (formData.foreign_table_id !== (column.foreign_table_id || "")) {
          updateData.foreign_table_id = formData.is_foreign_key ? formData.foreign_table_id : undefined;
        }
        if (formData.foreign_column_id !== (column.foreign_column_id || "")) {
          updateData.foreign_column_id = formData.is_foreign_key ? formData.foreign_column_id : undefined;
        }
        if (formData.foreign_key_constraint_name !== (column.foreign_key_constraint_name || "")) {
          updateData.foreign_key_constraint_name = formData.is_foreign_key && formData.foreign_key_constraint_name ? formData.foreign_key_constraint_name : undefined;
        }
        if (formData.on_delete_action !== (column.on_delete_action || "CASCADE")) {
          updateData.on_delete_action = formData.is_foreign_key ? formData.on_delete_action : undefined;
        }
        if (formData.on_update_action !== (column.on_update_action || "CASCADE")) {
          updateData.on_update_action = formData.is_foreign_key ? formData.on_update_action : undefined;
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
    handleForeignKeyChange,
    handleForeignTableChange,
    handleSubmit,
    handleCancel,
    resetForm,
  };
}