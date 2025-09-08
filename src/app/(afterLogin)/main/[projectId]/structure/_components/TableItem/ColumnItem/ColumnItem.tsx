"use client";

import classNames from "classnames/bind";
import { Edit3, ExternalLink, Key, MoreHorizontal, Trash2, Type } from "lucide-react";
import { useState } from "react";

import Button from "@/app/_components/Button/Button";
import { useDeleteColumn } from "@/hooks/columns/useDeleteColumn";
import { ColumnData } from "@/types/column";

import ColumnModal from "../ColumnModal/ColumnModal";
import styles from "./ColumnItem.module.css";

const cx = classNames.bind(styles);

interface ColumnItemProps {
  column: ColumnData;
  projectId: string;
}

export default function ColumnItem({ column, projectId }: ColumnItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const deleteColumn = useDeleteColumn();

  const handleDelete = async () => {
    try {
      await deleteColumn.mutateAsync({
        id: column.id,
        tableId: column.table_id,
      });
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete column:", error);
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    // 데이터 타입에 따른 아이콘 또는 색상 구분
    const lowerType = dataType.toLowerCase();
    if (
      lowerType.includes("varchar") ||
      lowerType.includes("text") ||
      lowerType.includes("char")
    ) {
      return { icon: <Type size={12} />, className: "text-type" };
    }
    if (
      lowerType.includes("int") ||
      lowerType.includes("decimal") ||
      lowerType.includes("numeric")
    ) {
      return { icon: <Type size={12} />, className: "number-type" };
    }
    if (lowerType.includes("date") || lowerType.includes("timestamp")) {
      return { icon: <Type size={12} />, className: "date-type" };
    }
    if (lowerType.includes("bool")) {
      return { icon: <Type size={12} />, className: "boolean-type" };
    }
    return { icon: <Type size={12} />, className: "default-type" };
  };

  const typeInfo = getDataTypeIcon(column.data_type);

  return (
    <div className={cx("column-item")}>
      <div className={cx("column-main")}>
        <div className={cx("column-indent")} />

        <div className={cx("column-type-icon", typeInfo.className)}>
          {typeInfo.icon}
        </div>

        <div className={cx("column-info")}>
          <div className={cx("column-header")}>
            <span className={cx("column-name")}>{column.column_name}</span>
            <div className={cx("column-badges")}>
              {column.is_primary_key && (
                <span className={cx("badge", "primary-key")}>
                  <Key size={10} />
                  PK
                </span>
              )}
              {column.is_foreign_key && (
                <span className={cx("badge", "foreign-key")}>
                  <ExternalLink size={10} />
                  FK
                </span>
              )}
              {!column.is_nullable && (
                <span className={cx("badge", "not-null")}>NOT NULL</span>
              )}
            </div>
          </div>

          <div className={cx("column-meta")}>
            <span className={cx("data-type")}>{column.data_type}</span>
            {column.is_foreign_key && column.foreign_table_name && column.foreign_column_name && (
              <span className={cx("foreign-key-reference")}>
                <ExternalLink size={12} />
                {column.foreign_table_name}.{column.foreign_column_name}
              </span>
            )}
            {column.default_value && (
              <span className={cx("default-value")}>
                default: {column.default_value}
              </span>
            )}
            {column.description && (
              <span className={cx("column-description")}>
                {column.description}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={cx("column-actions")}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditModalOpen(true)}
          className={cx("action-button")}
        >
          <Edit3 size={12} />
        </Button>

        <div className={cx("dropdown-container")}>
          <Button
            variant="outline"
            size="sm"
            className={cx("action-button", "dropdown-trigger")}
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            <MoreHorizontal size={12} />
          </Button>

          {isDeleteConfirmOpen && (
            <div className={cx("dropdown-menu")}>
              <div className={cx("dropdown-header")}>
                <span>컬럼을 삭제하시겠습니까?</span>
                <p>이 작업은 되돌릴 수 없습니다.</p>
              </div>
              <div className={cx("dropdown-actions")}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDelete}
                  disabled={
                    deleteColumn.isPending || (column.is_primary_key ?? false)
                  }
                >
                  <Trash2 size={12} />
                  삭제
                </Button>
              </div>
              {column.is_primary_key && (
                <p className={cx("warning-text")}>
                  Primary Key는 삭제할 수 없습니다.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <ColumnModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        projectId={projectId}
        tableId={column.table_id}
        tableName=""
        column={column}
        onColumnUpdated={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}
