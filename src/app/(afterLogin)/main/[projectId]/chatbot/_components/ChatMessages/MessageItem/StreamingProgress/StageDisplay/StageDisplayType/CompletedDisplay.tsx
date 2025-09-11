"use client";

import classNames from "classnames/bind";

import { CompletedData } from "@/types/chatbot";

import styles from "../StageDisplay.module.css";

const cx = classNames.bind(styles);

interface CompletedDisplayProps {
  data: CompletedData;
}

export function CompletedDisplay({ data }: CompletedDisplayProps) {
  return (
    <div className={cx("stage-data")}>
      <div className={cx("stage-section")}>
        <h5 className={cx("section-title")}>✅ 최종 결과</h5>
        <div className={cx("sql-container")}>
          <pre className={cx("sql-query")}>{data.final_result.sql_query}</pre>
        </div>
        <p className={cx("sql-explanation")}>{data.final_result.explanation}</p>
        <div className={cx("final-metadata")}>
          <span className={cx("complexity")}>
            복잡도: {data.final_result.query_complexity}
          </span>
          <span className={cx("confidence")}>
            신뢰도: {Math.round(data.final_result.confidence * 100)}%
          </span>
          <span className={cx("processing-time")}>
            처리시간: {Math.round(data.final_result.total_processing_time)}ms
          </span>
        </div>
      </div>
    </div>
  );
}
