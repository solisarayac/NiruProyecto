import { useEffect, useState, useRef } from 'react'
import { Animated } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../services/supabase'
import { Session } from '@supabase/supabase-js'
import LoginScreen from '../screens/LoginScreen'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // 2. Ref para la animación de opacidad
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  // 2. Efecto para disparar la animación cuando hay sesión
  useEffect(() => {
    if (session) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start()
    } else {
      // Opcional: resetear la animación si se cierra sesión
      fadeAnim.setValue(0)
    }
  }, [session])

  if (loading) return null
  if (!session) return <LoginScreen />

  // 3. Return reemplazado con Animated.View para el efecto de entrada
  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </Animated.View>
  )
}