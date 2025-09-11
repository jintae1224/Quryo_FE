"use client";

import classNames from "classnames/bind";

import { TableSelectionData } from "@/types/chatbot";

import styles from "../StageDisplay.module.css";

const cx = classNames.bind(styles);

interface TableSelectionDisplayProps {
  data: TableSelectionData;
}

export function TableSelectionDisplay({ data }: TableSelectionDisplayProps) {
  return (
    <div className={cx("stage-data")}>
      <div className={cx("stage-section")}>
        <h5 className={cx("section-title")}>📊 선택된 테이블</h5>
        <div className={cx("table-list")}>
          {data.selected_tables.map((table, index) => (
            <div key={index} className={cx("table-item")}>
              <div className={cx("table-header")}>
                <span className={cx("table-name")}>{table.table_name}</span>
                <span className={cx("confidence")}>
                  {Math.round(table.confidence * 100)}%
                </span>
              </div>
              <p className={cx("table-description")}>{table.description}</p>
            </div>
          ))}
        </div>
        <div className={cx("metadata")}>
          <span className={cx("complexity")}>
            복잡도: {data.query_complexity}
          </span>
        </div>
      </div>
    </div>
  );
}
