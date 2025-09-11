"use client";

import { useCallback, useRef, useState } from "react";

import { ChatBotRequest, ChatBotStreamingResponse, CompletedData } from "@/types/chatbot";

interface UseChatBotStreamingParams {
  projectId: string;
  onMessageReceived: (data: ChatBotStreamingResponse) => void;
  onStreamComplete: (finalData: CompletedData) => void;
  onError: (errorMessage: string) => void;
}

export function useChatBotStreaming({
  projectId,
  onMessageReceived,
  onStreamComplete,
  onError,
}: UseChatBotStreamingParams) {
  const [isConnecting, setIsConnecting] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback(async (query: string) => {
    closeConnection();
    setIsConnecting(true);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const requestBody: ChatBotRequest = {
        project_id: projectId,
        query,
        target_database: "postgresql", // 기본값으로 설정, 나중에 사용자가 선택할 수 있도록 개선 가능
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/v1/text-to-sql/streaming`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split("\n");
          
          // 마지막 줄이 완전하지 않을 수 있으므로 buffer에 보관
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith("data: ")) {
              const jsonData = trimmedLine.substring(6).trim();
              
              if (jsonData === "[DONE]") {
                closeConnection();
                return;
              }

              if (jsonData) {
                try {
                  const parsedData: ChatBotStreamingResponse = JSON.parse(jsonData);
                  
                  // 에러 응답 체크
                  if (parsedData.message && parsedData.message.includes("오류가 발생했습니다")) {
                    // 에러 응답을 throw해서 catch 블록에서 처리
                    throw new Error(parsedData.message);
                  }
                  
                  onMessageReceived(parsedData);

                  if (parsedData.stage === "completed" && parsedData.data) {
                    onStreamComplete(parsedData.data as CompletedData);
                  }
                } catch (parseError) {
                  if (parseError instanceof Error && parseError.message.includes("오류가 발생했습니다")) {
                    // 서버에서 온 에러 메시지를 onError 콜백으로 처리
                    onError(parseError.message);
                    closeConnection();
                    return;
                  }
                  console.error("JSON parse error:", parseError, "Raw data:", jsonData);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        closeConnection();
      }
    } catch (error) {
      console.error("Streaming error:", error);
      closeConnection();
      onError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    }
  }, [projectId, onMessageReceived, onStreamComplete, onError, closeConnection]);

  return {
    isConnecting,
    sendMessage,
    closeConnection,
  };
}