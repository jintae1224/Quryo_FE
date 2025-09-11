"use client";

import { useCallback, useState } from "react";

import { ChatMessage } from "@/types/chatbot";

import { useChatBotStreaming } from "./useChatBotStreaming";

interface UseChatBotParams {
  projectId: string;
}

export function useChatBot({ projectId }: UseChatBotParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");

  const { isConnecting, sendMessage } = useChatBotStreaming({
    projectId,
    onMessageReceived: (streamingData) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage?.isStreaming) {
          const currentAllStreamingData = lastMessage.allStreamingData || [];
          
          // 같은 단계의 데이터가 이미 있는지 확인
          const existingStageIndex = currentAllStreamingData.findIndex(
            data => data.stage === streamingData.stage
          );
          
          let updatedAllStreamingData;
          if (existingStageIndex >= 0) {
            // 같은 단계 데이터 업데이트
            updatedAllStreamingData = [...currentAllStreamingData];
            updatedAllStreamingData[existingStageIndex] = streamingData;
          } else {
            // 새로운 단계 데이터 추가
            updatedAllStreamingData = [...currentAllStreamingData, streamingData];
          }
          
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              streamingData,
              content: streamingData.message,
              allStreamingData: updatedAllStreamingData,
            },
          ];
        }
        
        return prev;
      });
    },
    onStreamComplete: (finalData) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage?.isStreaming) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              isStreaming: false,
              content: finalData.final_result.sql_query,
              finalData,
              streamingData: undefined,
            },
          ];
        }
        
        return prev;
      });
    },
    onError: (errorMessage) => {
      // 스트리밍 중 에러 발생시 처리
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        
        if (lastMessage?.isStreaming) {
          return [
            ...prev.slice(0, -1),
            {
              ...lastMessage,
              isStreaming: false,
              content: errorMessage,
              streamingData: undefined,
            },
          ];
        }
        
        return prev;
      });
    },
  });

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isConnecting) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: "assistant",
      content: "분석을 시작합니다...",
      timestamp: new Date(),
      isStreaming: true,
      allStreamingData: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    
    await sendMessage(inputValue.trim());
    setInputValue("");
  }, [inputValue, isConnecting, sendMessage]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isConnecting) return;
    handleSendMessage();
  }, [inputValue, isConnecting, handleSendMessage]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  return {
    messages,
    inputValue,
    isConnecting,
    handleSendMessage,
    handleSubmit,
    handleInputChange,
  };
}