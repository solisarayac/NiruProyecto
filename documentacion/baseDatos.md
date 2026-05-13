# Base de Datos — Niru

## Motor de base de datos

PostgreSQL administrado por Supabase.

---

## Diagrama de tablas

```
┌─────────────────────┐         ┌─────────────────────┐
│     auth.users      │         │      profiles        │
│─────────────────────│         │─────────────────────│
│ id (uuid) PK        │◄────────│ id (uuid) FK PK      │
│ email               │         │ first_name (text)    │
│ created_at          │         │ last_name (text)     │
└─────────────────────┘         │ avatar_url (text)    │
           │                    └─────────────────────┘
           │
           ├──────────────────────────────────────────┐
           │                                          │
           ▼                                          ▼
┌─────────────────────┐         ┌─────────────────────┐
│    saved_recipes    │         │    photo_history     │
│─────────────────────│         │─────────────────────│
│ id (uuid) PK        │         │ id (uuid) PK         │
│ user_id (uuid) FK   │         │ user_id (uuid) FK    │
│ recipe_id (int)     │         │ photo_url (text)     │
│ title (text)        │         │ ingredients (text)   │
│ image (text)        │         │ created_at           │
│ used (text)         │         └─────────────────────┘
│ missing (text)      │
│ created_at          │         ┌─────────────────────┐
└─────────────────────┘         │   random_recipes    │
                                │─────────────────────│
                                │ id (uuid) PK         │
                                │ user_id (uuid) UNIQUE│
                                │ recipes (jsonb)      │
                                │ created_at           │
                                └─────────────────────┘
```

---

## Descripción de tablas

### `profiles` 
Almacena la información personal del usuario, vinculada a `auth.users`.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | FK → auth.users(id), PK |
| first_name | text | Nombre del usuario |
| last_name | text | Apellido del usuario |
| avatar_url | text | URL de la foto de perfil en Storage |

---

### `saved_recipes`
Almacena las recetas guardadas como favoritas por cada usuario.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | FK → auth.users(id) |
| title | text | Nombre de la receta |
| image | text | URL de la imagen de la receta |
| used | text | Ingredientes disponibles (separados por coma) |
| missing | text | Ingredientes faltantes (separados por coma) |
| recipe_id | integer | ID de la receta en Spoonacular |
| created_at | timestamptz | Fecha de guardado |

---

### `photo_history`
Almacena el historial de fotos tomadas por el usuario dentro de la app.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | FK → auth.users(id) |
| photo_url | text | URL de la foto en Supabase Storage |
| ingredients | text | Ingredientes detectados en la foto |
| created_at | timestamptz | Fecha de la toma |

---

### `random_recipes`
Cache de recetas aleatorias por usuario. Se genera una sola vez para evitar consumo innecesario de la API de Spoonacular.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | UNIQUE, FK → auth.users(id) |
| recipes | jsonb | Array de recetas en formato JSON |
| created_at | timestamptz | Fecha de generación |

---

## Seguridad — Row Level Security (RLS)

Todas las tablas tienen RLS activado. Las políticas garantizan que cada usuario solo pueda acceder a sus propios datos.

### `profiles`
| Política | Operación | Condición |
|---|---|---|
| insert_own_profile | INSERT | `auth.uid() = id` |
| select_own_profile | SELECT | `auth.uid() = id` |
| update_own_profile | UPDATE | `auth.uid() = id` |

### `saved_recipes`
| Política | Operación | Condición |
|---|---|---|
| insert_own_recipes | INSERT | `auth.uid() = user_id` |
| select_own_recipes | SELECT | `auth.uid() = user_id` |
| delete_own_recipes | DELETE | `auth.uid() = user_id` |

### `photo_history`
| Política | Operación | Condición |
|---|---|---|
| insert_own_history | INSERT | `auth.uid() = user_id` |
| select_own_history | SELECT | `auth.uid() = user_id` |
| delete_own_history | DELETE | `auth.uid() = user_id` |

### `random_recipes`
| Política | Operación | Condición |
|---|---|---|
| insert_own_random | INSERT | `auth.uid() = user_id` |
| select_own_random | SELECT | `auth.uid() = user_id` |
| update_own_random | UPDATE | `auth.uid() = user_id` |

---

## Supabase Storage

### Bucket: `avatars`
Almacena fotos de perfil de los usuarios.
- Público: sí
- Estructura: `{user_id}/avatar.jpg`

### Bucket: `photo-history`
Almacena fotos tomadas por el usuario para el historial.
- Público: sí
- Estructura: `{user_id}/{timestamp}.jpg`