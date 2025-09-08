"use client";

import classNames from "classnames/bind";
import { useState } from "react";

import { useTableList } from "@/hooks/tables/useTableList";

import styles from "./DatabaseData.module.css";
import { DataTable } from "./DataTable/DataTable";
import { TableSelector } from "./TableSelector/TableSelector";

const cx = classNames.bind(styles);

interface DatabaseDataProps {
  projectId: string;
}

export default function DatabaseData({ projectId }: DatabaseDataProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>("");

  const { data: tables = [], isLoading: tablesLoading } =
    useTableList(projectId);

  return (
    <div className={cx("database-data")}>
      {/* Table Selector */}
      <div className={cx("selector-section")}>
        <TableSelector
          tables={tables}
          selectedTableId={selectedTableId}
          onTableSelect={setSelectedTableId}
          isLoading={tablesLoading}
        />
      </div>

      {/* Data Table */}
      {selectedTableId && (
        <div className={cx("data-section")}>
          <DataTable tableId={selectedTableId} projectId={projectId} />
        </div>
      )}

      {/* Empty State */}
      {!selectedTableId && !tablesLoading && (
        <div className={cx("empty-state")}>
          <div className={cx("empty-content")}>
            <h3>테이블을 선택하세요</h3>
            <p>데이터를 관리할 테이블을 위에서 선택해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
