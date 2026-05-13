import { useState, useRef } from "react";
import {
  Animated,
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
import VerifyScreen from "./VerifyScreen";
import { Colors, Typography, Spacing, Radius } from "../constants/theme";

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
  const [isRegistering, setIsRegistering] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  // 2. Ref de animación inicializado según el estado inicial
  const toggleAnim = useRef(new Animated.Value(isRegistering ? 0 : 1)).current;

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

  function decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
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
      Alert.alert("Error", "Por favor ingresá tu nombre y apellido");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Contraseña inválida", passwordError);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      Alert.alert("Error", error?.message || "No se pudo crear la cuenta");
      setLoading(false);
      return;
    }
    const userId = data.user.id;
    let avatarUrl = null;
    if (avatarBase64) avatarUrl = await uploadAvatar(userId, avatarBase64);
    await supabase
      .from("profiles")
      .insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      });
    setLoading(false);
    setPendingVerification(true);
  }

  if (pendingVerification) {
    return (
      <VerifyScreen
        email={email}
        firstName={firstName}
        lastName={lastName}
        avatarBase64={avatarBase64}
        onVerified={() => {
          setPendingVerification(false);
          setIsRegistering(false);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>Niru</Text>

      {/* 4. Toggle Reemplazado con Animated.View */}
      <View style={styles.toggleContainer}>
        <Animated.View
          style={[
            styles.toggleSlider,
            {
              transform: [
                {
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 150], // Ajustado según el ancho usual para que cubra la mitad
                  }),
                },
              ],
            },
          ]}
        />
        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => {
            setIsRegistering(true);
            Animated.spring(toggleAnim, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }}
        >
          <Text
            style={[
              styles.toggleText,
              isRegistering && styles.toggleTextActive,
            ]}
          >
            Crear una cuenta
          </Text>
        </TouchableOpacity>

        <View style={styles.toggleDivider} />

        <TouchableOpacity
          style={styles.toggleOption}
          onPress={() => {
            setIsRegistering(false);
            Animated.spring(toggleAnim, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }}
        >
          <Text
            style={[
              styles.toggleText,
              !isRegistering && styles.toggleTextActive,
            ]}
          >
            Inicia Sesión
          </Text>
        </TouchableOpacity>
      </View>

      {isRegistering && (
        <>
          <TouchableOpacity
            style={styles.avatarPicker}
            onPress={handlePickImage}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Foto de perfil.</Text>
          <TextInput
            style={styles.input}
            placeholder="Primer Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Apellidos"
            value={lastName}
            onChangeText={setLastName}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="correoelectrónico@dominio.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder={isRegistering ? "Contraseña..." : "contraseña"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={isRegistering ? handleRegister : handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Cargando..." : "Continuar"}
        </Text>
      </TouchableOpacity>

      {!isRegistering && (
        <Text style={styles.forgotText}>
          ¿Olvidaste la contraseña?{" "}
          <Text style={styles.forgotLink}>Recupérala aquí</Text>
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    alignItems: "center",
  },
  brand: { ...Typography.brandTitle, marginBottom: Spacing.xl },
  // 5. Estilos actualizados del Toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  toggleSlider: {
    position: "absolute",
    width: "50%",
    height: "88%",
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    top: "6%",
    left: 3,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: { fontSize: 15, fontWeight: "600", color: Colors.white },
  toggleTextActive: { color: Colors.black },
  toggleDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.white,
    opacity: 0.4,
  },

  avatarPicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FDF5F5",
  },
  avatarLabel: {
    ...Typography.caption,
    marginBottom: Spacing.lg,
    color: Colors.grayText,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.grayBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    fontSize: 15,
    color: Colors.black,
  },
  button: {
    width: "100%",
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: Radius.full,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  forgotText: { marginTop: Spacing.md, fontSize: 13, color: Colors.grayText },
  forgotLink: { fontWeight: "700", color: Colors.black },
});
