# 🔧 MongoDB Cheat Sheet - Comandos Rápidos

## Conectar a MongoDB

```bash
# Shell interactivo
mongosh

# O con MongoDB Compass (GUI)
# https://www.mongodb.com/products/compass
```

---

## 📊 Operaciones Básicas

### Ver bases de datos
```javascript
show databases
```

### Seleccionar base de datos
```javascript
use sirnergia
```

### Ver colecciones
```javascript
show collections
```

---

## 👥 Consultas de USUARIOS

### Ver todos los usuarios
```javascript
db.users.find()

// Con formato legible
db.users.find().pretty()

// Solo ciertos campos
db.users.find({}, { firstName: 1, lastName: 1, email: 1 })
```

### Buscar usuario por email
```javascript
db.users.findOne({ email: "juan@example.com" })
```

### Buscar por nombre
```javascript
db.users.find({ firstName: "Juan" })
```

### Contar usuarios
```javascript
db.users.countDocuments()
```

### Crear usuario
```javascript
db.users.insertOne({
    firstName: "Pedro",
    lastName: "González",
    email: "pedro@example.com",
    password: "$2a$10$...",
    bio: "Mi biografía",
    friends: [],
    following: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Actualizar usuario
```javascript
db.users.updateOne(
    { email: "juan@example.com" },
    { $set: { bio: "Nueva biografía", avatar: "👨‍💻" } }
)
```

### Agregar amigo
```javascript
db.users.updateOne(
    { _id: ObjectId("507f1f77bcf86cd799439011") },
    { $push: { friends: ObjectId("507f1f77bcf86cd799439012") } }
)
```

### Eliminar usuario
```javascript
db.users.deleteOne({ email: "pedro@example.com" })
```

---

## 📝 Consultas de POSTS

### Ver todos los posts
```javascript
db.posts.find().sort({ createdAt: -1 })
```

### Ver posts activos (no eliminados)
```javascript
db.posts.find({ isDeleted: false }).sort({ createdAt: -1 })
```

### Posts de un usuario específico
```javascript
db.posts.find({ userId: ObjectId("507f1f77bcf86cd799439011") })
```

### Posts con más de 5 likes
```javascript
db.posts.find({ $expr: { $gt: [{ $size: "$likes" }, 5] } })
```

### Posts más populares
```javascript
db.posts.find().sort({ likes: -1 }).limit(10)
```

### Contar posts de un usuario
```javascript
db.posts.countDocuments({ userId: ObjectId("507f1f77bcf86cd799439011") })
```

### Crear post
```javascript
db.posts.insertOne({
    content: "Mi primer post",
    author: "Juan García",
    userId: ObjectId("507f1f77bcf86cd799439011"),
    photos: [],
    likes: [],
    comments: [],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
})
```

### Dar like a un post
```javascript
db.posts.updateOne(
    { _id: ObjectId("...") },
    { $push: { likes: ObjectId("507f1f77bcf86cd799439012") } }
)
```

### Quitar like
```javascript
db.posts.updateOne(
    { _id: ObjectId("...") },
    { $pull: { likes: ObjectId("507f1f77bcf86cd799439012") } }
)
```

### Agregar comentario
```javascript
db.posts.updateOne(
    { _id: ObjectId("...") },
    { $push: {
        comments: {
            _id: new ObjectId(),
            author: ObjectId("507f1f77bcf86cd799439012"),
            authorName: "María",
            content: "¡Excelente post!",
            likes: 0,
            createdAt: new Date()
        }
    }}
)
```

### Contar comentarios en un post
```javascript
db.posts.findOne(
    { _id: ObjectId("...") },
    { comments: { $size: "$comments" } }
)
```

### Eliminar post (soft delete)
```javascript
db.posts.updateOne(
    { _id: ObjectId("...") },
    { $set: { isDeleted: true } }
)
```

### Eliminar post permanentemente
```javascript
db.posts.deleteOne({ _id: ObjectId("...") })
```

---

## 💬 Consultas de MENSAJES

### Ver todos los mensajes
```javascript
db.messages.find().sort({ createdAt: -1 })
```

### Conversación entre dos usuarios
```javascript
db.messages.find({
    $or: [
        { sender: ObjectId("507f1f77bcf86cd799439011"), receiver: ObjectId("507f1f77bcf86cd799439012") },
        { sender: ObjectId("507f1f77bcf86cd799439012"), receiver: ObjectId("507f1f77bcf86cd799439011") }
    ]
}).sort({ createdAt: -1 }).limit(50)
```

### Mensajes no leídos
```javascript
db.messages.find({ read: false }).sort({ createdAt: -1 })
```

### Mensajes no leídos de un usuario específico
```javascript
db.messages.find({ receiver: ObjectId("507f1f77bcf86cd799439011"), read: false })
```

### Contar mensajes no leídos
```javascript
db.messages.countDocuments({ read: false })
```

### Crear mensaje
```javascript
db.messages.insertOne({
    sender: ObjectId("507f1f77bcf86cd799439011"),
    receiver: ObjectId("507f1f77bcf86cd799439012"),
    content: "¡Hola! ¿Cómo estás?",
    read: false,
    attachments: [],
    createdAt: new Date()
})
```

### Marcar mensaje como leído
```javascript
db.messages.updateOne(
    { _id: ObjectId("...") },
    { $set: { read: true } }
)
```

### Marcar todos los mensajes de un usuario como leídos
```javascript
db.messages.updateMany(
    { receiver: ObjectId("507f1f77bcf86cd799439011"), read: false },
    { $set: { read: true } }
)
```

### Eliminar mensajes antiguos (más de 30 días)
```javascript
db.messages.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
})
```

---

## 📊 Estadísticas y Análisis

### Total de documentos por colección
```javascript
db.users.countDocuments()
db.posts.countDocuments()
db.messages.countDocuments()
```

### Tamaño de la base de datos
```javascript
db.stats()
```

### Tamaño por colección
```javascript
db.users.stats()
db.posts.stats()
db.messages.stats()
```

### Usuario más activo (más posts)
```javascript
db.posts.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 }
])
```

### Post más popular (más likes)
```javascript
db.posts.find()
    .sort({ "likes": -1 })
    .limit(1)
```

### Promedio de comentarios por post
```javascript
db.posts.aggregate([
    { $group: {
        _id: null,
        avgComments: { $avg: { $size: "$comments" } }
    }}
])
```

---

## 🔑 Gestión de Índices

### Ver índices de una colección
```javascript
db.users.getIndexes()
db.posts.getIndexes()
db.messages.getIndexes()
```

### Crear índice
```javascript
// Único
db.users.createIndex({ email: 1 }, { unique: true })

// Combinado
db.posts.createIndex({ userId: 1, createdAt: -1 })

// Texto (búsqueda full-text)
db.posts.createIndex({ content: "text" })
```

### Eliminar índice
```javascript
db.users.dropIndex("email_1")
```

### Eliminar todos los índices (excepto _id)
```javascript
db.users.dropIndexes()
```

---

## 🗑️ Operaciones de Limpieza

### Eliminar todos los documentos de una colección
```javascript
db.users.deleteMany({})
db.posts.deleteMany({})
db.messages.deleteMany({})
```

### Eliminar colección completa
```javascript
db.users.drop()
db.posts.drop()
db.messages.drop()
```

### Eliminar base de datos completa
```javascript
db.dropDatabase()
```

---

## 🔍 Búsquedas Avanzadas

### Búsqueda con múltiples condiciones (AND)
```javascript
db.users.find({
    firstName: "Juan",
    isActive: true
})
```

### Búsqueda con múltiples condiciones (OR)
```javascript
db.posts.find({
    $or: [
        { isDeleted: false },
        { author: "Juan García" }
    ]
})
```

### Búsqueda con NOT
```javascript
db.posts.find({
    isDeleted: { $ne: true }
})
```

### Búsqueda por rango de fechas
```javascript
db.posts.find({
    createdAt: {
        $gte: new Date("2026-01-01"),
        $lte: new Date("2026-05-31")
    }
})
```

### Búsqueda por patrón de texto
```javascript
db.posts.find({
    content: { $regex: "MongoDB", $options: "i" }
})
```

---

## 💡 Operadores Útiles

| Operador | Uso |
|----------|-----|
| `$push` | Agregar elemento a array |
| `$pull` | Remover elemento de array |
| `$inc` | Incrementar valor numérico |
| `$set` | Establecer valor |
| `$unset` | Eliminar campo |
| `$gte` | Mayor o igual que |
| `$lte` | Menor o igual que |
| `$gt` | Mayor que |
| `$lt` | Menor que |
| `$in` | En una lista |
| `$ne` | No igual |
| `$exists` | Campo existe |
| `$size` | Tamaño de array |

---

## 📌 Tips Importantes

1. **ObjectId:** Siempre usa `ObjectId("...")` para IDs
2. **Fechas:** Usa `new Date()` para la fecha actual
3. **Límites:** Usa `.limit()` y `.skip()` para paginar
4. **Ordenamiento:** `.sort({ campo: 1 })` (1=asc, -1=desc)
5. **Proyección:** Especifica qué campos quieres en resultados

---

Este es tu cheat sheet de referencia rápida. Para más detalles, consulta [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) y [MONGODB_QUERIES_EXAMPLES.md](MONGODB_QUERIES_EXAMPLES.md).
