/**
 * QUELIO Design System — Colors, Typography, Spacing
 * Supports dark and light mode.
 */

// Color palette
export const Colors = {
  light: {
    primary: '#4ECDC4',        // Teal — QUELIO brand
    primaryLight: '#6EE7DE',
    secondary: '#00CEC9',      // Teal accent
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
    heart: '#FF6B6B',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    icon: '#6B7280',
    iconActive: '#4ECDC4',
  },
  dark: {
    primary: '#4ECDC4',        // Teal — QUELIO brand
    primaryLight: '#6EE7DE',
    secondary: '#6C5CE7',
    background: '#0F0F1A',
    surface: '#1A1A2E',
    surfaceElevated: '#252540',
    text: '#F8F9FA',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    border: '#2D2D44',
    error: '#FF6B6B',
    success: '#51CF66',
    warning: '#FFD93D',
    heart: '#FF6B6B',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1A1A2E',
    tabBarBorder: '#2D2D44',
    icon: '#9CA3AF',
    iconActive: '#4ECDC4',
  },
};

// Role-based primary color overrides
export const RoleColors = {
  student: {
    primary: '#4ECDC4',        // Teal
    primaryLight: '#6EE7DE',
    iconActive: '#4ECDC4',
  },
  teacher: {
    primary: '#6C5CE7',        // Purple
    primaryLight: '#A29BFE',
    iconActive: '#6C5CE7',
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
  ai: { icon: '🤖', color: '#6C5CE7' },
  programming: { icon: '💻', color: '#00B894' },
  marketing: { icon: '📈', color: '#E17055' },
  business: { icon: '💼', color: '#0984E3' },
  finance: { icon: '💰', color: '#FDCB6E' },
  productivity: { icon: '⚡', color: '#00CEC9' },
  design: { icon: '🎨', color: '#E84393' },
  entrepreneurship: { icon: '🚀', color: '#FF7675' },
  'content-creator': { icon: '🎬', color: '#636E72' },
};

// Supported languages
export const Languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];
