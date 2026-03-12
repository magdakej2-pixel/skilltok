import { useUIStore } from '@/store';

export function useColorScheme() {
  return useUIStore((state) => state.colorScheme);
}
