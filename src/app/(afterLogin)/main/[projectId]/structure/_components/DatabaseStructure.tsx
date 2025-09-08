"use client";

import classNames from "classnames/bind";
import { AlertCircle, Loader2, Plus, Table } from "lucide-react";
import { useState } from "react";

import Button from "@/app/_components/Button/Button";
import { useTableList } from "@/hooks/tables/useTableList";

import styles from "./DatabaseStructure.module.css";
import TableItem from "./TableItem/TableItem";
import TableModal from "./TableModal/TableModal";

const cx = classNames.bind(styles);

interface DatabaseStructureProps {
  projectId: string;
}

export default function DatabaseStructure({
  projectId,
}: DatabaseStructureProps) {
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);

  const {
    data: tables = [],
    isLoading: tablesLoading,
    error: tablesError,
    refetch: refetchTables,
  } = useTableList(projectId);

  if (tablesLoading) {
    return (
      <div className={cx("loading-state")}>
        <Loader2 className={cx("loading-icon")} size={20} />
        <span className={cx("loading-text")}>
          데이터베이스 구조를 로딩중...
        </span>
      </div>
    );
  }

  if (tablesError) {
    const error = tablesError;
    return (
      <div className={cx("error-state")}>
        <AlertCircle className={cx("error-icon")} size={20} />
        <span className={cx("error-text")}>
          {error?.message || "데이터베이스 구조를 불러오는데 실패했습니다"}
        </span>
        <button className={cx("retry-button")} onClick={() => refetchTables()}>
          다시 시도
        </button>
      </div>
    );
  }


  return (
    <div className={cx("database-structure")}>
      {/* Tables Section */}
      <div className={cx("tables-section")}>
        <div className={cx("section-header")}>
          <div className={cx("section-info")}>
            <Table className={cx("section-icon")} size={16} />
            <h3 className={cx("section-title")}>Tables ({tables.length})</h3>
          </div>
          <div className={cx("section-actions")}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddTableModalOpen(true)}
            >
              <Plus size={16} />
              테이블 추가
            </Button>
          </div>
        </div>

        <div className={cx("tables-container")}>
          {tables.length === 0 ? (
            <div className={cx("empty-state")}>
              <Table className={cx("empty-icon")} size={32} />
              <h4 className={cx("empty-title")}>아직 테이블이 없습니다</h4>
              <p className={cx("empty-description")}>
                첫 번째 테이블을 생성하여 데이터베이스 스키마를 구축해보세요
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddTableModalOpen(true)}
              >
                <Plus size={16} />
                테이블 추가
              </Button>
            </div>
          ) : (
            <div className={cx("tables-list")}>
              {tables.map((table) => (
                <TableItem key={table.id} table={table} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      <TableModal
        isOpen={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        mode="create"
        projectId={projectId}
        onTableCreated={() => setIsAddTableModalOpen(false)}
      />
    </div>
  );
}
