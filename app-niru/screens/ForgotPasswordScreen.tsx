import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { supabase } from '../services/supabase'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

export default function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  async function handleSend() {
    if (!email) { showToast('Ingresá tu correo', 'error'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      showToast('No se pudo enviar el correo', 'error')
    } else {
      setSent(true)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Niru</Text>

      {!sent ? (
        <>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>Ingresá tu correo y te enviaremos un link para restablecer tu contraseña.</Text>

          <TextInput
            style={styles.input}
            placeholder="correoelectrónico@dominio.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.button} onPress={handleSend} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar link'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Revisá tu correo</Text>
          <Text style={styles.subtitle}>
            Enviamos un link de recuperación a{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </>
      )}

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Volver al inicio de sesión</Text>
      </TouchableOpacity>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: Spacing.lg, paddingTop: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  brand: { ...Typography.brandTitle, marginBottom: Spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: Colors.black, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.grayText, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  email: { fontWeight: '700', color: Colors.primary },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: 15 },
  button: { width: '100%', backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center', marginBottom: Spacing.md },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  backButton: { marginTop: Spacing.lg },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
})