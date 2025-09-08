"use client";

import { useEffect, useMemo, useState } from "react";

import { ColumnData } from "@/types/column";
import { RowData, RowDataValue } from "@/types/tableData";

import { useCreateTableData } from "./useCreateTableData";
import { useUpdateTableData } from "./useUpdateTableData";

interface UseDataFormProps {
  isOpen: boolean;
  tableId: string;
  columns: ColumnData[];
  initialData?: RowData;
  rowId?: string; // for edit mode
  mode: "create" | "edit";
  onClose: () => void;
}

export const useDataForm = ({
  isOpen,
  tableId,
  columns,
  initialData,
  rowId,
  mode,
  onClose,
}: UseDataFormProps) => {
  // Memoize the default form data to prevent recreating empty objects
  const defaultFormData = useMemo(() => initialData || {}, [initialData]);

  const [formData, setFormData] = useState<RowData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string>("");

  const createTableData = useCreateTableData();
  const updateTableData = useUpdateTableData();

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData);
      setErrors({});
      setTouched({});
      setSubmitError("");
    }
  }, [isOpen, defaultFormData]);

  const validateField = (
    columnName: string,
    value: RowDataValue,
    column: ColumnData
  ): string => {
    let error = "";

    // Required field validation
    if (
      !column.is_nullable &&
      (value === null || value === undefined || value === "")
    ) {
      error = `${column.column_name}은(는) 필수 입력 항목입니다.`;
    }

    // Basic type validation
    if (value !== null && value !== undefined && value !== "") {
      const dataType = column.data_type.toLowerCase();

      if (dataType.includes("integer") || dataType.includes("int")) {
        if (isNaN(Number(value))) {
          error = `${column.column_name}은(는) 숫자여야 합니다.`;
        }
      } else if (dataType.includes("boolean") || dataType.includes("bool")) {
        if (
          typeof value !== "boolean" &&
          value !== "true" &&
          value !== "false"
        ) {
          error = `${column.column_name}은(는) true 또는 false여야 합니다.`;
        }
      }
    }

    return error;
  };

  const handleInputChange = (columnName: string, value: RowDataValue) => {
    setFormData((prev) => ({
      ...prev,
      [columnName]: value,
    }));

    // Clear error when user starts typing
    if (errors[columnName]) {
      setErrors((prev) => ({
        ...prev,
        [columnName]: "",
      }));
    }
  };

  const handleInputBlur = (columnName: string) => {
    setTouched((prev) => ({
      ...prev,
      [columnName]: true,
    }));

    const column = columns.find((col) => col.column_name === columnName);
    if (!column) return;

    const value = formData[columnName];
    const error = validateField(columnName, value, column);

    setErrors((prev) => ({
      ...prev,
      [columnName]: error,
    }));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    columns.forEach((column) => {
      const columnName = column.column_name;
      const value = formData[columnName];
      const error = validateField(columnName, value, column);

      if (error) {
        newErrors[columnName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const processFormData = (): RowData => {
    const processedData: RowData = {};

    columns.forEach((column) => {
      const value = formData[column.column_name];
      const dataType = column.data_type.toLowerCase();

      if (value === null || value === undefined || value === "") {
        processedData[column.column_name] = column.is_nullable ? null : "";
      } else if (dataType.includes("integer") || dataType.includes("int")) {
        processedData[column.column_name] = Number(value);
      } else if (dataType.includes("boolean") || dataType.includes("bool")) {
        processedData[column.column_name] = value === "true" || value === true;
      } else {
        processedData[column.column_name] = String(value);
      }
    });

    return processedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError("");

    try {
      const processedData = processFormData();

      if (mode === "create") {
        await createTableData.mutateAsync({
          table_id: tableId,
          row_data: processedData,
        });
      } else {
        if (!rowId) {
          throw new Error("편집 모드에서는 행 ID가 필요합니다.");
        }
        await updateTableData.mutateAsync({
          rowId,
          tableId,
          data: { row_data: processedData },
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to save data:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error)?.message ||
        "데이터 저장에 실패했습니다";
      setSubmitError(errorMessage);
    }
  };

  const getFieldError = (columnName: string): string | undefined => {
    return touched[columnName] ? errors[columnName] : undefined;
  };

  const isSubmitting = createTableData.isPending || updateTableData.isPending;

  return {
    formData,
    submitError,
    isSubmitting,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    getFieldError,
  };
};
