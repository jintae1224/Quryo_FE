"use client";

import classNames from "classnames/bind";
import { AlertCircle, Save } from "lucide-react";

import Input from "@/app/_components/Input/Input";
import Select from "@/app/_components/Select/Select";
import Sheet, { SheetRef } from "@/app/_components/Sheet/Sheet";
import { useDataForm } from "@/hooks/tableData/useDataForm";
import { ColumnData } from "@/types/column";
import { RowData } from "@/types/tableData";

import styles from "./DataFormSheet.module.css";

const cx = classNames.bind(styles);

interface DataFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sheetRef: React.RefObject<SheetRef>;
  tableId: string;
  columns: ColumnData[];
  initialData?: RowData;
  rowId?: string; // for edit mode
  mode: "create" | "edit";
}

export function DataFormSheet({
  isOpen,
  onClose,
  sheetRef,
  tableId,
  columns,
  initialData,
  rowId,
  mode = "create",
}: DataFormSheetProps) {
  const {
    formData,
    submitError,
    isSubmitting,
    handleInputChange,
    handleInputBlur,
    handleSubmit,
    getFieldError,
  } = useDataForm({
    isOpen,
    tableId,
    columns,
    initialData,
    rowId,
    mode,
    onClose,
  });

  return (
    <Sheet
      ref={sheetRef}
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "새 행 추가" : "행 수정"}
    >
      <div className={cx("sheet-content")}>
        <form onSubmit={handleSubmit} className={cx("form")}>
          <div className={cx("form-grid")}>
            {columns.map((column) => {
              const columnName = column.column_name;
              const value = formData[columnName] ?? "";
              const error = getFieldError(columnName);
              const dataType = column.data_type.toLowerCase();

              return (
                <div key={column.id} className={cx("form-field")}>
                  <div className={cx("field-header")}>
                    <div className={cx("label-content")}>
                      <span>{column.column_name}</span>
                      <span className={cx("label-type")}>
                        ({column.data_type})
                      </span>
                    </div>

                    <div className={cx("label-badges")}>
                      {column.is_primary_key && (
                        <span className={cx("badge", "primary-key")}>PK</span>
                      )}
                      {column.is_foreign_key && (
                        <span className={cx("badge", "foreign-key")}>FK</span>
                      )}
                      {!column.is_nullable && (
                        <span className={cx("badge", "required")}>필수</span>
                      )}
                    </div>
                  </div>

                  {dataType.includes("boolean") || dataType.includes("bool") ? (
                    <Select
                      id={columnName}
                      value={value === null ? "" : String(value)}
                      options={[
                        { value: "", label: "선택하세요" },
                        { value: "true", label: "True" },
                        { value: "false", label: "False" },
                      ]}
                      onChange={(val) => {
                        handleInputChange(
                          columnName,
                          val === "" ? null : val === "true"
                        );
                      }}
                      onBlur={() => handleInputBlur(columnName)}
                      error={Boolean(error)}
                      errorMessage={error}
                    />
                  ) : (
                    <Input
                      id={columnName}
                      type={
                        dataType.includes("integer") || dataType.includes("int")
                          ? "number"
                          : "text"
                      }
                      value={value === null ? "" : String(value)}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange(columnName, val === "" ? null : val);
                      }}
                      onBlur={() => handleInputBlur(columnName)}
                      placeholder={
                        column.is_nullable ? "선택사항" : "필수 입력"
                      }
                      error={Boolean(error)}
                      errorMessage={error}
                    />
                  )}

                  {column.default_value && (
                    <div className={cx("help-text")}>
                      기본값: {column.default_value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className={cx("form-footer")}>
            {submitError && (
              <div className={cx("submit-error")}>
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            <div className={cx("footer-buttons")}>
              <button
                type="button"
                onClick={onClose}
                className={cx("cancel-button")}
                disabled={isSubmitting}
              >
                취소
              </button>

              <button
                type="submit"
                className={cx("submit-button")}
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
