import { useEffect, useRef } from 'react'
import { Animated, View, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { Radius } from '../constants/theme'

export function SkeletonBox({ width, height, borderRadius = Radius.md, style }: {
  width: number | string
  height: number
  borderRadius?: number
  style?: any
}) {
  const { Colors, isDark } = useTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[
      { width, height, borderRadius, backgroundColor: isDark ? '#333' : '#E0E0E0', opacity },
      style
    ]} />
  )
}