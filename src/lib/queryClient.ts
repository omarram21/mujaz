import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        const code = (error as { code?: string }).code;
        // Don't retry permission/validation errors.
        if (code && ['42501', 'PGRST116', '23505', '23P01', '22023'].includes(code)) return false;
        return count < 2;
      },
    },
  },
});
