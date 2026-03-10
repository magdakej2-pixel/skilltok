import { useMemo } from 'react';
import { Colors, RoleColors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '@/store';

/**
 * Returns the theme colors with role-based primary color override.
 * Experts get purple, students get teal.
 */
export function useRoleColors() {
  const colorScheme = useColorScheme() ?? 'dark';
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';

  return useMemo(() => {
    const base = Colors[colorScheme];
    const roleOverrides = RoleColors[role] || RoleColors.student;
    return {
      ...base,
      primary: roleOverrides.primary,
      primaryLight: roleOverrides.primaryLight,
      iconActive: roleOverrides.iconActive,
    };
  }, [colorScheme, role]);
}
