import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import { getPhotoHistory, deletePhotoFromHistory } from '../services/photoHistory'
import { Colors, Spacing, Radius, Typography } from '../constants/theme'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

type PhotoHistory = {
  id: string
  photo_url: string
  ingredients: string
  created_at: string
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoHistory, setPhotoHistory] = useState<PhotoHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(useCallback(() => { loadProfile() }, []))

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setFirstName(data.first_name || ''); setLastName(data.last_name || ''); setAvatarUrl(data.avatar_url || null) }
    setHistoryLoading(true)
    const history = await getPhotoHistory(user.id)
    setPhotoHistory(history)
    setHistoryLoading(false)
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1] })
    if (!result.canceled && result.assets[0].base64 && userId) {
      const base64 = result.assets[0].base64
      const path = `${userId}/avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const newUrl = data.publicUrl + '?t=' + Date.now()
        setAvatarUrl(newUrl)
        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
      }
    }
  }

  async function handleSaveProfile() {
    if (!userId) return
    setLoading(true)
    const { error } = await supabase.from('profiles').update({ first_name: firstName, last_name: lastName }).eq('id', userId)
    setLoading(false)
    if (error) showToast('No se pudo actualizar el perfil', 'error')
    else showToast('Perfil actualizado', 'success')
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) { Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) showToast(error.message, 'error')
    else { showToast('Contraseña actualizada', 'success'); setNewPassword('') }
  }

  async function handleDeletePhoto(id: string, photoUrl: string) {
    const success = await deletePhotoFromHistory(id, photoUrl)
    if (success) setPhotoHistory(prev => prev.filter(p => p.id !== id))
    else Alert.alert('Error', 'No se pudo eliminar la foto')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.brand}>Niru</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarIcon}>👤</Text></View>
          }
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>Cambiar foto de perfil</Text>

        <Text style={styles.sectionTitle}>Información personal</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Apellido" value={lastName} onChangeText={setLastName} />
        <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <TextInput style={styles.input} placeholder="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TouchableOpacity style={styles.buttonOutline} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.buttonOutlineText}>Actualizar contraseña</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Historial de fotos</Text>
        {historyLoading && <ActivityIndicator size="large" color={Colors.primary} />}
        {!historyLoading && photoHistory.length === 0 && (
          <Text style={styles.empty}>No hay fotos en tu historial todavía.</Text>
        )}
        <View style={styles.grid}>
          {photoHistory.map(item => (
            <View key={item.id} style={styles.photoCard}>
              <Image source={{ uri: item.photo_url }} style={styles.photoThumb} />
              <Text style={styles.photoIngredients} numberOfLines={2}>{item.ingredients || 'Sin ingredientes'}</Text>
              <TouchableOpacity style={styles.deletePhotoButton} onPress={() => handleDeletePhoto(item.id, item.photo_url)}>
                <Text style={styles.deletePhotoText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={hideToast} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 60 },
  brand: { ...Typography.brandTitle, textAlign: 'center', marginBottom: Spacing.lg },
  avatarContainer: { alignSelf: 'center', width: 100, height: 100, borderRadius: 50, overflow: 'hidden', marginBottom: Spacing.sm, borderWidth: 2, borderColor: Colors.primary },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', backgroundColor: Colors.gray, justifyContent: 'center', alignItems: 'center' },
  avatarIcon: { fontSize: 40 },
  avatarLabel: { textAlign: 'center', color: Colors.grayText, fontSize: 13, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.black, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: 15 },
  button: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center', marginBottom: Spacing.sm },
  buttonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  buttonOutline: { borderWidth: 1, borderColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' },
  buttonOutlineText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.grayText, marginTop: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm },
  photoCard: { width: '48%', margin: '1%', borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.gray, marginBottom: Spacing.sm },
  photoThumb: { width: '100%', height: 110 },
  photoIngredients: { fontSize: 11, color: Colors.grayText, padding: Spacing.sm, paddingBottom: 2 },
  deletePhotoButton: { padding: Spacing.sm, alignItems: 'center' },
  deletePhotoText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  logoutButton: { marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.grayBorder, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' },
  logoutText: { color: Colors.grayText, fontSize: 15 },
})