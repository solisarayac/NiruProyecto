import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet, View } from 'react-native'
import { Colors, Radius, Spacing } from '../constants/theme'

type ToastType = 'success' | 'error' | 'info'

export default function Toast({ message, type = 'success', visible, onHide }: {
  message: string
  type?: ToastType
  visible: boolean
  onHide: () => void
}) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide())
    }
  }, [visible])

  if (!visible) return null

  const bgColor = type === 'success' ? Colors.green : type === 'error' ? Colors.primary : Colors.black

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor }]}>
      <Text style={styles.text}>
        {type === 'success' ? '✓  ' : type === 'error' ? '✕  ' : 'ℹ  '}{message}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 80, left: Spacing.lg, right: Spacing.lg, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center', zIndex: 999, elevation: 10 },
  text: { color: '#fff', fontWeight: '700', fontSize: 14 },
})