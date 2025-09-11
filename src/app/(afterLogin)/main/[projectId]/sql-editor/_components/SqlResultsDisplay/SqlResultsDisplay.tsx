'use client';

import classNames from 'classnames/bind';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Table,
} from 'lucide-react';

import Button from '@/app/_components/Button/Button';
import { useSqlResults } from '@/hooks/sql/useSqlResults';
import { SqlQueryResponse } from '@/types/sql';

import styles from './SqlResultsDisplay.module.css';

const cx = classNames.bind(styles);

interface SqlResultsDisplayProps {
  result: SqlQueryResponse | null | undefined;
  error: Error | null;
  isLoading: boolean;
}

export default function SqlResultsDisplay({
  result,
  error,
  isLoading,
}: SqlResultsDisplayProps) {
  const {
    data,
    executionTime,
    hasData,
    handleDownloadCSV,
    handleDownloadJSON,
    formatCellValue,
  } = useSqlResults({ result });

  if (isLoading) {
    return (
      <div className={cx('results-container')}>
        <div className={cx('loading-state')}>
          <div className={cx('spinner')} />
          <span>쿼리 실행 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx('results-container')}>
        <div className={cx('error-state')}>
          <div className={cx('error-header')}>
            <AlertTriangle size={20} />
            <h3>쿼리 실행 오류</h3>
          </div>
          <div className={cx('error-message')}>{error.message}</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={cx('results-container')}>
        <div className={cx('empty-state')}>
          <FileText size={32} />
          <p>SQL 쿼리를 실행하면 결과가 여기에 표시됩니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('results-container')}>
      <div className={cx('results-header')}>
        <div className={cx('results-info')}>
          <CheckCircle size={16} className={cx('success-icon')} />
          <span className={cx('results-message')}>
            쿼리가 성공적으로 실행되었습니다
          </span>
          {executionTime && (
            <div className={cx('execution-time')}>
              <Clock size={12} />
              {executionTime}ms
            </div>
          )}
        </div>

        {hasData && (
          <div className={cx('export-buttons')}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
              className={cx('export-button')}
            >
              <Download size={12} />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJSON}
              className={cx('export-button')}
            >
              <Download size={12} />
              JSON
            </Button>
          </div>
        )}
      </div>

      {hasData ? (
        <div className={cx('results-content')}>
          <div className={cx('results-summary')}>
            <Table size={14} />
            {data.length}개의 행이 반환되었습니다
          </div>

          <div className={cx('table-container')}>
            <table className={cx('results-table')}>
              <thead>
                <tr>
                  {Object.keys(data[0]).map(column => (
                    <th key={column} className={cx('table-header')}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row, rowIndex) => (
                  <tr key={rowIndex} className={cx('table-row')}>
                    {Object.keys(data[0]).map(column => (
                      <td key={column} className={cx('table-cell')}>
                        <div className={cx('cell-content')}>
                          {formatCellValue(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 100 && (
            <div className={cx('table-footer')}>
              처음 100개 행만 표시됩니다. 전체 데이터를 보려면 CSV/JSON으로
              다운로드하세요.
            </div>
          )}
        </div>
      ) : (
        <div className={cx('no-data-state')}>
          <p>쿼리가 성공적으로 실행되었지만 반환된 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}