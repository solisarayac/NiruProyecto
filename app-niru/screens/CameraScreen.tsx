import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

export default function CameraScreen({ onImageCaptured }: { onImageCaptured: (base64: string) => void }) {
  const [imageUri, setImageUri] = useState<string | null>(null)

  async function handleOpenCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara para detectar ingredientes')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0].base64) {
      setImageUri(result.assets[0].uri)
      onImageCaptured(result.assets[0].base64)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detectar Ingredientes</Text>
      <Text style={styles.subtitle}>Tomá una foto de tus ingredientes</Text>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      <TouchableOpacity style={styles.button} onPress={handleOpenCamera}>
        <Text style={styles.buttonText}>📷 Abrir Cámara</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2d6a4f', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  preview: { width: 300, height: 300, borderRadius: 12, marginBottom: 24 },
  button: { backgroundColor: '#2d6a4f', padding: 16, borderRadius: 8, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
})