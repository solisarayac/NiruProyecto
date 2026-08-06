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
           │                    │ created_at            │
           │                    └─────────────────────┘
           ├───────────────────┬──────────────────────┬──────────────────┐
           │                   │                       │                  │
           ▼                   ▼                       ▼                  ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│    saved_recipes    │ │    photo_history     │ │    random_recipes    │ │    shopping_list     │
│─────────────────────│ │─────────────────────│ │─────────────────────│ │─────────────────────│
│ id (uuid) PK         │ │ id (uuid) PK          │ │ id (uuid) PK          │ │ id (uuid) PK          │
│ user_id (uuid) FK    │ │ user_id (uuid) FK     │ │ user_id (uuid) UNIQUE │ │ user_id (uuid) FK     │
│ recipe_id (int)      │ │ photo_url (text)      │ │ recipes (jsonb)       │ │ ingredient (text)     │
│ title (text)         │ │ ingredients (text)    │ │ created_at            │ │ checked (bool)        │
│ image (text)         │ │ created_at            │ └─────────────────────┘ │ created_at            │
│ used (text)          │ └─────────────────────┘                          └─────────────────────┘
│ missing (text)       │
│ from_suggestions     │
│ from_manual_search    │
│ created_at            │
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
| created_at | timestamptz | Fecha de creación del perfil |

---

### `saved_recipes`
Almacena las recetas guardadas como favoritas por cada usuario, indicando su origen.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | FK → auth.users(id) |
| recipe_id | integer | ID de la receta en Spoonacular |
| title | text | Nombre de la receta (usado como clave de dedupe en la UI) |
| image | text | URL de la imagen de la receta |
| used | text | Ingredientes disponibles, separados por coma (vacío si no aplica) |
| missing | text | Ingredientes faltantes, separados por coma (vacío si no aplica) |
| from_suggestions | boolean | `true` si se guardó desde "Recetas sugeridas" (aleatorias) |
| from_manual_search | boolean | `true` si se guardó desde la búsqueda manual (pantalla Explorar) |
| created_at | timestamptz | Fecha de guardado |

> Cuando `from_suggestions` o `from_manual_search` son `true`, `used`/`missing` quedan vacíos porque esos flujos no comparan ingredientes disponibles — la UI de Favoritos oculta esa sección y muestra un badge indicando el origen.

---

### `photo_history`
Almacena el historial de fotos tomadas por el usuario dentro de la app.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | FK → auth.users(id) |
| photo_url | text | URL de la foto en Supabase Storage |
| ingredients | text | Ingredientes detectados por OpenAI en la foto (español, separados por coma) |
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

### `shopping_list`
Lista de compras del usuario, alimentada automáticamente con los ingredientes faltantes al guardar una receta escaneada, y editable manualmente.

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid | PK autogenerado |
| user_id | uuid | FK → auth.users(id) |
| ingredient | text | Nombre del ingrediente |
| checked | boolean | Si el ítem ya fue marcado como comprado (default `false`) |
| created_at | timestamptz | Fecha de agregado |

> Al insertar, se deduplica en minúsculas contra lo ya existente en la tabla y contra duplicados dentro del mismo lote que se está agregando.

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

### `shopping_list`
| Política | Operación | Condición |
|---|---|---|
| insert_own_shopping | INSERT | `auth.uid() = user_id` |
| select_own_shopping | SELECT | `auth.uid() = user_id` |
| update_own_shopping | UPDATE | `auth.uid() = user_id` |
| delete_own_shopping | DELETE | `auth.uid() = user_id` |

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

---

## Pendiente de aplicar

Las columnas `from_suggestions` y `from_manual_search` en `saved_recipes` deben existir para que la app funcione correctamente. Si no están aplicadas en el proyecto de Supabase, ejecutar:

```sql
ALTER TABLE public.saved_recipes ADD COLUMN IF NOT EXISTS from_suggestions boolean DEFAULT false;
ALTER TABLE public.saved_recipes ADD COLUMN IF NOT EXISTS from_manual_search boolean DEFAULT false;
```
