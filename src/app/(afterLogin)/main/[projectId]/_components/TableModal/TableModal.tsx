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
import { useTableForm } from "@/hooks/tables/useTableForm";
import { TableData } from "@/types/table";

import styles from "./TableModal.module.css";

const cx = classNames.bind(styles);

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  projectId: string;
  table?: TableData; // edit 모드일 때만 필요
  onTableCreated?: (table: TableData) => void;
  onTableUpdated?: (table: TableData) => void;
}

export default function TableModal({
  isOpen,
  onClose,
  mode,
  projectId,
  table,
  onTableCreated,
  onTableUpdated,
}: TableModalProps) {
  const {
    formData,
    errors,
    isLoading,
    isFormValid,
    hasChanges,
    handleFieldChange,
    handleSubmit,
    handleCancel,
    resetForm,
  } = useTableForm({
    mode,
    projectId,
    table,
    onTableCreated: (newTable) => {
      onTableCreated?.(newTable);
      onClose();
    },
    onTableUpdated: (updatedTable) => {
      onTableUpdated?.(updatedTable);
      onClose();
    },
    onCancel: onClose,
  });

  const isCreateMode = mode === "create";
  const title = isCreateMode ? "새 테이블 추가" : "테이블 편집";
  const submitText = isCreateMode ? "테이블 생성" : "수정 완료";
  const loadingText = isCreateMode ? "생성중..." : "수정중...";

  return (
    <Sheet isOpen={isOpen} title={title} onClose={handleCancel}>
      <div className={cx("modal-content")}>
        <Card>
          <CardHeader>
            <CardTitle>테이블 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={cx("form")}>
              <div className={cx("form-group")}>
                <label htmlFor="tableName" className={cx("label")}>
                  테이블 이름 *
                </label>
                <input
                  id="tableName"
                  type="text"
                  value={formData.table_name}
                  onChange={(e) =>
                    handleFieldChange("table_name", e.target.value)
                  }
                  className={cx("input", { error: errors.tableName })}
                  placeholder="예: users, products, orders"
                  disabled={isLoading}
                />
                {errors.tableName && (
                  <span className={cx("error-message")}>
                    {errors.tableName}
                  </span>
                )}
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
                  placeholder="테이블에 대한 간단한 설명을 입력해주세요"
                  rows={3}
                  disabled={isLoading}
                />
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

        {isCreateMode ? (
          // Create 모드: 다음 단계 안내
          <Card>
            <CardHeader>
              <CardTitle>다음 단계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cx("info-content")}>
                <p className={cx("info-text")}>
                  테이블을 생성한 후에는 컬럼을 추가하여 데이터 구조를 정의할 수
                  있습니다.
                </p>
                <ul className={cx("info-list")}>
                  <li>컬럼명과 데이터 타입 지정</li>
                  <li>Primary Key, Not Null 등 제약조건 설정</li>
                  <li>기본값 및 설명 추가</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Edit 모드: 테이블 메타정보 표시
          table && (
            <Card>
              <CardHeader>
                <CardTitle>테이블 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cx("info-content")}>
                  <div className={cx("table-info-item")}>
                    <span className={cx("info-label")}>생성일:</span>
                    <span className={cx("info-value")}>
                      {table.created_at
                        ? new Date(table.created_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className={cx("table-info-item")}>
                    <span className={cx("info-label")}>수정일:</span>
                    <span className={cx("info-value")}>
                      {table.updated_at
                        ? new Date(table.updated_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <p className={cx("info-text")}>
                    테이블 이름을 변경하면 이 테이블을 참조하는 모든 쿼리에
                    영향을 줄 수 있습니다.
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
