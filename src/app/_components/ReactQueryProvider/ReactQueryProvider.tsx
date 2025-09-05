"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export default function ReactQueryProvider({
  children,
}: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분간 캐시 유지
            staleTime: 1000 * 60 * 5,
            // 백그라운드에서 자동 refetch 간격 (5분)
            refetchInterval: 1000 * 60 * 5,
            // 윈도우 포커스 시 refetch
            refetchOnWindowFocus: true,
            // 네트워크 재연결 시 refetch
            refetchOnReconnect: true,
            // 재시도 횟수
            retry: 3,
            // 재시도 지연 (지수 백오프)
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // 뮤테이션 재시도 횟수
            retry: 1,
            // 뮤테이션 재시도 지연
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
