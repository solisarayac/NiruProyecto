import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../services/supabase'

export default function VerifyScreen({ 
  email, 
  firstName,
  lastName,
  avatarBase64,
  onVerified 
}: { 
  email: string
  firstName: string
  lastName: string
  avatarBase64: string | null
  onVerified: () => void 
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
    const path = `${userId}/avatar.jpg`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  function decode(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }

  async function handleVerify() {
    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error || !data.user) {
      Alert.alert('Error', 'Código incorrecto o expirado')
      setLoading(false)
      return
    }

    const userId = data.user.id
    let avatarUrl = null

    if (avatarBase64) {
      avatarUrl = await uploadAvatar(userId, avatarBase64)
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: userId, first_name: firstName, last_name: lastName, avatar_url: avatarUrl })

    setLoading(false)

    if (profileError) {
      console.log('profileError:', JSON.stringify(profileError))
    }

    onVerified()
  }

  async function handleResend() {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) Alert.alert('Error', 'No se pudo reenviar el código')
    else Alert.alert('Éxito', 'Código reenviado, revisá tu correo')
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.buttonText}>{loading ? 'Verificando...' : 'Verificar Código'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={handleResend}>
        <Text style={styles.buttonSecondaryText}>Reenviar código</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#2d6a4f' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  email: { fontWeight: 'bold', color: '#2d6a4f' },
  input: { borderWidth: 2, borderColor: '#2d6a4f', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 32, letterSpacing: 8 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { padding: 14, alignItems: 'center' },
  buttonSecondaryText: { color: '#2d6a4f', fontSize: 16 },
})