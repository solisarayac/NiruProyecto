export const LightColors = {
  primary: '#C0392B',
  primaryLight: '#FADBD8',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  grayText: '#888888',
  grayBorder: '#E0E0E0',
  green: '#27AE60',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
}

export const DarkColors = {
  primary: '#E74C3C',
  primaryLight: '#4A1A1A',
  black: '#FFFFFF',
  white: '#1A1A1A',
  gray: '#2A2A2A',
  grayText: '#AAAAAA',
  grayBorder: '#333333',
  green: '#2ECC71',
  background: '#121212',
  cardBackground: '#1E1E1E',
  inputBackground: '#2A2A2A',
}

export const Colors = LightColors

export const Typography = {
  brandTitle: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#C0392B',
    fontStyle: 'italic' as const,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#C0392B',
    fontWeight: '400' as const,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#C0392B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  body: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  caption: {
    fontSize: 12,
    color: '#888888',
  },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
}