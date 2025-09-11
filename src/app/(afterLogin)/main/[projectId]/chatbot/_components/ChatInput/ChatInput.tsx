"use client";

import classNames from "classnames/bind";
import { Send } from "lucide-react";

import { handleKeyDown } from "@/utils/common/keyboard";

import styles from "./ChatInput.module.css";

const cx = classNames.bind(styles);

interface ChatInputProps {
  value: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isDisabled?: boolean;
}

export function ChatInput({
  value,
  onInputChange,
  onSendMessage,
  isDisabled = false,
}: ChatInputProps) {
  return (
    <div className={cx("chat-input")}>
      <div className={cx("input-container")}>
        <textarea
          className={cx("input-field")}
          placeholder="질문을 입력하세요."
          value={value}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown(onSendMessage)}
          disabled={isDisabled}
          rows={3}
        />

        <button
          className={cx("send-button", {
            disabled: isDisabled || !value.trim(),
          })}
          onClick={onSendMessage}
          disabled={isDisabled || !value.trim()}
          type="button"
          aria-label="메시지 전송"
        >
          {isDisabled ? (
            <div className={cx("loading-spinner")} />
          ) : (
            <Send className={cx("send-icon")} size={20} />
          )}
        </button>
      </div>

      <div className={cx("input-hint")}>
        <span className={cx("hint-text")}>
          Enter로 전송 • Shift + Enter로 줄바꿈
        </span>
      </div>
    </div>
  );
}
