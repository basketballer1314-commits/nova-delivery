import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const DAY_MS = 1000 * 60 * 60 * 24

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: DAY_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
})
