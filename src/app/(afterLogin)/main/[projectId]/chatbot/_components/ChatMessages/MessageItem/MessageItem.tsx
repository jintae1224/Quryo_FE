"use client";

import classNames from "classnames/bind";

import { ChatMessage } from "@/types/chatbot";

import styles from "./MessageItem.module.css";
import { StreamingProgress } from "./StreamingProgress/StreamingProgress";

const cx = classNames.bind(styles);

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.type === "user";
  const isStreaming = message.isStreaming && message.streamingData;

  return (
    <div className={cx("message-item", { user: isUser, assistant: !isUser })}>
      <div className={cx("message-wrapper")}>
        <div className={cx("message-content")}>
          <div className={cx("message-body")}>
            {isUser ? (
              <div className={cx("message-text")}>{message.content}</div>
            ) : (
              <div className={cx("analysis-container")}>
                {message.allStreamingData &&
                  message.allStreamingData.length > 0 && (
                    <div className={cx("completed-steps")}>
                      {message.allStreamingData.map((data, index) => (
                        <StreamingProgress
                          key={index}
                          streamingData={data}
                          isCompleted={
                            !isStreaming ||
                            data.stage !== message.streamingData?.stage
                          }
                        />
                      ))}
                    </div>
                  )}

                {/* 최종 결과 표시 */}
                {message.finalData && !isStreaming && (
                  <div className={cx("final-result")}>
                    <div className={cx("sql-result-header")}>
                      <h4 className={cx("result-title")}>✅ 생성된 SQL 쿼리</h4>
                    </div>
                    <div className={cx("sql-code-block")}>
                      <pre className={cx("sql-code")}>
                        {message.finalData.final_result.sql_query}
                      </pre>
                    </div>
                    <div className={cx("sql-explanation")}>
                      <p>{message.finalData.final_result.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
