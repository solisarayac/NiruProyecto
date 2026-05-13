# Niru — App de Recetas con IA

Niru es una aplicación móvil que permite al usuario tomar una foto de sus ingredientes, detectarlos automáticamente mediante inteligencia artificial y obtener recetas personalizadas basadas en lo que tiene disponible.

---

## Tecnologías utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | React Native + Expo |
| Backend | Supabase Edge Functions (Deno) |
| Base de datos | Supabase (PostgreSQL) |
| Almacenamiento | Supabase Storage |
| Autenticación | Supabase Auth |
| Visión artificial | Google Cloud Vision API |
| Recetas | Spoonacular API |

---

## Funcionalidades implementadas

- Registro e inicio de sesión con verificación de correo electrónico
- Validación de contraseña segura
- Captura de imagen desde cámara o galería
- Detección de ingredientes usando Google Vision API
- Filtro inteligente de ingredientes usando Spoonacular
- Búsqueda de recetas basadas en ingredientes detectados
- Visualización de pasos de preparación por receta
- Guardar y eliminar recetas favoritas
- Recetas sugeridas aleatorias (cargadas una vez por usuario)
- Historial de fotos tomadas por el usuario
- Perfil de usuario editable (nombre, apelllido, foto, contraseña)
- Interfaz diseñada en Figma, trasladada direactamente a la aplicacion final

---

## Requisitos previos

- Node.js v18 o superior
- Expo CLI
- Cuenta en Supabase
- Cuenta en Google Cloud con Vision API habilitada (Da 300 dls como prueba gratuita)
- Cuenta en Spoonacular con API key habilitada (Es gratis, da 50 tokens por dia)

---

## Instalación

```bash
git clone https://github.com/solisarayac/NiruProyecto.git
cd app-niru
npm install
```

---

## Variables de entorno

Creá un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
EXPO_PUBLIC_SPOONACULAR_KEY=tu_spoonacular_key
```

---

## Secrets de Supabase Edge Functions

Configurar desde Supabase Dashboard → Settings → Secrets:

```
GOOGLE_VISION_KEY=tu_google_vision_key
SPOONACULAR_KEY=tu_spoonacular_key
```

---

## Ejecución

```bash
npx expo start
```

Escaneá el QR con Expo Go en tu dispositivo Android o iOS, los cambios se veran en vivo, en la terminal puedes ver
los comandos utiles para la APP

---

## Despliegue de Edge Functions

```bash
supabase login
supabase link
supabase functions deploy get-recipes
```

---

## Estructura del proyecto

```
app-niru/
├── app/
│   ├── _layout.tsx          # Layout raíz con autenticación
│   └── (tabs)/
│       ├── _layout.tsx      # Navegación por tabs
│       ├── index.tsx        # Pantalla principal
│       ├── favorites.tsx    # Pantalla de favoritos
│       └── profile.tsx      # Pantalla de perfil
├── screens/
│   ├── LoginScreen.tsx
│   ├── VerifyScreen.tsx
│   ├── CameraScreen.tsx
│   ├── RecipeDetailScreen.tsx
│   ├── FavoritesScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── RecipeCard.tsx
│   └── Toast.tsx
├── services/
│   ├── supabase.ts
│   ├── visionService.ts
│   ├── photoHistory.ts
│   └── randomRecipes.ts
├── hooks/
│   └── useToast.ts
├── constants/
│   └── theme.ts
└── supabase/
    └── functions/
        └── get-recipes/
            └── index.ts
```

---

## Funcionalidades pendientes

Ver [ROADMAP.md](./documentacion/goalsCalendario.mdROADMAP.md)

---

## Documentación técnica

- [Arquitectura del sistema](./documentacion/arquitectura.md)
- [Base de datos](./documentacion/baseDatos.md)