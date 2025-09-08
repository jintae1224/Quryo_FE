"use client";

import classNames from "classnames/bind";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import styles from "./DataTablePagination.module.css";

const cx = classNames.bind(styles);

interface DataTablePaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function DataTablePagination({
  currentPage,
  pageSize,
  total,
  hasMore,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const canGoPrevious = currentPage > 1;
  const canGoNext = hasMore || currentPage < totalPages;

  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cx("pagination")}>
      {/* Info */}
      <div className={cx("pagination-info")}>
        <div className={cx("info-text")}>
          {total > 0 ? (
            <>
              {startItem.toLocaleString()}-{endItem.toLocaleString()} / {total.toLocaleString()}개
              {hasMore && " (더 많은 데이터가 있을 수 있음)"}
            </>
          ) : (
            "데이터 없음"
          )}
        </div>

        {/* Page size selector */}
        <div className={cx("page-size-selector")}>
          <label htmlFor="pageSize" className={cx("page-size-label")}>
            페이지당:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cx("page-size-select")}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}개
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className={cx("pagination-controls")}>
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
            className={cx("page-button")}
            title="첫 페이지"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoPrevious}
            className={cx("page-button")}
            title="이전 페이지"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page numbers */}
          <div className={cx("page-numbers")}>
            {visiblePages[0] > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className={cx("page-number")}
                >
                  1
                </button>
                {visiblePages[0] > 2 && (
                  <span className={cx("page-ellipsis")}>...</span>
                )}
              </>
            )}

            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cx("page-number", {
                  active: pageNum === currentPage,
                })}
              >
                {pageNum}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className={cx("page-ellipsis")}>...</span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className={cx("page-number")}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className={cx("page-button")}
            title="다음 페이지"
          >
            <ChevronRight size={16} />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext || currentPage === totalPages}
            className={cx("page-button")}
            title="마지막 페이지"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}