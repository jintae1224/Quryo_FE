"use client";

import classNames from "classnames/bind";
import { useEffect, useRef } from "react";

import { ChatMessage } from "@/types/chatbot";

import styles from "./ChatMessages.module.css";
import { MessageItem } from "./MessageItem/MessageItem";

const cx = classNames.bind(styles);

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={cx("chat-messages")}>
      <div className={cx("messages-container")}>
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
