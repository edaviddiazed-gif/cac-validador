"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers wrapper for client-side state management.
 * Includes TanStack Query for server state caching.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
