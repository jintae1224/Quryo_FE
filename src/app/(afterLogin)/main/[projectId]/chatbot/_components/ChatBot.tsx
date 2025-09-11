"use client";

import classNames from "classnames/bind";

import { useChatBot } from "@/hooks/chatbot/useChatBot";

import styles from "./ChatBot.module.css";
import { ChatInput } from "./ChatInput/ChatInput";
import { ChatMessages } from "./ChatMessages/ChatMessages";

const cx = classNames.bind(styles);

interface ChatBotProps {
  projectId: string;
}

export function ChatBot({ projectId }: ChatBotProps) {
  const {
    messages,
    inputValue,
    isConnecting,
    handleSubmit,
    handleInputChange,
  } = useChatBot({ projectId });

  return (
    <div className={cx("chatbot")}>
      <div className={cx("chatbot-container")}>
        <div className={cx("chat-area")}>
          <ChatMessages messages={messages} />

          <ChatInput
            value={inputValue}
            onInputChange={handleInputChange}
            onSendMessage={handleSubmit}
            isDisabled={isConnecting}
          />
        </div>
      </div>
    </div>
  );
}
