"use client";

import classNames from "classnames/bind";

import { ColumnSelectionData } from "@/types/chatbot";

import styles from "../StageDisplay.module.css";

const cx = classNames.bind(styles);

interface ColumnSelectionDisplayProps {
  data: ColumnSelectionData;
}

export function ColumnSelectionDisplay({ data }: ColumnSelectionDisplayProps) {
  return (
    <div className={cx("stage-data")}>
      <div className={cx("stage-section")}>
        <h5 className={cx("section-title")}>🔧 선택된 컬럼</h5>
        <div className={cx("column-list")}>
          {data.selected_columns.map((column, index) => (
            <div key={index} className={cx("column-item")}>
              <div className={cx("column-header")}>
                <span className={cx("column-name")}>
                  {column.table_name}.{column.column_name}
                </span>
                <span className={cx("data-type")}>{column.data_type}</span>
                <span className={cx("confidence")}>
                  {Math.round(column.confidence * 100)}%
                </span>
              </div>
              <p className={cx("column-description")}>{column.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
