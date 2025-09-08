"use client";

import classNames from "classnames/bind";
import {
  ChevronDown,
  ChevronRight,
  Columns3,
  Edit3,
  MoreHorizontal,
  Plus,
  Table,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import Button from "@/app/_components/Button/Button";
import { useTableItem } from "@/hooks/tables/useTableItem";
import { TableData } from "@/types/table";

import TableModal from "../TableModal/TableModal";
import ColumnItem from "./ColumnItem/ColumnItem";
import ColumnModal from "./ColumnModal/ColumnModal";
import styles from "./TableItem.module.css";

const cx = classNames.bind(styles);

interface TableItemProps {
  table: TableData;
}

export default function TableItem({ table }: TableItemProps) {
  // UI 상태만 여기서 관리 (expand는 순수 UI 상태)
  const [isExpanded, setIsExpanded] = useState(false);

  // 비즈니스 로직은 커스텀 훅에서
  const {
    editSheet,
    deleteConfirm,
    addColumnSheet,
    columns,
    columnsLoading,
    isDeleting,
    handleDelete,
  } = useTableItem({
    table,
    isExpanded,
  });

  return (
    <div className={cx("table-item", { expanded: isExpanded })}>
      <div className={cx("table-header")}>
        <div
          className={cx("table-main")}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cx("expand-icon")}>
            {columns.length > 0 ? (
              isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )
            ) : (
              <div className={cx("no-expand")} />
            )}
          </div>

          <div className={cx("table-icon")}>
            <Table size={16} />
          </div>

          <div className={cx("table-info")}>
            <span className={cx("table-name")}>{table.table_name}</span>
            <div className={cx("table-meta")}>
              <span className={cx("column-count")}>
                <Columns3 size={12} />
                {columns.length} columns
              </span>
              {table.description && (
                <span className={cx("table-description")}>
                  {table.description}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={cx("table-actions")}>
          <Button
            variant="outline"
            size="sm"
            onClick={editSheet.openSheet}
            className={cx("action-button")}
          >
            <Edit3 size={14} />
          </Button>

          <div className={cx("dropdown-container")}>
            <Button
              variant="outline"
              size="sm"
              className={cx("action-button", "dropdown-trigger")}
              onClick={deleteConfirm.openSheet}
            >
              <MoreHorizontal size={14} />
            </Button>

            {deleteConfirm.isOpen && (
              <div className={cx("dropdown-menu")}>
                <div className={cx("dropdown-header")}>
                  <span>테이블을 삭제하시겠습니까?</span>
                  <p>이 작업은 되돌릴 수 없습니다.</p>
                </div>
                <div className={cx("dropdown-actions")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteConfirm.closeSheet}
                  >
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 size={14} />
                    삭제
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={cx("table-content")}>
          <div className={cx("columns-section")}>
            <div className={cx("columns-header")}>
              <span className={cx("columns-title")}>Columns</span>
              <Button
                variant="outline"
                size="sm"
                className={cx("add-column-button")}
                onClick={addColumnSheet.openSheet}
              >
                <Plus size={14} />
                Add Column
              </Button>
            </div>

            {columnsLoading ? (
              <div className={cx("columns-loading")}>컬럼을 로딩중...</div>
            ) : columns.length > 0 ? (
              <div className={cx("columns-list")}>
                {columns.map((column) => (
                  <ColumnItem key={column.id} column={column} />
                ))}
              </div>
            ) : (
              <div className={cx("columns-empty")}>
                <Columns3 className={cx("empty-icon")} size={20} />
                <span>아직 컬럼이 없습니다</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addColumnSheet.openSheet}
                >
                  <Plus size={14} />첫 번째 컬럼 추가
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <TableModal
        isOpen={editSheet.isOpen}
        onClose={editSheet.closeSheet}
        mode="edit"
        projectId={table.project_id}
        table={table}
      />

      {/* Add Column Modal */}
      <ColumnModal
        isOpen={addColumnSheet.isOpen}
        onClose={addColumnSheet.closeSheet}
        mode="create"
        tableId={table.id}
        tableName={table.table_name}
      />
    </div>
  );
}
