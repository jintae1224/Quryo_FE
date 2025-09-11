"use client";

import classNames from "classnames/bind";

import { ChatBotStreamingResponse } from "@/types/chatbot";

import { ProgressBar } from "../../../../../../../../_components/ProgressBar/ProgressBar";
import { StageDisplay } from "./StageDisplay/StageDisplay";
import styles from "./StreamingProgress.module.css";

const cx = classNames.bind(styles);

interface StreamingProgressProps {
  streamingData: ChatBotStreamingResponse;
  isCompleted?: boolean;
}

const STAGE_NAMES = {
  starting: "분석 시작",
  table_selection: "테이블 선택",
  column_selection: "컬럼 선택",
  foreign_key_analysis: "외래키 분석",
  sql_generation: "SQL 생성",
  completed: "완료",
} as const;

const STAGE_DESCRIPTIONS = {
  starting: "Text-to-SQL 분석을 시작합니다",
  table_selection: "관련 테이블을 찾고 있습니다",
  column_selection: "필요한 컬럼을 선택하고 있습니다",
  foreign_key_analysis: "테이블 간의 관계를 분석하고 있습니다",
  sql_generation: "최적화된 SQL 쿼리를 생성하고 있습니다",
  completed: "분석이 완료되었습니다",
} as const;

export function StreamingProgress({
  streamingData,
  isCompleted = false,
}: StreamingProgressProps) {
  const { stage, message, progress, data } = streamingData;
  const displayProgress = isCompleted ? 100 : progress;

  return (
    <div className={cx("streaming-progress", { completed: isCompleted })}>
      <div className={cx("progress-header")}>
        <div className={cx("stage-info")}>
          <h4 className={cx("stage-name")}>
            {isCompleted ? "✓" : ""} {STAGE_NAMES[stage] || stage}
          </h4>
          <p className={cx("stage-message")}>
            {message || STAGE_DESCRIPTIONS[stage]}
          </p>
        </div>

        <div className={cx("progress-percentage", { completed: isCompleted })}>
          {displayProgress}%
        </div>
      </div>

      <ProgressBar progress={displayProgress} />

      <StageDisplay stage={stage} data={data} />
    </div>
  );
}
