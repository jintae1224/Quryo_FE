"use client";

import classNames from "classnames/bind";
import { ChevronDown, ExternalLink } from "lucide-react";

import { useForeignKeySelector } from "@/hooks/columns/useForeignKeySelector";
import { FOREIGN_KEY_ACTIONS, ForeignKeyAction } from "@/types/column";

import styles from "./ForeignKeySelector.module.css";

const cx = classNames.bind(styles);

interface ForeignKeySelectorProps {
  projectId: string;
  currentTableId?: string; // 현재 편집 중인 테이블 (자기 참조 방지)
  isForeignKey: boolean;
  foreignTableId: string;
  foreignColumnId: string;
  onDeleteAction: ForeignKeyAction;
  onUpdateAction: ForeignKeyAction;
  constraintName: string;
  onForeignKeyToggle: (enabled: boolean) => void;
  onForeignTableChange: (tableId: string) => void;
  onFieldChange: (field: string, value: string) => void;
  errors?: {
    foreignTable?: string;
    foreignColumn?: string;
  };
  disabled?: boolean;
}

export default function ForeignKeySelector({
  projectId,
  currentTableId,
  isForeignKey,
  foreignTableId,
  foreignColumnId,
  onDeleteAction,
  onUpdateAction,
  constraintName,
  onForeignKeyToggle,
  onForeignTableChange,
  onFieldChange,
  errors = {},
  disabled = false,
}: ForeignKeySelectorProps) {
  // 비즈니스 로직을 커스텀 훅으로 분리
  const {
    isExpanded,
    setIsExpanded,
    availableTables,
    selectedTable,
    availableColumns,
    isLoading,
    error,
    handleForeignKeyToggle,
  } = useForeignKeySelector({
    projectId,
    currentTableId,
    isForeignKey,
    foreignTableId,
    onForeignKeyToggle,
  });

  return (
    <div className={cx("foreign-key-selector")}>
      {/* Foreign Key 체크박스 */}
      <div className={cx("fk-header")}>
        <label className={cx("checkbox-label")}>
          <input
            type="checkbox"
            checked={isForeignKey}
            onChange={(e) => handleForeignKeyToggle(e.target.checked)}
            className={cx("checkbox")}
            disabled={disabled}
          />
          <span>Foreign Key</span>
        </label>
        
        {isForeignKey && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cx("expand-button")}
            disabled={disabled}
          >
            <ChevronDown 
              size={16} 
              className={cx("expand-icon", { expanded: isExpanded })} 
            />
          </button>
        )}
      </div>

      {/* Foreign Key 설정 */}
      {isForeignKey && isExpanded && (
        <div className={cx("fk-settings")}>
          {/* 참조 테이블 선택 */}
          <div className={cx("form-group")}>
            <label htmlFor="foreignTable" className={cx("label")}>
              참조 테이블 *
            </label>
            <select
              id="foreignTable"
              value={foreignTableId}
              onChange={(e) => onForeignTableChange(e.target.value)}
              className={cx("select", { error: errors.foreignTable })}
              disabled={disabled || isLoading}
            >
              <option value="">
                {isLoading ? "로딩중..." : error ? "테이블 로드 실패" : "참조할 테이블 선택"}
              </option>
              {availableTables.map((table) => (
                  <option key={table.table_id} value={table.table_id}>
                    {table.table_name}
                  </option>
                ))}
            </select>
            {errors.foreignTable && (
              <span className={cx("error-message")}>
                {errors.foreignTable}
              </span>
            )}
          </div>

          {/* 참조 컬럼 선택 */}
          <div className={cx("form-group")}>
            <label htmlFor="foreignColumn" className={cx("label")}>
              참조 컬럼 *
            </label>
            <select
              id="foreignColumn"
              value={foreignColumnId}
              onChange={(e) => onFieldChange("foreign_column_id", e.target.value)}
              className={cx("select", { error: errors.foreignColumn })}
              disabled={disabled || !foreignTableId}
            >
              <option value="">참조할 컬럼 선택</option>
              {availableColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name} ({column.data_type})
                  {column.is_primary_key && " - PK"}
                </option>
              ))}
            </select>
            {errors.foreignColumn && (
              <span className={cx("error-message")}>
                {errors.foreignColumn}
              </span>
            )}
            {selectedTable && (
              <div className={cx("table-link")}>
                <ExternalLink size={12} />
                <span>→ {selectedTable.table_name}</span>
              </div>
            )}
          </div>

          {/* 제약조건 이름 */}
          <div className={cx("form-group")}>
            <label htmlFor="constraintName" className={cx("label")}>
              제약조건 이름 (선택사항)
            </label>
            <input
              id="constraintName"
              type="text"
              value={constraintName}
              onChange={(e) => onFieldChange("foreign_key_constraint_name", e.target.value)}
              className={cx("input")}
              placeholder="예: fk_user_posts, fk_order_customer"
              disabled={disabled}
            />
            <span className={cx("hint")}>
              비워두면 자동으로 생성됩니다
            </span>
          </div>

          {/* 참조 동작 설정 */}
          <div className={cx("actions-row")}>
            <div className={cx("form-group", "flex-1")}>
              <label htmlFor="onDelete" className={cx("label")}>
                ON DELETE
              </label>
              <select
                id="onDelete"
                value={onDeleteAction}
                onChange={(e) => onFieldChange("on_delete_action", e.target.value)}
                className={cx("select")}
                disabled={disabled}
              >
                {FOREIGN_KEY_ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={cx("form-group", "flex-1")}>
              <label htmlFor="onUpdate" className={cx("label")}>
                ON UPDATE
              </label>
              <select
                id="onUpdate"
                value={onUpdateAction}
                onChange={(e) => onFieldChange("on_update_action", e.target.value)}
                className={cx("select")}
                disabled={disabled}
              >
                {FOREIGN_KEY_ACTIONS.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 설명 */}
          <div className={cx("info-box")}>
            <p className={cx("info-title")}>참조 동작 설명:</p>
            <ul className={cx("info-list")}>
              <li><strong>CASCADE:</strong> 참조된 행이 삭제/수정되면 이 행도 삭제/수정</li>
              <li><strong>RESTRICT:</strong> 참조된 행의 삭제/수정 방지</li>
              <li><strong>SET NULL:</strong> 참조된 행이 삭제/수정되면 이 컬럼을 NULL로 설정</li>
              <li><strong>NO ACTION:</strong> 참조 무결성 검사를 트랜잭션 끝까지 지연</li>
              <li><strong>SET DEFAULT:</strong> 참조된 행이 삭제/수정되면 기본값으로 설정</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}