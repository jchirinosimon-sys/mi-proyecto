# 🎉 Base de Datos MongoDB - Proyecto Sirnergia

## ✅ Lo que se ha creado:

Tu base de datos MongoDB está completamente configurada y optimizada para una red social con **3 colecciones principales**:

### 📊 **Colecciones:**
1. **users** - Gestión de usuarios, perfil y amistades
2. **posts** - Publicaciones con likes y comentarios
3. **messages** - Sistema de mensajería privada (chats)

---

## 🚀 Primeros Pasos

### 1. Asegúrate de que MongoDB esté corriendo

**Windows (PowerShell):**
```powershell
mongod
```

**Mac:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 2. Instala dependencias (si no lo has hecho)

```bash
npm install
```

### 3. Inicializa la base de datos

```bash
npm run db:init
```

Este comando crea todos los índices y validaciones necesarias.

### 4. (Opcional) Carga datos de ejemplo

```bash
npm run db:seed
```

Esto carga 5 usuarios, 5 posts y 6 mensajes de prueba.

### 5. Inicia el servidor

```bash
npm start
```

O en desarrollo:

```bash
npm run dev
```

---

## 📁 Archivos Creados/Modificados

### **Nuevos archivos:**

| Archivo | Propósito |
|---------|-----------|
| `.env` | Variables de configuración (secretos, puerto, etc) |
| `db/initializeDB.js` | Crear índices y validaciones |
| `db/seedDatabase.js` | Cargar datos de ejemplo |
| `db/connection.js` | Configuración de conexión reutilizable |
| `DATABASE_SCHEMA.md` | Documentación completa del esquema |
| `SETUP_MONGODB.md` | Guía de instalación y configuración |
| `MONGODB_QUERIES_EXAMPLES.md` | +100 ejemplos de consultas |

### **Modelos Mejorados:**

| Modelo | Mejoras |
|--------|---------|
| `models/User.js` | Validaciones, índices, métodos de instancia |
| `models/Post.js` | Soft delete, métodos para likes/comentarios |
| `models/Message.js` | Mejor estructura, métodos de lectura |

### **Scripts en package.json:**

```bash
npm start           # Iniciar servidor
npm run dev         # Servidor con hot reload
npm run db:init     # Inicializar BD (crear índices)
npm run db:seed     # Cargar datos de ejemplo
npm run db:reset    # Limpiar y recargar BD
```

---

## 🏗️ Estructura de la Base de Datos

### **USERS Collection**
```json
{
  "_id": ObjectId,
  "firstName": "Juan",
  "lastName": "García",
  "email": "juan@example.com",
  "password": "hasheado",
  "avatar": "👨‍💼",
  "bio": "Desarrollador",
  "friends": [ObjectId, ObjectId],
  "following": [ObjectId],
  "lastLogin": Date,
  "isActive": true,
  "createdAt": Date,
  "updatedAt": Date
}
```

### **POSTS Collection**
```json
{
  "_id": ObjectId,
  "content": "Mi contenido",
  "author": "Juan García",
  "userId": ObjectId,
  "photos": [URL],
  "likes": [ObjectId],
  "comments": [
    {
      "author": ObjectId,
      "authorName": "María",
      "content": "Comentario",
      "createdAt": Date
    }
  ],
  "isDeleted": false,
  "createdAt": Date,
  "updatedAt": Date
}
```

### **MESSAGES Collection**
```json
{
  "_id": ObjectId,
  "sender": ObjectId,
  "receiver": ObjectId,
  "content": "Mensaje",
  "read": false,
  "attachments": [],
  "createdAt": Date
}
```

---

## 🔍 Ejemplos de Uso

### Crear un usuario
```javascript
const User = require('./models/User');

const user = await User.create({
    firstName: 'Pedro',
    lastName: 'González',
    email: 'pedro@example.com',
    password: 'password123'
});
```

### Crear un post
```javascript
const Post = require('./models/Post');

const post = await Post.create({
    content: 'Hola mundo!',
    author: 'Pedro González',
    userId: userId
});
```

### Enviar mensaje
```javascript
const Message = require('./models/Message');

await Message.create({
    sender: userId1,
    receiver: userId2,
    content: '¡Hola!'
});
```

---

## 📚 Documentación

**Para consultas detalladas, consulta:**
- 📖 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Esquema completo
- 📚 [MONGODB_QUERIES_EXAMPLES.md](MONGODB_QUERIES_EXAMPLES.md) - +100 ejemplos
- ⚡ [SETUP_MONGODB.md](SETUP_MONGODB.md) - Guía de instalación

---

## 🔐 Seguridad

✅ **Contraseñas:** Hasheadas con bcrypt
✅ **Email:** Campo único, evita duplicados
✅ **Validaciones:** Schema validation en MongoDB
✅ **Indices:** Optimizados para búsquedas rápidas
✅ **Soft Delete:** Posts no se eliminan, solo se marcan

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED"
MongoDB no está corriendo. Ejecuta `mongod` en otra terminal.

### Error: "E11000 duplicate key error"
Email duplicado. Ejecuta `npm run db:seed` para limpiar.

### Error: "MongoServerError: text index required"
Falta crear índices. Ejecuta `npm run db:init`.

---

## ✨ Características Implementadas

✅ 3 colecciones optimizadas (Users, Posts, Messages)
✅ Esquema validation en MongoDB
✅ Índices para búsquedas rápidas
✅ Métodos de instancia para operaciones comunes
✅ Relaciones One-to-Many y Many-to-Many
✅ Soft delete para posts
✅ Cifrado de contraseñas con bcrypt
✅ Datos de ejemplo para pruebas
✅ Scripts de inicialización automatizados
✅ Documentación completa

---

## 🚀 Próximos Pasos

1. ✅ Revisar [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) para entender la estructura
2. ✅ Ejecutar `npm run db:init` para crear índices
3. ✅ Ejecutar `npm run db:seed` para cargar datos de ejemplo
4. ✅ Comenzar a implementar tus rutas API
5. ✅ Consultar [MONGODB_QUERIES_EXAMPLES.md](MONGODB_QUERIES_EXAMPLES.md) para ejemplos

---

## 📞 Necesitas Ayuda?

- Consulta el archivo [SETUP_MONGODB.md](SETUP_MONGODB.md)
- Revisa los ejemplos en [MONGODB_QUERIES_EXAMPLES.md](MONGODB_QUERIES_EXAMPLES.md)
- Lee la documentación en [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

**¡Tu base de datos está lista para usar! 🎉**

Ejecuta `npm start` para iniciar tu servidor.
