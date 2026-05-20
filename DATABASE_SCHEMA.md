# 📊 Estructura de Base de Datos - Sirnergia

## Descripción General
Base de datos MongoDB con **3 colecciones principales** optimizadas para una red social con chats, usuarios y publicaciones.

---

## 🏗️ Arquitectura de Colecciones

```
SIRNERGIA (Base de Datos)
├── users          (Usuarios - Perfil, amigos)
├── posts          (Publicaciones - Contenido, fotos, comentarios)
└── messages       (Mensajes - Chats entre usuarios)
```

---

## 📋 Colección: USERS (Usuarios)

**Propósito:** Almacenar información de perfil y relaciones de usuario.

### Estructura del Documento

```json
{
  "_id": ObjectId,
  "firstName": "Juan",
  "lastName": "García",
  "email": "juan@example.com",
  "password": "$2a$10$...", // Hash de bcrypt
  "avatar": "https://example.com/avatar.jpg",
  "bio": "Desarrollador y diseñador",
  "friends": [
    ObjectId("507f1f77bcf86cd799439011"),
    ObjectId("507f1f77bcf86cd799439012")
  ],
  "following": [
    ObjectId("507f1f77bcf86cd799439013")
  ],
  "createdAt": ISODate("2026-05-10T10:30:00Z"),
  "updatedAt": ISODate("2026-05-10T10:30:00Z"),
  "lastLogin": ISODate("2026-05-10T15:45:00Z"),
  "isActive": true
}
```

### Campos Principales
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `_id` | ObjectId | ID único generado por MongoDB | Auto |
| `firstName` | String | Nombre del usuario | "Juan" |
| `lastName` | String | Apellido del usuario | "García" |
| `email` | String (único) | Email de inicio de sesión | "juan@example.com" |
| `password` | String | Contraseña hasheada con bcrypt | Hasheada |
| `avatar` | String | URL o emoji de avatar | "👨‍💼" |
| `bio` | String | Biografía del usuario | "Desarrollador" |
| `friends` | Array[ObjectId] | Lista de IDs de amigos | [ObjectId(...)] |
| `following` | Array[ObjectId] | Usuarios que sigue | [ObjectId(...)] |
| `createdAt` | Date | Fecha de creación | Auto |
| `updatedAt` | Date | Última actualización | Auto |
| `lastLogin` | Date | Último acceso | Auto |
| `isActive` | Boolean | Estado de la cuenta | true/false |

### Índices Recomendados
```javascript
// Búsqueda rápida por email
db.users.createIndex({ "email": 1 }, { unique: true })

// Búsqueda por nombre
db.users.createIndex({ "firstName": 1, "lastName": 1 })

// Ordenar por fecha de creación
db.users.createIndex({ "createdAt": -1 })
```

---

## 📸 Colección: POSTS (Publicaciones)

**Propósito:** Almacenar publicaciones, fotos, likes y comentarios.

### Estructura del Documento

```json
{
  "_id": ObjectId,
  "content": "¡Hola a todos!",
  "author": "Juan García",
  "userId": ObjectId("507f1f77bcf86cd799439011"),
  "photos": [
    "uploads/post_123_1.jpg",
    "uploads/post_123_2.jpg"
  ],
  "likes": [
    ObjectId("507f1f77bcf86cd799439012"),
    ObjectId("507f1f77bcf86cd799439013")
  ],
  "comments": [
    {
      "_id": ObjectId,
      "author": ObjectId("507f1f77bcf86cd799439012"),
      "authorName": "María López",
      "content": "¡Excelente post!",
      "likes": 2,
      "createdAt": ISODate("2026-05-10T11:00:00Z")
    },
    {
      "_id": ObjectId,
      "author": ObjectId("507f1f77bcf86cd799439013"),
      "authorName": "Carlos Ruiz",
      "content": "Me encanta",
      "likes": 1,
      "createdAt": ISODate("2026-05-10T11:15:00Z")
    }
  ],
  "createdAt": ISODate("2026-05-10T10:30:00Z"),
  "updatedAt": ISODate("2026-05-10T10:30:00Z"),
  "isDeleted": false
}
```

### Campos Principales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID único del post |
| `content` | String | Contenido del post |
| `author` | String | Nombre del autor (desnormalizado) |
| `userId` | ObjectId | ID del autor (ref a users) |
| `photos` | Array[String] | URLs de fotos adjuntas |
| `likes` | Array[ObjectId] | IDs de usuarios que dieron like |
| `comments` | Array[Object] | Array de comentarios con autor y contenido |
| `createdAt` | Date | Fecha de creación |
| `updatedAt` | Date | Última actualización |
| `isDeleted` | Boolean | Soft delete |

### Índices Recomendados
```javascript
// Posts por usuario, ordenados por fecha
db.posts.createIndex({ "userId": 1, "createdAt": -1 })

// Búsqueda temporal
db.posts.createIndex({ "createdAt": -1 })

// Búsqueda por estado de eliminación
db.posts.createIndex({ "isDeleted": 1, "createdAt": -1 })
```

---

## 💬 Colección: MESSAGES (Mensajes/Chats)

**Propósito:** Almacenar mensajes privados entre usuarios.

### Estructura del Documento

```json
{
  "_id": ObjectId,
  "sender": ObjectId("507f1f77bcf86cd799439011"),
  "receiver": ObjectId("507f1f77bcf86cd799439012"),
  "content": "¡Hola! ¿Cómo estás?",
  "read": false,
  "attachments": [
    {
      "type": "image",
      "url": "uploads/msg_image_123.jpg"
    }
  ],
  "createdAt": ISODate("2026-05-10T10:30:00Z")
}
```

### Campos Principales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID único del mensaje |
| `sender` | ObjectId | ID del remitente (ref a users) |
| `receiver` | ObjectId | ID del destinatario (ref a users) |
| `content` | String | Contenido del mensaje |
| `read` | Boolean | Si el mensaje fue leído |
| `attachments` | Array[Object] | Archivos adjuntos |
| `createdAt` | Date | Fecha de envío |

### Índices Recomendados
```javascript
// Conversaciones entre dos usuarios (bidireccional)
db.messages.createIndex({ "sender": 1, "receiver": 1, "createdAt": -1 })
db.messages.createIndex({ "receiver": 1, "sender": 1, "createdAt": -1 })

// Mensajes no leídos
db.messages.createIndex({ "receiver": 1, "read": 1 })

// TTL: Eliminar mensajes después de 1 año
db.messages.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 31536000 })
```

---

## 🔑 Relaciones Entre Colecciones

### Relación: Users → Posts
- **Tipo:** One-to-Many (1 usuario → muchos posts)
- **Campo de referencia:** `Post.userId`
- **Cómo se usa:**
  ```javascript
  // Obtener todos los posts de un usuario
  db.posts.find({ userId: ObjectId("507f1f77bcf86cd799439011") })
  ```

### Relación: Users → Messages
- **Tipo:** Many-to-Many (usuarios intercambian mensajes)
- **Campos de referencia:** `Message.sender`, `Message.receiver`
- **Cómo se usa:**
  ```javascript
  // Conversación entre dos usuarios
  db.messages.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 }
    ]
  }).sort({ createdAt: -1 })
  ```

### Relación: Users → Users (Amigos)
- **Tipo:** Many-to-Many (red de amigos)
- **Campo de referencia:** `User.friends`, `User.following`
- **Cómo se usa:**
  ```javascript
  // Obtener amigos de un usuario
  db.users.findOne({ _id: userId }, { friends: 1 })
  ```

---

## 📊 Ejemplos de Consultas Comunes

### 🔍 Usuarios

```javascript
// 1. Registrar nuevo usuario
db.users.insertOne({
  firstName: "Ana",
  lastName: "Martínez",
  email: "ana@example.com",
  password: "$2a$10$...",
  avatar: "👩‍💼",
  bio: "Diseñadora gráfica",
  friends: [],
  following: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

// 2. Buscar usuario por email
db.users.findOne({ email: "ana@example.com" })

// 3. Agregar amigo
db.users.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439011") },
  { $push: { friends: ObjectId("507f1f77bcf86cd799439012") } }
)

// 4. Obtener lista de amigos (con detalles)
db.users.aggregate([
  { $match: { _id: ObjectId("507f1f77bcf86cd799439011") } },
  { $unwind: "$friends" },
  { $lookup: {
      from: "users",
      localField: "friends",
      foreignField: "_id",
      as: "friendDetails"
    }
  }
])
```

### 📝 Publicaciones

```javascript
// 1. Crear nueva publicación
db.posts.insertOne({
  content: "Mi primer post",
  author: "Juan García",
  userId: ObjectId("507f1f77bcf86cd799439011"),
  photos: [],
  likes: [],
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isDeleted: false
})

// 2. Obtener posts del feed (últimos 20)
db.posts.find({ isDeleted: false })
  .sort({ createdAt: -1 })
  .limit(20)

// 3. Dar like a un post
db.posts.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439001") },
  { $push: { likes: ObjectId("507f1f77bcf86cd799439012") } }
)

// 4. Agregar comentario
db.posts.updateOne(
  { _id: ObjectId("507f1f77bcf86cd799439001") },
  { $push: {
      comments: {
        _id: new ObjectId(),
        author: ObjectId("507f1f77bcf86cd799439012"),
        authorName: "María",
        content: "¡Excelente!",
        likes: 0,
        createdAt: new Date()
      }
    }
  }
)

// 5. Contar likes de un post
db.posts.findOne(
  { _id: ObjectId("507f1f77bcf86cd799439001") },
  { likes: { $size: "$likes" } }
)
```

### 💬 Mensajes

```javascript
// 1. Enviar mensaje
db.messages.insertOne({
  sender: ObjectId("507f1f77bcf86cd799439011"),
  receiver: ObjectId("507f1f77bcf86cd799439012"),
  content: "¿Hola, cómo estás?",
  read: false,
  attachments: [],
  createdAt: new Date()
})

// 2. Obtener conversación completa
db.messages.find({
  $or: [
    { sender: userId1, receiver: userId2 },
    { sender: userId2, receiver: userId1 }
  ]
}).sort({ createdAt: -1 }).limit(50)

// 3. Marcar mensaje como leído
db.messages.updateMany(
  { receiver: ObjectId("507f1f77bcf86cd799439011"), read: false },
  { $set: { read: true } }
)

// 4. Contar mensajes no leídos
db.messages.countDocuments({
  receiver: ObjectId("507f1f77bcf86cd799439011"),
  read: false
})
```

---

## ⚙️ Estadísticas de la Base de Datos

```javascript
// Tamaño total de la base de datos
db.stats()

// Estadísticas por colección
db.users.stats()
db.posts.stats()
db.messages.stats()

// Documentos en cada colección
db.users.countDocuments()
db.posts.countDocuments()
db.messages.countDocuments()
```

---

## 🔐 Consideraciones de Seguridad

1. **Contraseñas:** Siempre hasheadas con bcrypt (nunca texto plano)
2. **Validación:** Implementar schema validation en MongoDB
3. **Índices únicos:** `email` debe ser único en la colección `users`
4. **TTL Index:** Mensajes pueden expirar automáticamente si lo necesitas
5. **Soft Delete:** Usar `isDeleted: true` en lugar de borrar permanentemente

---

## 📈 Escalabilidad

- **Sharding:** Si creces mucho, considera particionar por `userId`
- **Replicación:** Usar replica sets para alta disponibilidad
- **Archiving:** Mover posts antiguos a colección de archivo
- **Índices:** Monitores índices no usados

---

## 🚀 Próximos Pasos

1. ✅ Crear base de datos: `sirnergia`
2. ✅ Ejecutar inicialización de modelos
3. ✅ Crear índices recomendados
4. ✅ Implementar validación de schema
5. ✅ Realizar pruebas con datos de ejemplo
