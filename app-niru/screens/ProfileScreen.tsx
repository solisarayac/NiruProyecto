import { useEffect, useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, TextInput, Image, Alert, ScrollView, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import { getPhotoHistory, deletePhotoFromHistory } from '../services/photoHistory'
import { Spacing, Radius, Typography } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton'
import ConfirmModal from '../components/ConfirmModal'

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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; url: string } | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [photoHistory, setPhotoHistory] = useState<PhotoHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const { Colors, toggleTheme, isDark } = useTheme()
  const styles = getStyles(Colors)

  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(useCallback(() => { loadProfile() }, []))

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setUserEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setFirstName(data.first_name || ''); setLastName(data.last_name || ''); setAvatarUrl(data.avatar_url || null) }
    setHistoryLoading(true)
    const history = await getPhotoHistory(user.id)
    setPhotoHistory(history)
    setHistoryLoading(false)
    setInitialLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await loadProfile()
    } finally {
      setRefreshing(false)
    }
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
    if (!currentPassword) {
      showToast('Ingresá tu contraseña actual', 'error')
      return
    }
    if (newPassword.length < 8) {
      showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPassword,
    })

    if (signInError) {
      showToast('Contraseña actual incorrecta', 'error')
      setLoading(false)
      setShowForgotModal(true)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) {
      if (error.message.includes('different')) {
        showToast('La nueva contraseña debe ser diferente a la actual', 'error')
      } else {
        showToast(error.message, 'error')
      }
    } else {
      showToast('Contraseña actualizada', 'success')
      setCurrentPassword('')
      setNewPassword('')
    }
  }

  async function handleSendRecovery() {
    await supabase.auth.resetPasswordForEmail(userEmail)
    setShowForgotModal(false)
    showToast('Correo de recuperación enviado', 'success')
  }

  function handleDeletePhoto(id: string, photoUrl: string) {
    setPhotoToDelete({ id, url: photoUrl })
  }

  async function confirmDeletePhoto() {
    if (!photoToDelete) return
    const success = await deletePhotoFromHistory(photoToDelete.id, photoToDelete.url)
    if (success) setPhotoHistory(prev => prev.filter(p => p.id !== photoToDelete.id))
    else showToast('No se pudo eliminar la foto', 'error')
    setPhotoToDelete(null)
  }

  async function handleClearHistory() {
    if (!userId || photoHistory.length === 0) return
    setHistoryLoading(true)
    let allSuccess = true
    for (const item of photoHistory) {
      const success = await deletePhotoFromHistory(item.id, item.photo_url)
      if (!success) allSuccess = false
    }
    if (allSuccess) {
      setPhotoHistory([])
      showToast('Historial eliminado', 'success')
    } else {
      if (userId) {
        const history = await getPhotoHistory(userId)
        setPhotoHistory(history)
      }
      showToast('No se pudieron eliminar algunas fotos', 'error')
    }
    setHistoryLoading(false)
  }

  async function handleLogout() {
    setShowLogoutModal(true)
  }

  async function confirmLogout() {
    await supabase.auth.signOut()
  }

  if (initialLoading) return <ProfileSkeleton />

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressBackgroundColor={Colors.cardBackground || Colors.background}
            progressViewOffset={60}
          />
        }
      >
        <Text style={styles.brand}>Niru</Text>

        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder}><Text style={styles.avatarIcon}>👤</Text></View>
          }
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>Cambiar foto de perfil</Text>

        <Text style={styles.sectionTitle}>Información personal</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={firstName} onChangeText={setFirstName} placeholderTextColor={Colors.grayText} />
        <TextInput style={styles.input} placeholder="Apellido" value={lastName} onChangeText={setLastName} placeholderTextColor={Colors.grayText} />
        <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          placeholderTextColor={Colors.grayText}
        />
        <TextInput style={styles.input} placeholder="Nueva contraseña" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor={Colors.grayText} />
        <TouchableOpacity style={styles.buttonOutline} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.buttonOutlineText}>Actualizar contraseña</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Apariencia</Text>
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDark ? '☀️ Cambiar a modo claro' : '🌙 Cambiar a modo oscuro'}</Text>
        </TouchableOpacity>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitleNoMargin}>Historial de fotos</Text>
          {photoHistory.length > 0 && (
            <TouchableOpacity onPress={() => setShowClearHistoryModal(true)}>
              <Text style={styles.clearHistorial}>Eliminar todo</Text>
            </TouchableOpacity>
          )}
        </View>

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

      <ConfirmModal
        visible={showForgotModal}
        title="¿Olvidaste tu contraseña?"
        message="Te enviaremos un correo para que puedas restablecerla de forma segura."
        confirmText="Enviar correo"
        cancelText="Cancelar"
        onConfirm={handleSendRecovery}
        onCancel={() => setShowForgotModal(false)}
      />

      <ConfirmModal
        visible={showLogoutModal}
        title="Cerrar sesión"
        message="¿Seguro que querés cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <ConfirmModal
        visible={photoToDelete !== null}
        title="Eliminar foto"
        message="¿Seguro que querés eliminar esta foto del historial?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />

      <ConfirmModal
        visible={showClearHistoryModal}
        title="Eliminar historial"
        message="¿Seguro que querés eliminar todas las fotos del historial? Esta acción no se puede deshacer."
        confirmText="Eliminar todo"
        cancelText="Cancelar"
        onConfirm={async () => { setShowClearHistoryModal(false); await handleClearHistory() }}
        onCancel={() => setShowClearHistoryModal(false)}
      />
    </View>
  )
}

const getStyles = (Colors: any) => ({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 60 },
  brand: { fontSize: 48, fontWeight: '700' as const, fontStyle: 'italic' as const, color: Colors.primary, textAlign: 'center' as const, marginBottom: Spacing.lg },
  avatarContainer: { alignSelf: 'center' as const, width: 100, height: 100, borderRadius: 50, overflow: 'hidden' as const, marginBottom: Spacing.sm, borderWidth: 2, borderColor: Colors.primary },
  avatar: { width: '100%' as const, height: '100%' as const },
  avatarPlaceholder: { width: '100%' as const, height: '100%' as const, backgroundColor: Colors.grayBorder, justifyContent: 'center' as const, alignItems: 'center' as const },
  avatarIcon: { fontSize: 40 },
  avatarLabel: { textAlign: 'center' as const, color: Colors.grayText, fontSize: 13, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.black, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitleNoMargin: { fontSize: 16, fontWeight: '700' as const, color: Colors.black },
  historyHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  clearHistorial: { color: Colors.primary, fontSize: 13, fontWeight: '600' as const },
  input: { borderWidth: 1, borderColor: Colors.grayBorder, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontSize: 15, color: Colors.black, backgroundColor: Colors.inputBackground },
  button: { backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginBottom: Spacing.sm },
  buttonText: { color: Colors.white, fontSize: 15, fontWeight: '700' as const },
  buttonOutline: { borderWidth: 1, borderColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const },
  buttonOutlineText: { color: Colors.primary, fontSize: 15, fontWeight: '700' as const },
  themeToggle: { borderWidth: 1, borderColor: Colors.grayBorder, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const, marginBottom: Spacing.sm },
  themeToggleText: { fontSize: 15, color: Colors.black, fontWeight: '600' as const },
  empty: { textAlign: 'center' as const, color: Colors.grayText, marginTop: Spacing.md },
  grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, marginTop: Spacing.sm },
  photoCard: { width: '48%' as const, margin: '1%' as const, borderRadius: Radius.md, overflow: 'hidden' as const, backgroundColor: Colors.cardBackground || Colors.grayBorder, marginBottom: Spacing.sm },
  photoThumb: { width: '100%' as const, height: 110 },
  photoIngredients: { fontSize: 11, color: Colors.grayText, padding: Spacing.sm, paddingBottom: 2 },
  deletePhotoButton: { padding: Spacing.sm, alignItems: 'center' as const },
  deletePhotoText: { color: Colors.primary, fontSize: 12, fontWeight: '600' as const },
  logoutButton: { marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.grayBorder, padding: Spacing.md, borderRadius: Radius.full, alignItems: 'center' as const },
  logoutText: { color: Colors.grayText, fontSize: 15 },
})