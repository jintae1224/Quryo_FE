"use client";

import classNames from "classnames/bind";

import { SqlGenerationData } from "@/types/chatbot";

import styles from "../StageDisplay.module.css";

const cx = classNames.bind(styles);

interface SqlGenerationDisplayProps {
  data: SqlGenerationData;
}

export function SqlGenerationDisplay({ data }: SqlGenerationDisplayProps) {
  return (
    <div className={cx("stage-data")}>
      <div className={cx("stage-section")}>
        <h5 className={cx("section-title")}>⚡ 생성된 SQL</h5>
        <div className={cx("sql-container")}>
          <pre className={cx("sql-query")}>{data.sql_query}</pre>
        </div>
        <p className={cx("sql-explanation")}>{data.explanation}</p>
        <div className={cx("sql-metadata")}>
          <span className={cx("confidence")}>
            신뢰도: {Math.round(data.confidence * 100)}%
          </span>
          {data.warnings.length > 0 && (
            <div className={cx("warnings")}>
              <span className={cx("warnings-label")}>⚠️ 주의사항:</span>
              {data.warnings.map((warning, index) => (
                <span key={index} className={cx("warning-item")}>
                  {warning}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
