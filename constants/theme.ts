/**
 * QUELIO Design System — Colors, Typography, Spacing
 * Brand: Neon Pink (#FF2D78) + Soft Pink (#FF6CB5)
 * Supports dark and light mode.
 */

// Color palette
export const Colors = {
  light: {
    primary: '#FF2D78',        // Neon Pink — QUELIO brand
    primaryLight: '#FF6CB5',
    secondary: '#FF6CB5',      // Soft Pink accent
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    error: '#FF6B6B',
    success: '#51CF66',
    warning: '#FFD93D',
    heart: '#FF2D55',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    icon: '#6B7280',
    iconActive: '#FF2D78',
  },
  dark: {
    primary: '#FF2D78',        // Neon Pink — QUELIO brand
    primaryLight: '#FF6CB5',
    secondary: '#FF6CB5',
    background: '#0A0A12',
    surface: '#16161F',
    surfaceElevated: '#1E1E2A',
    text: '#F8F9FA',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D2D44',
    error: '#FF6B6B',
    success: '#51CF66',
    warning: '#FFD93D',
    heart: '#FF2D55',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#16161F',
    tabBarBorder: '#2D2D44',
    icon: '#9CA3AF',
    iconActive: '#FF2D78',
  },
};

// Role-based primary color overrides
export const RoleColors = {
  student: {
    primary: '#FF2D78',        // Neon Pink
    primaryLight: '#FF6CB5',
    iconActive: '#FF2D78',
  },
  teacher: {
    primary: '#9B59B6',        // Rich Purple
    primaryLight: '#BB8FCE',
    iconActive: '#9B59B6',
  },
};

// Typography
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
};

// Spacing scale (4px base)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Border radius
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Categories with icons and colors
export const CategoryConfig: Record<string, { icon: string; color: string }> = {
  ai: { icon: '🤖', color: '#9B59B6' },
  programming: { icon: '💻', color: '#00B894' },
  marketing: { icon: '📈', color: '#E17055' },
  business: { icon: '💼', color: '#0984E3' },
  finance: { icon: '💰', color: '#FDCB6E' },
  productivity: { icon: '⚡', color: '#FF6CB5' },
  design: { icon: '🎨', color: '#E84393' },
  entrepreneurship: { icon: '🚀', color: '#FF2D78' },
  'content-creator': { icon: '🎬', color: '#636E72' },
};

// Supported languages
export const Languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];
