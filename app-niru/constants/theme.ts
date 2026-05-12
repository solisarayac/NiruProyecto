/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#C0392B',
  primaryLight: '#FADBD8',
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  grayText: '#888888',
  grayBorder: '#E0E0E0',
  green: '#27AE60',
  background: '#FFFFFF',
}

export const Typography = {
  brandTitle: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.primary,
    fontStyle: 'italic' as const,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '400' as const,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.black,
  },
  body: {
    fontSize: 14,
    color: Colors.black,
  },
  caption: {
    fontSize: 12,
    color: Colors.grayText,
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