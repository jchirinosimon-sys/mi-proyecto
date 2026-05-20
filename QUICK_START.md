# ⚡ Guía Rápida - Conectar Sirnergia a MongoDB

## 🎯 Pasos Rápidos (5 minutos)

### 1. Instala Node.js
Descarga desde: https://nodejs.org/ (usa la versión LTS)

### 2. Instala MongoDB
- **Opción A (Local)**: Descarga Community Edition desde https://www.mongodb.com/
- **Opción B (Cloud)**: Crea cuenta en MongoDB Atlas (https://www.mongodb.com/cloud/atlas)

### 3. Instala Dependencias
```bash
cd c:\proyecto
npm install
```

### 4. Verifica la Configuración
Abre `.env` y verifica:
```env
MONGODB_URI=mongodb://localhost:27017/sirnergia
PORT=5000
```

Si usas MongoDB Atlas, cambia por:
```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/sirnergia
```

### 5. Inicia MongoDB
```bash
# En Windows (si está instalado)
# MongoDB se inicia automáticamente como servicio

# En Linux/macOS
mongod
```

### 6. Inicia el Servidor
```bash
npm run dev
```

Deberías ver:
```
✓ Conectado a MongoDB
🚀 Servidor ejecutándose en puerto 5000
```

### 7. Abre la Aplicación
```
http://localhost:3000
```

O simplemente abre `index.html` en tu navegador.

---

## 🔧 Troubleshooting Rápido

### Error: "Cannot connect to MongoDB"
```bash
# Verifica que MongoDB está corriendo
# En Windows: Revisa Services (servicios)
# En Linux: sudo systemctl status mongod
```

### Error: "Port 5000 in use"
Cambia en `.env`:
```env
PORT=5001
```

### Error: "npm not found"
No instalaste Node.js correctamente. Reinicia la terminal después de instalar.

---

## 🧪 Prueba Rápida

1. Abre `http://localhost:3000`
2. Haz clic en "Regístrate aquí"
3. Usa:
   - Nombre: `Test`
   - Apellido: `User`
   - Email: `test@example.com`
   - Contraseña: `123456`
4. ¡Verás la animación de login y accederás a la app!

---

## 📊 Verificar Base de Datos

### MongoDB Compass (GUI)
1. Descarga: https://www.mongodb.com/products/compass
2. Conecta a `mongodb://localhost:27017`
3. Verifica la DB `sirnergia` con tus usuarios y posts

### Terminal MongoDB
```bash
mongosh
show dbs
use sirnergia
db.users.find()
db.posts.find()
```

---

## 🚀 Próximos Pasos

- ✅ Autenticación funcionando
- ✅ Posts en DB real
- ⏭️ Deploy (Heroku, Azure, etc.)
- ⏭️ Sistema de mensajes
- ⏭️ Notificaciones en tiempo real

---

¿Necesitas ayuda? Revisa el `README.md` para documentación completa.