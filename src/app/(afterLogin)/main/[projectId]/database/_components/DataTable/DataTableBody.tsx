"use client";

import { useState } from "react";
import classNames from "classnames/bind";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";

import { ColumnData } from "@/types/column";
import { TableRowData, RowDataValue } from "@/types/tableData";
import { useDeleteTableData } from "@/hooks/tableData/useDeleteTableData";

import styles from "./DataTableBody.module.css";

const cx = classNames.bind(styles);

interface DataTableBodyProps {
  columns: ColumnData[];
  rows: TableRowData[];
  tableId: string;
}

export function DataTableBody({ columns, rows, tableId }: DataTableBodyProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const deleteTableData = useDeleteTableData();

  const handleRowSelect = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map(row => row.id)));
    }
  };

  const handleDeleteRow = async (row: TableRowData) => {
    if (confirm(`이 행을 삭제하시겠습니까?`)) {
      try {
        await deleteTableData.mutateAsync({
          rowId: row.id,
          tableId: row.table_id
        });
      } catch (error) {
        console.error("Failed to delete row:", error);
        alert("행 삭제에 실패했습니다.");
      }
    }
  };

  const formatCellValue = (value: RowDataValue): string => {
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    return value.toString();
  };

  const getCellDisplayValue = (value: RowDataValue): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className={cx("null-value")}>NULL</span>;
    }
    
    if (typeof value === "boolean") {
      return (
        <span className={cx("boolean-value", value ? "true" : "false")}>
          {value ? "true" : "false"}
        </span>
      );
    }

    const stringValue = value.toString();
    if (stringValue.length > 100) {
      return (
        <span className={cx("long-text")} title={stringValue}>
          {stringValue.substring(0, 97)}...
        </span>
      );
    }

    return stringValue;
  };

  if (rows.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length + 2} className={cx("empty-row")}>
            데이터가 없습니다
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={cx("table-body")}>
      {rows.map((row, index) => (
        <tr
          key={row.id}
          className={cx("table-row", {
            selected: selectedRows.has(row.id),
            even: index % 2 === 0,
          })}
        >
          {/* Selection checkbox */}
          <td className={cx("cell", "selection-cell")}>
            <input
              type="checkbox"
              checked={selectedRows.has(row.id)}
              onChange={() => handleRowSelect(row.id)}
              className={cx("checkbox")}
            />
          </td>

          {/* Data cells */}
          {columns.map((column) => {
            const value = row.row_data[column.column_name];
            return (
              <td
                key={column.id}
                className={cx("cell", "data-cell", {
                  "primary-key": column.is_primary_key,
                  "foreign-key": column.is_foreign_key,
                  "null": value === null || value === undefined,
                })}
                title={formatCellValue(value)}
              >
                {getCellDisplayValue(value)}
              </td>
            );
          })}

          {/* Actions cell */}
          <td className={cx("cell", "actions-cell")}>
            <div className={cx("actions")}>
              <button
                className={cx("action-button", "edit")}
                title="수정"
                onClick={() => {
                  // TODO: Implement edit functionality
                  console.log("Edit row:", row.id);
                }}
              >
                <Edit size={14} />
              </button>

              <button
                className={cx("action-button", "delete")}
                title="삭제"
                onClick={() => handleDeleteRow(row)}
                disabled={deleteTableData.isPending}
              >
                <Trash2 size={14} />
              </button>

              <button
                className={cx("action-button", "more")}
                title="더보기"
                onClick={() => {
                  setExpandedRow(expandedRow === row.id ? null : row.id);
                }}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}