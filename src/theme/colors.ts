export const LIGHT_THEME_TOKENS = {
  pageBg: '#F6F7FB',
  cardBg: '#FFFFFF',
  cardShadow: '0 1px 2px rgba(20,22,31,.06), 0 4px 16px rgba(20,22,31,.06)',
  cardBorder: '#D9DCE8',
  raisedSurface: '#EEF0F8',
  textPrimary: '#14161F',
  textSecondary: '#555A70',
  textTertiary: '#6B7088',
  brandPurpleBtn: '#6D4AFF',
  brandPurpleBtnHover: '#5B3FE0',
  brandPurpleText: '#5B3FE0',
  brandPurpleTint: 'rgba(109, 74, 255, 0.12)',
  successGreenText: '#0B7A50',
  successGreenBg: 'rgba(11, 122, 80, 0.10)',
  urgencyOrangeText: '#A84B00',
  urgencyOrangeBg: 'rgba(168, 75, 0, 0.10)',
  errorRedText: '#C42B2B',
  errorRedBg: 'rgba(196, 43, 43, 0.10)',
  navSelectedPill: 'rgba(109, 74, 255, 0.12)',
  navSelectedLabel: '#5B3FE0',
  progressTrack: '#E3E6F0',
  inputBg: '#FFFFFF',
  inputBorder: '#C9CDDD',
  inputFocusRing: '#6D4AFF',
  inputHint: '#6B7088',
  iconDefault: '#555A70',
  iconActive: '#5B3FE0',
  practiceGradientFrom: '#5B3FE0',
  practiceGradientTo: '#0E9F78',
  evansBubbleBg: '#EEF0F8',
  evansBubbleText: '#14161F',
  userBubbleBg: '#6D4AFF',
  userBubbleText: '#FFFFFF',
  avatarRing: '#D9DCE8'
} as const;

export const DARK_THEME_TOKENS = {
  pageBg: '#0B0B10',
  cardBg: '#15151E',
  cardShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  raisedSurface: '#1D1D29',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  brandPurpleBtn: '#7C5CFC',
  brandPurpleBtnHover: '#6c4be8',
  brandPurpleText: '#7C5CFC',
  brandPurpleTint: 'rgba(124, 92, 252, 0.18)',
  successGreenText: '#00D4A1',
  successGreenBg: 'rgba(0, 212, 161, 0.15)',
  urgencyOrangeText: '#FF7A00',
  urgencyOrangeBg: 'rgba(255, 122, 0, 0.15)',
  errorRedText: '#EF4444',
  errorRedBg: 'rgba(239, 68, 68, 0.15)',
  navSelectedPill: 'rgba(124, 92, 252, 0.2)',
  navSelectedLabel: '#FFFFFF',
  progressTrack: 'rgba(255, 255, 255, 0.08)',
  inputBg: '#1D1D29',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputFocusRing: '#7C5CFC',
  inputHint: '#6B7280',
  iconDefault: '#9CA3AF',
  iconActive: '#7C5CFC',
  practiceGradientFrom: '#7C5CFC',
  practiceGradientTo: '#00D4A1',
  evansBubbleBg: '#15151E',
  evansBubbleText: '#F3F4F6',
  userBubbleBg: '#7C5CFC',
  userBubbleText: '#FFFFFF',
  avatarRing: 'rgba(255, 255, 255, 0.15)'
} as const;

export const COLORS = {
  primaryBlack: '#111111',
  primaryWhite: '#FFFFFF',
  surfaceLight: '#F6F7FB',
  surfaceDark: '#15151E',
  surfaceVariantDark: '#1D1D29',
  
  primaryAccent: '#7C5CFC',
  secondaryAccent: '#00D4A1',
  blueAccent: '#4D8CFF',
  dangerRed: '#EF4444',
  warningOrange: '#FFB020',
  successGreen: '#10B981',
  
  cardLight: '#FFFFFF',
  cardDark: '#15151E',
  backgroundLight: '#F6F7FB',
  backgroundDark: '#0B0B10',
  
  textPrimaryLight: '#14161F',
  textSecondaryLight: '#555A70',
  textPrimaryDark: '#FFFFFF',
  textSecondaryDark: '#B5B7C5',
  textMutedDark: '#8A8FA5',
};

// Course color tags: deeper, higher-contrast versions for light mode so they stay visible on #FFFFFF
export const COURSE_COLORS_DARK = [
  '#818CF8', // Indigo
  '#34D399', // Emerald
  '#F87171', // Red
  '#FBBF24', // Amber
  '#A78BFA', // Violet
  '#60A5FA', // Blue
  '#F472B6', // Pink
  '#9CA3AF', // Gray
  '#2DD4BF', // Teal
  '#FB923C'  // Orange
];

export const COURSE_COLORS_LIGHT = [
  '#4F46E5', // Deep Indigo (readable on white, 4.8:1 contrast)
  '#059669', // Deep Emerald
  '#DC2626', // Deep Red
  '#B45309', // Deep Amber
  '#7C3AED', // Deep Violet
  '#2563EB', // Deep Blue
  '#DB2777', // Deep Pink
  '#4B5563', // Deep Gray
  '#0D9488', // Deep Teal
  '#C2410C'  // Deep Orange
];

export const COURSE_COLORS = COURSE_COLORS_DARK;

export const getCourseColor = (index: number, isLight?: boolean) => {
  const isLightMode =
    isLight !== undefined
      ? isLight
      : typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  const palette = isLightMode ? COURSE_COLORS_LIGHT : COURSE_COLORS_DARK;
  return palette[index % palette.length] || palette[0];
};
