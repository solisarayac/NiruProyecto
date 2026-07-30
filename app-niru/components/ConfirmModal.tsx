import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'
import { Spacing, Radius } from '../constants/theme'

export default function ConfirmModal({ visible, title, message, confirmText, cancelText, onConfirm, onCancel }: {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const { Colors } = useTheme()
  const styles = getStyles(Colors)

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
      {cancelText !== '' && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>{cancelText}</Text>
        </TouchableOpacity> 
      )}
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (Colors: any) => ({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: Spacing.lg },
  card: { width: '100%' as const, backgroundColor: Colors.cardBackground, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' as const },
  title: { fontSize: 18, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm, textAlign: 'center' as const },
  message: { fontSize: 14, color: Colors.grayText, textAlign: 'center' as const, marginBottom: Spacing.xl, lineHeight: 22 },
  confirmButton: { width: '100%' as const, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginBottom: Spacing.sm },
  confirmText: { color: Colors.white, fontWeight: '700' as const, fontSize: 15 },
  cancelButton: { width: '100%' as const, padding: Spacing.sm, alignItems: 'center' as const },
  cancelText: { color: Colors.grayText, fontSize: 14 },
})