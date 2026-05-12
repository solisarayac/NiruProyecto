import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../services/supabase'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'

export default function VerifyScreen({
  email, firstName, lastName, avatarBase64, onVerified
}: {
  email: string, firstName: string, lastName: string, avatarBase64: string | null, onVerified: () => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
    const path = `${userId}/avatar.jpg`
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleVerify() {
    if (code.length !== 6) { Alert.alert('Error', 'El código debe tener 6 dígitos'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error || !data.user) { Alert.alert('Error', 'Código incorrecto o expirado'); setLoading(false); return }
    const userId = data.user.id
    let avatarUrl = null
    if (avatarBase64) avatarUrl = await uploadAvatar(userId, avatarBase64)
    await supabase.from('profiles').insert({ id: userId, first_name: firstName, last_name: lastName, avatar_url: avatarUrl })
    setLoading(false)
    onVerified()
  }

  async function handleResend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) Alert.alert('Error', 'No se pudo reenviar el código')
    else Alert.alert('Éxito', 'Código reenviado, revisá tu correo')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Niru</Text>
      <Text style={styles.title}>Verificá tu correo</Text>
      <Text style={styles.subtitle}>
        Enviamos un código de 6 dígitos a{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        textAlign="center"
      />

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Verificando...' : 'Continuar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend}>
        <Text style={styles.resend}>¿No recibiste el código? <Text style={styles.resendLink}>Reenviar</Text></Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: Spacing.lg, paddingTop: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  brand: { ...Typography.brandTitle, marginBottom: Spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: Colors.black, marginBottom: Spacing.sm },
  subtitle: { fontSize: 14, color: Colors.grayText, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 },
  email: { fontWeight: '700', color: Colors.primary },
  input: { width: '100%', borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg, fontSize: 32, letterSpacing: 8, textAlign: 'center' },
  button: { width: '100%', backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center', marginBottom: Spacing.md },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  resend: { fontSize: 13, color: Colors.grayText },
  resendLink: { fontWeight: '700', color: Colors.black },
})