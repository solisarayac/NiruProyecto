import VerifyScreen from './VerifyScreen';
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../services/supabase";

function validatePassword(password: string): string | null {
  if (password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres";
  if (!/[A-Z]/.test(password)) return "Debe tener al menos una mayúscula";
  if (!/[0-9]/.test(password)) return "Debe tener al menos un número";
  if (!/[!@#$%^&*]/.test(password))
    return "Debe tener al menos un carácter especial (!@#$%^&*)";
  return null;
}

export default function LoginScreen() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false)

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permiso denegado", "Necesitamos acceso a tu galería");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64);
    }
  }

  async function uploadAvatar(
    userId: string,
    base64: string,
  ): Promise<string | null> {
    const path = `${userId}/avatar.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, decode(base64), {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  function decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresá email y contraseña");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
  }

  async function handleRegister() {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Por favor ingresá tu nombre y apellido')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      Alert.alert('Contraseña inválida', passwordError)
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error || !data.user) {
      Alert.alert('Error', error?.message || 'No se pudo crear la cuenta')
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
      // No hacemos return, igual mostramos verificación
    }

    setPendingVerification(true)
  }

if (pendingVerification) {
    return (
      <VerifyScreen
        email={email}
        firstName={firstName}
        lastName={lastName}
        avatarBase64={avatarBase64}
        onVerified={() => {
          setPendingVerification(false)
          setIsRegistering(false)
        }}
      />
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>App Recetas</Text>

      {isRegistering && (
        <>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={handlePickImage}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>📷 Foto de perfil</Text>
            )}
          </TouchableOpacity>

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
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {isRegistering && (
        <Text style={styles.passwordHint}>
          Mínimo 8 caracteres, una mayúscula, un número y un carácter especial
          (!@#$%^&*)
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={isRegistering ? handleRegister : handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? "Cargando..."
            : isRegistering
              ? "Crear Cuenta"
              : "Iniciar Sesión"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.buttonSecondaryText}>
          {isRegistering
            ? "¿Ya tenés cuenta? Iniciá sesión"
            : "¿No tenés cuenta? Registrate"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
    color: "#2d6a4f",
  },
  avatarPicker: {
    alignSelf: "center",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { fontSize: 14, color: "#666", textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  passwordHint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2d6a4f",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonSecondary: { padding: 14, alignItems: "center" },
  buttonSecondaryText: { color: "#2d6a4f", fontSize: 16 },
});
