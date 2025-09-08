"use client";

import { useState } from "react";
import classNames from "classnames/bind";
import { Plus, Search, RefreshCw, Download, Upload } from "lucide-react";

import { useTableDataList } from "@/hooks/tableData/useTableDataList";
import { useColumnList } from "@/hooks/columns/useColumnList";
import { TableDataListParams } from "@/types/tableData";
import { DataTableHeader } from "./DataTableHeader";
import { DataTableBody } from "./DataTableBody";
import { DataTablePagination } from "./DataTablePagination";
import { DataFormSheet } from "../DataFormSheet/DataFormSheet";
import { useSheet } from "@/hooks/utils/useSheet";

import styles from "./DataTable.module.css";

const cx = classNames.bind(styles);

interface DataTableProps {
  tableId: string;
  projectId: string;
}

export function DataTable({ tableId, projectId }: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { isOpen: isSheetOpen, sheetRef, openSheet, closeSheet, onClose } = useSheet();

  // Table data query parameters
  const listParams: TableDataListParams = {
    table_id: tableId,
    page: currentPage,
    limit: pageSize,
    search: searchTerm.trim() || undefined,
    sort_by: sortBy,
    sort_order: sortOrder,
  };

  // Queries
  const { 
    data: tableData, 
    isLoading: dataLoading, 
    error: dataError,
    refetch: refetchData 
  } = useTableDataList(listParams);
  
  const { 
    data: columns = [], 
    isLoading: columnsLoading 
  } = useColumnList(tableId);

  const isLoading = dataLoading || columnsLoading;
  const hasData = tableData && tableData.rows.length > 0;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (columnName: string) => {
    if (sortBy === columnName) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnName);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refetchData();
  };

  if (dataError) {
    return (
      <div className={cx("error-state")}>
        <div className={cx("error-content")}>
          <h3>데이터 로드 오류</h3>
          <p>테이블 데이터를 불러오는 중 오류가 발생했습니다.</p>
          <button onClick={handleRefresh} className={cx("retry-button")}>
            <RefreshCw size={16} />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx("data-table")}>
      {/* Toolbar */}
      <div className={cx("toolbar")}>
        <div className={cx("toolbar-left")}>
          <div className={cx("search-box")}>
            <Search size={18} className={cx("search-icon")} />
            <input
              type="text"
              placeholder="데이터 검색..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={cx("search-input")}
            />
          </div>
        </div>

        <div className={cx("toolbar-right")}>
          <button onClick={handleRefresh} className={cx("tool-button")}>
            <RefreshCw size={16} />
            새로고침
          </button>
          
          <button className={cx("tool-button")}>
            <Download size={16} />
            내보내기
          </button>
          
          <button className={cx("tool-button")}>
            <Upload size={16} />
            가져오기
          </button>
          
          <button 
            onClick={openSheet}
            className={cx("primary-button")}
          >
            <Plus size={16} />
            행 추가
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className={cx("table-container")}>
        {isLoading ? (
          <div className={cx("loading-state")}>
            <div className={cx("loading-spinner")} />
            <p>데이터를 불러오는 중...</p>
          </div>
        ) : hasData ? (
          <>
            <div className={cx("table-wrapper")}>
              <table className={cx("table")}>
                <DataTableHeader
                  columns={columns}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <DataTableBody
                  columns={columns}
                  rows={tableData.rows}
                  tableId={tableId}
                />
              </table>
            </div>
            
            <DataTablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              total={tableData.total}
              hasMore={tableData.has_more}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </>
        ) : (
          <div className={cx("empty-state")}>
            <div className={cx("empty-content")}>
              <h3>데이터가 없습니다</h3>
              <p>이 테이블에는 아직 데이터가 없습니다.</p>
              <button 
                onClick={openSheet}
                className={cx("primary-button")}
              >
                <Plus size={16} />
                첫 번째 행 추가하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Form Sheet */}
      <DataFormSheet
        isOpen={isSheetOpen}
        onClose={closeSheet}
        sheetRef={sheetRef}
        tableId={tableId}
        columns={columns}
        mode="create"
      />
    </div>
  );
}