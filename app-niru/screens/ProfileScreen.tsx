import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert, ScrollView, FlatList, ActivityIndicator } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../services/supabase'
import { getPhotoHistory, deletePhotoFromHistory } from '../services/photoHistory'

type PhotoHistory = {
  id: string
  photo_url: string
  ingredients: string
  created_at: string
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
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

  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [])
  )

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setAvatarUrl(data.avatar_url || null)
    }

    setHistoryLoading(true)
    const history = await getPhotoHistory(user.id)
    setPhotoHistory(history)
    setHistoryLoading(false)
  }

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    })

    if (!result.canceled && result.assets[0].base64 && userId) {
      const base64 = result.assets[0].base64
      const path = `${userId}/avatar.jpg`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        })

      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const newUrl = data.publicUrl + '?t=' + Date.now()
        setAvatarUrl(newUrl)

        await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
        Alert.alert('Éxito', 'Foto de perfil actualizada')
      }
    }
  }

  async function handleSaveProfile() {
    if (!userId) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', userId)

    setLoading(false)

    if (error) Alert.alert('Error', 'No se pudo actualizar el perfil')
    else Alert.alert('Éxito', 'Perfil actualizado')
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) Alert.alert('Error', error.message)
    else {
      Alert.alert('Éxito', 'Contraseña actualizada')
      setNewPassword('')
    }
  }

  async function handleDeletePhoto(id: string, photoUrl: string) {
    const success = await deletePhotoFromHistory(id, photoUrl)
    if (success) setPhotoHistory(prev => prev.filter(p => p.id !== id))
    else Alert.alert('Error', 'No se pudo eliminar la foto')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mi Perfil</Text>

      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
        {avatarUrl
          ? <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}><Text style={styles.avatarPlaceholderText}>📷</Text></View>
        }
        <Text style={styles.avatarLabel}>Cambiar foto</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Información personal</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={lastName}
        onChangeText={setLastName}
      />
      <TouchableOpacity style={styles.button} onPress={handleSaveProfile} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Guardando...' : 'Guardar cambios'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.buttonSecondary} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.buttonSecondaryText}>Actualizar contraseña</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historial de fotos</Text>

      {historyLoading && <ActivityIndicator size="large" color="#2d6a4f" />}

      {!historyLoading && photoHistory.length === 0 && (
        <Text style={styles.empty}>No hay fotos en tu historial todavía.</Text>
      )}

      <FlatList
        data={photoHistory}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.photoCard}>
            <Image source={{ uri: item.photo_url }} style={styles.photoThumb} />
            <Text style={styles.photoIngredients} numberOfLines={2}>{item.ingredients}</Text>
            <TouchableOpacity style={styles.deletePhotoButton} onPress={() => handleDeletePhoto(item.id, item.photo_url)}>
              <Text style={styles.deletePhotoText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.photoGrid}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { fontSize: 32 },
  avatarLabel: { marginTop: 8, color: '#2d6a4f', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#2d6a4f', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonSecondaryText: { color: '#2d6a4f', fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#888', marginTop: 16 },
  photoGrid: { marginTop: 8 },
  photoCard: { flex: 1, margin: 6, borderRadius: 10, overflow: 'hidden', backgroundColor: '#f9f9f9', elevation: 2 },
  photoThumb: { width: '100%', height: 120 },
  photoIngredients: { fontSize: 11, color: '#555', padding: 6 },
  deletePhotoButton: { alignItems: 'center', paddingBottom: 6 },
  deletePhotoText: { fontSize: 16 },
})