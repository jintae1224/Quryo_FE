"use client";

import { ChevronDown, Database, Table } from "lucide-react";
import classNames from "classnames/bind";

import { TableData } from "@/types/table";
import { useTableDataStats } from "@/hooks/tableData/useTableDataStats";

import styles from "./TableSelector.module.css";

const cx = classNames.bind(styles);

interface TableSelectorProps {
  tables: TableData[];
  selectedTableId: string;
  onTableSelect: (tableId: string) => void;
  isLoading: boolean;
}

export function TableSelector({ 
  tables, 
  selectedTableId, 
  onTableSelect, 
  isLoading 
}: TableSelectorProps) {
  const selectedTable = tables.find(table => table.id === selectedTableId);

  return (
    <div className={cx("table-selector")}>
      <div className={cx("label")}>
        <Database size={18} />
        <span>테이블 선택</span>
      </div>

      <div className={cx("select-container")}>
        <select
          value={selectedTableId}
          onChange={(e) => onTableSelect(e.target.value)}
          className={cx("select")}
          disabled={isLoading}
        >
          <option value="">
            {isLoading ? "테이블을 로드하는 중..." : "테이블을 선택하세요"}
          </option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.table_name}
              {table.description && ` - ${table.description}`}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className={cx("select-icon")} />
      </div>

      {/* Selected Table Info */}
      {selectedTable && (
        <div className={cx("selected-info")}>
          <TableInfo table={selectedTable} />
        </div>
      )}
    </div>
  );
}

interface TableInfoProps {
  table: TableData;
}

function TableInfo({ table }: TableInfoProps) {
  const { data: stats } = useTableDataStats(table.id);

  return (
    <div className={cx("table-info")}>
      <div className={cx("table-header")}>
        <Table size={16} />
        <span className={cx("table-name")}>{table.table_name}</span>
      </div>
      
      {table.description && (
        <p className={cx("table-description")}>{table.description}</p>
      )}
      
      {stats && (
        <div className={cx("table-stats")}>
          <div className={cx("stat-item")}>
            <span className={cx("stat-label")}>총 레코드:</span>
            <span className={cx("stat-value")}>{stats.total_rows.toLocaleString()}개</span>
          </div>
          
          {stats.last_updated_at && (
            <div className={cx("stat-item")}>
              <span className={cx("stat-label")}>최근 업데이트:</span>
              <span className={cx("stat-value")}>
                {new Date(stats.last_updated_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}
          
          {stats.contributors_count > 0 && (
            <div className={cx("stat-item")}>
              <span className={cx("stat-label")}>기여자:</span>
              <span className={cx("stat-value")}>{stats.contributors_count}명</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}