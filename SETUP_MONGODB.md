# 🚀 Guía Rápida - Setup de Base de Datos MongoDB

## 📋 Requisitos Previos

1. **Node.js** instalado (v14+)
2. **MongoDB** instalado y ejecutándose localmente, O una conexión a **MongoDB Atlas**
3. Las dependencias del proyecto instaladas

```bash
npm install
```

---

## 🔧 Paso 1: Configurar Variables de Entorno

El archivo `.env` ya está creado. Verifica que contenga:

```env
MONGODB_URI=mongodb://localhost:27017/sirnergia
NODE_ENV=development
PORT=5000
JWT_SECRET=tu_clave_secreta_muy_segura_aqui_123456
```

### Si usas MongoDB Atlas (Cloud):

Reemplaza `MONGODB_URI` con:

```
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/sirnergia
```

---

## 🗄️ Paso 2: Inicializar la Base de Datos

Este script crea los índices y validaciones necesarias:

```bash
node db/initializeDB.js
```

**Output esperado:**
```
✅ Conectado a MongoDB
📋 Creando índices...
  ➜ Creando índices para Users...
     ✓ Índices de Users creados
...
✅ Inicialización completada exitosamente!
```

---

## 📊 Paso 3: Cargar Datos de Ejemplo (Opcional)

Para probar la aplicación con datos de ejemplo:

```bash
node db/seedDatabase.js
```

**Lo que crea:**
- ✅ 5 usuarios de ejemplo
- ✅ 5 posts con likes y comentarios
- ✅ 6 mensajes de prueba
- ✅ Relaciones de amistad

---

## 🎯 Estructura de Colecciones

Tu base de datos `sirnergia` tendrá 3 colecciones:

### 1. **users** - Usuarios del sistema
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (único),
  password: String (hasheado),
  avatar: String,
  bio: String,
  friends: [ObjectId],
  following: [ObjectId],
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **posts** - Publicaciones
```javascript
{
  _id: ObjectId,
  content: String,
  author: String,
  userId: ObjectId,
  photos: [String],
  likes: [ObjectId],
  comments: [{
    _id: ObjectId,
    author: ObjectId,
    authorName: String,
    content: String,
    likes: Number,
    createdAt: Date
  }],
  isDeleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **messages** - Mensajes/Chats
```javascript
{
  _id: ObjectId,
  sender: ObjectId,
  receiver: ObjectId,
  content: String,
  read: Boolean,
  attachments: [{
    type: String,
    url: String,
    size: Number,
    name: String
  }],
  createdAt: Date
}
```

---

## 🧪 Paso 4: Probar la Conexión

### Opción 1: Usando Node.js Repl

```bash
node
```

```javascript
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const count = await User.countDocuments();
    console.log(`Total de usuarios: ${count}`);
    process.exit();
  })
  .catch(err => console.error(err));
```

### Opción 2: Usando MongoDB Compass

1. Descarga [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Conecta con: `mongodb://localhost:27017`
3. Navega a la base de datos `sirnergia`
4. Visualiza las colecciones

---

## ⚡ Paso 5: Iniciar el Servidor

```bash
npm start
```

O en desarrollo con nodemon:

```bash
npm run dev
```

**Output esperado:**
```
✓ Conectado a MongoDB
🚀 Servidor ejecutándose en puerto 5000
📊 Base de datos: mongodb://localhost:27017/sirnergia
```

---

## 🔍 Consultas Útiles en MongoDB

### Ver todos los usuarios
```javascript
db.users.find()
```

### Ver posts de un usuario específico
```javascript
db.posts.find({ userId: ObjectId("...") })
```

### Ver mensajes no leídos
```javascript
db.messages.find({ read: false })
```

### Contar documentos
```javascript
db.users.countDocuments()
db.posts.countDocuments()
db.messages.countDocuments()
```

---

## 🐛 Solución de Problemas

### Error: "connect ECONNREFUSED 127.0.0.1:27017"
**Causa:** MongoDB no está corriendo
**Solución:** 
```bash
# En Windows
mongod

# En Mac
brew services start mongodb-community

# En Linux
sudo systemctl start mongod
```

### Error: "E11000 duplicate key error"
**Causa:** Email duplicado en usuarios
**Solución:** 
```bash
node db/seedDatabase.js  # Limpiar y reiniciar con nuevos datos
```

### Error: "MongoServerError: text index required"
**Causa:** Falta crear índices
**Solución:**
```bash
node db/initializeDB.js
```

---

## 📚 Documentación

- 📖 [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Esquema completo de BD
- 🔗 [MongoDB Docs](https://docs.mongodb.com/)
- 🎓 [Mongoose Docs](https://mongoosejs.com/)

---

## ✅ Checklist de Configuración

- [ ] `.env` configurado correctamente
- [ ] MongoDB instalado y corriendo
- [ ] `npm install` ejecutado
- [ ] `node db/initializeDB.js` completado
- [ ] `node db/seedDatabase.js` completado (opcional)
- [ ] `npm start` levanta el servidor sin errores
- [ ] Conexión probada con éxito

---

¡Listo! Tu base de datos está configurada y lista para usar. 🎉
