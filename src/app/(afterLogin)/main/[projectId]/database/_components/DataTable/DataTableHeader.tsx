"use client";

import classNames from "classnames/bind";
import { ChevronDown, ChevronUp, Key, Link } from "lucide-react";

import { ColumnData } from "@/types/column";

import styles from "./DataTableHeader.module.css";

const cx = classNames.bind(styles);

interface DataTableHeaderProps {
  columns: ColumnData[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (columnName: string) => void;
}

export function DataTableHeader({ columns, sortBy, sortOrder, onSort }: DataTableHeaderProps) {
  const getSortIcon = (columnName: string) => {
    if (sortBy !== columnName) return null;
    return sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getColumnIcon = (column: ColumnData) => {
    if (column.is_primary_key) {
      return <Key size={14} className={cx("column-icon", "primary-key")} />;
    }
    if (column.is_foreign_key) {
      return <Link size={14} className={cx("column-icon", "foreign-key")} />;
    }
    return null;
  };

  return (
    <thead className={cx("table-header")}>
      <tr>
        {/* Selection checkbox column */}
        <th className={cx("header-cell", "selection-cell")}>
          <input type="checkbox" className={cx("checkbox")} />
        </th>
        
        {/* Data columns */}
        {columns.map((column) => (
          <th
            key={column.id}
            className={cx("header-cell", "sortable")}
            onClick={() => onSort(column.column_name)}
          >
            <div className={cx("header-content")}>
              <div className={cx("column-info")}>
                {getColumnIcon(column)}
                <span className={cx("column-name")}>{column.column_name}</span>
                <span className={cx("column-type")}>{column.data_type}</span>
              </div>
              
              <div className={cx("sort-indicator")}>
                {getSortIcon(column.column_name)}
              </div>
            </div>
            
            {/* Column metadata */}
            <div className={cx("column-meta")}>
              {!column.is_nullable && (
                <span className={cx("meta-tag", "required")}>필수</span>
              )}
              {column.is_primary_key && (
                <span className={cx("meta-tag", "primary")}>PK</span>
              )}
              {column.is_foreign_key && column.foreign_table_name && (
                <span className={cx("meta-tag", "foreign")}>
                  FK → {column.foreign_table_name}
                </span>
              )}
            </div>
          </th>
        ))}
        
        {/* Actions column */}
        <th className={cx("header-cell", "actions-cell")}>
          동작
        </th>
      </tr>
    </thead>
  );
}