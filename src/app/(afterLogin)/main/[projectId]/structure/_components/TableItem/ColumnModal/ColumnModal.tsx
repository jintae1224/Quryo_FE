"use client";

import classNames from "classnames/bind";

import Button from "@/app/_components/Button/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/Card/Card";
import Sheet from "@/app/_components/Sheet/Sheet";
import { useColumnForm } from "@/hooks/columns/useColumnForm";
import { ColumnData } from "@/types/column";

import styles from "./ColumnModal.module.css";

const cx = classNames.bind(styles);

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  tableId: string;
  tableName: string;
  column?: ColumnData; // edit 모드일 때만 필요
  onColumnCreated?: (column: ColumnData) => void;
  onColumnUpdated?: (column: ColumnData) => void;
}

export default function ColumnModal({
  isOpen,
  onClose,
  mode,
  tableId,
  tableName,
  column,
  onColumnCreated,
  onColumnUpdated,
}: ColumnModalProps) {
  const {
    formData,
    errors,
    isLoading,
    isFormValid,
    hasChanges,
    dataTypes,
    handleFieldChange,
    handlePrimaryKeyChange,
    handleSubmit,
    handleCancel,
    resetForm,
  } = useColumnForm({
    mode,
    tableId,
    column,
    onColumnCreated: (newColumn) => {
      onColumnCreated?.(newColumn);
      onClose();
    },
    onColumnUpdated: (updatedColumn) => {
      onColumnUpdated?.(updatedColumn);
      onClose();
    },
    onCancel: onClose,
  });

  const isCreateMode = mode === "create";
  const title = isCreateMode ? "새 컬럼 추가" : "컬럼 편집";
  const submitText = isCreateMode ? "컬럼 생성" : "수정 완료";
  const loadingText = isCreateMode ? "생성중..." : "수정중...";

  return (
    <Sheet isOpen={isOpen} title={title} onClose={handleCancel}>
      <div className={cx("modal-content")}>
        <Card>
          <CardHeader>
            <CardTitle>컬럼 정보</CardTitle>
            {isCreateMode && tableName && (
              <p className={cx("table-name")}>
                테이블: <strong>{tableName}</strong>
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={cx("form")}>
              <div className={cx("form-row")}>
                <div className={cx("form-group", "flex-1")}>
                  <label htmlFor="columnName" className={cx("label")}>
                    컬럼 이름 *
                  </label>
                  <input
                    id="columnName"
                    type="text"
                    value={formData.column_name}
                    onChange={(e) =>
                      handleFieldChange("column_name", e.target.value)
                    }
                    className={cx("input", { error: errors.columnName })}
                    placeholder="예: id, name, email"
                    disabled={isLoading}
                  />
                  {errors.columnName && (
                    <span className={cx("error-message")}>
                      {errors.columnName}
                    </span>
                  )}
                </div>

                <div className={cx("form-group", "flex-1")}>
                  <label htmlFor="dataType" className={cx("label")}>
                    데이터 타입 *
                  </label>
                  <select
                    id="dataType"
                    value={formData.data_type}
                    onChange={(e) =>
                      handleFieldChange("data_type", e.target.value)
                    }
                    className={cx("select", { error: errors.dataType })}
                    disabled={isLoading}
                  >
                    <option value="">데이터 타입 선택</option>
                    {dataTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.dataType && (
                    <span className={cx("error-message")}>
                      {errors.dataType}
                    </span>
                  )}
                </div>
              </div>

              <div className={cx("form-group")}>
                <label htmlFor="description" className={cx("label")}>
                  설명 (선택사항)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFieldChange("description", e.target.value)
                  }
                  className={cx("textarea")}
                  placeholder="컬럼에 대한 설명을 입력해주세요"
                  rows={2}
                  disabled={isLoading}
                />
              </div>

              <div className={cx("form-group")}>
                <label htmlFor="defaultValue" className={cx("label")}>
                  기본값 (선택사항)
                </label>
                <input
                  id="defaultValue"
                  type="text"
                  value={formData.default_value}
                  onChange={(e) =>
                    handleFieldChange("default_value", e.target.value)
                  }
                  className={cx("input")}
                  placeholder="예: 0, 'default', NOW()"
                  disabled={isLoading}
                />
              </div>

              <div className={cx("form-group")}>
                <label className={cx("label")}>제약조건</label>
                <div className={cx("checkbox-group")}>
                  <label className={cx("checkbox-label")}>
                    <input
                      type="checkbox"
                      checked={formData.is_primary_key}
                      onChange={(e) => handlePrimaryKeyChange(e.target.checked)}
                      className={cx("checkbox")}
                      disabled={isLoading}
                    />
                    <span>Primary Key</span>
                  </label>

                  <label className={cx("checkbox-label")}>
                    <input
                      type="checkbox"
                      checked={!formData.is_nullable}
                      onChange={(e) =>
                        handleFieldChange("is_nullable", !e.target.checked)
                      }
                      className={cx("checkbox")}
                      disabled={isLoading || formData.is_primary_key}
                    />
                    <span>NOT NULL</span>
                  </label>
                </div>
              </div>

              <div className={cx("form-actions")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  취소
                </Button>
                {!isCreateMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    초기화
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    isLoading || !isFormValid || (!isCreateMode && !hasChanges)
                  }
                >
                  {isLoading ? loadingText : submitText}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {!isCreateMode && (
          // Edit 모드: 컬럼 메타정보 표시
          column && (
            <Card>
              <CardHeader>
                <CardTitle>컬럼 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cx("info-content")}>
                  {tableName && (
                    <div className={cx("column-info-item")}>
                      <span className={cx("info-label")}>테이블:</span>
                      <span className={cx("info-value")}>{tableName}</span>
                    </div>
                  )}
                  <div className={cx("column-info-item")}>
                    <span className={cx("info-label")}>순서:</span>
                    <span className={cx("info-value")}>
                      {column.column_order}
                    </span>
                  </div>
                  <div className={cx("column-info-item")}>
                    <span className={cx("info-label")}>생성일:</span>
                    <span className={cx("info-value")}>
                      {column.created_at
                        ? new Date(column.created_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className={cx("column-info-item")}>
                    <span className={cx("info-label")}>수정일:</span>
                    <span className={cx("info-value")}>
                      {column.updated_at
                        ? new Date(column.updated_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <p className={cx("info-text")}>
                    Primary Key를 변경하거나 데이터 타입을 변경할 때는 신중히
                    고려해주세요. 기존 데이터와 호환되지 않을 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </Sheet>
  );
}
