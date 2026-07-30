import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { supabase } from '../services/supabase'
import { Spacing, Radius } from '../constants/theme'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useTheme } from '../context/ThemeContext'
import ConfirmModal from '../components/ConfirmModal'

export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { Colors } = useTheme()
  const styles = getStyles(Colors)

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSentModal, setShowSentModal] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  async function handleSend() {
    if (!email) { showToast('Ingresá tu correo', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      showToast('No se pudo enviar el correo', 'error')
    } else {
      setShowSentModal(true)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Niru</Text>

      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>Ingresá tu correo y te enviaremos un link para restablecer tu contraseña.</Text>

      <TextInput
        style={styles.input}
        placeholder="correoelectrónico@dominio.com"
        placeholderTextColor={Colors.grayText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar link'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Volver al inicio de sesión</Text>
      </TouchableOpacity>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />

      <ConfirmModal
        visible={showSentModal}
        title="Correo enviado ✉️"
        message={`Enviamos un link de recuperación a ${email}. Revisá tu bandeja de entrada.`}
        confirmText="Entendido"
        cancelText=""
        onConfirm={() => { setShowSentModal(false); onBack() }}
        onCancel={() => {}}
      />
    </View>
  )
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingTop: Spacing.xxl, alignItems: 'center' as const, justifyContent: 'center' as const },
  brand: { fontSize: 48, fontWeight: '700' as const, fontStyle: 'italic' as const, color: Colors.primary, marginBottom: Spacing.xl },
  title: { fontSize: 22, fontWeight: '700' as const, color: Colors.black, marginBottom: Spacing.sm, textAlign: 'center' as const },
  subtitle: { fontSize: 14, color: Colors.grayText, textAlign: 'center' as const, marginBottom: Spacing.xl, lineHeight: 22 },
  input: { width: '100%' as const, borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: 15, color: Colors.black, backgroundColor: Colors.inputBackground },
  button: { width: '100%' as const, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginBottom: Spacing.md },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' as const },
  backButton: { marginTop: Spacing.lg },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' as const },
})