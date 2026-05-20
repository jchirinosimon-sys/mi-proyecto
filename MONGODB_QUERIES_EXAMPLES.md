# 📚 Ejemplos de Consultas MongoDB - Guía Práctica

Esta guía contiene ejemplos reales de cómo consultar, crear, actualizar y eliminar datos en tu base de datos.

---

## 👥 USUARIOS - Ejemplos de Consultas

### 1️⃣ Crear un nuevo usuario

```javascript
const User = require('./models/User');

// Crear usuario
const newUser = await User.create({
    firstName: 'Pedro',
    lastName: 'González',
    email: 'pedro@example.com',
    password: 'password123',
    avatar: '👨‍🍳',
    bio: 'Chef y amante de la cocina'
});

console.log('Usuario creado:', newUser);
```

### 2️⃣ Buscar usuario por email

```javascript
// Búsqueda simple
const user = await User.findByEmail('juan@example.com');

// O sin usar el método estático
const user = await User.findOne({ email: 'juan@example.com' });
```

### 3️⃣ Obtener todos los usuarios

```javascript
const users = await User.find();
// Sin campos sensibles
const users = await User.find().select('firstName lastName avatar bio');
```

### 4️⃣ Buscar por nombre

```javascript
const users = await User.find({
    firstName: 'Juan',
    lastName: 'García'
});
```

### 5️⃣ Actualizar perfil de usuario

```javascript
const user = await User.findByIdAndUpdate(
    userId,
    {
        bio: 'Nueva biografía',
        avatar: '👨‍💻'
    },
    { new: true } // Retornar documento actualizado
);
```

### 6️⃣ Agregar amigo

```javascript
const user = await User.findById(userId);
user.friends.push(friendId);
await user.save();

// O usando updateOne
await User.updateOne(
    { _id: userId },
    { $push: { friends: friendId } }
);
```

### 7️⃣ Verificar si dos usuarios son amigos

```javascript
const user = await User.findById(userId);
const isFriend = user.isFriend(friendId);
console.log(`¿Son amigos?: ${isFriend}`);
```

### 8️⃣ Contar amigos

```javascript
const user = await User.findById(userId);
const friendCount = user.friendCount();
console.log(`Total de amigos: ${friendCount}`);
```

### 9️⃣ Obtener lista completa de amigos (con detalles)

```javascript
const user = await User.findById(userId)
    .populate('friends', 'firstName lastName avatar bio');

console.log('Amigos:', user.friends);
```

### 🔟 Eliminar usuario

```javascript
await User.findByIdAndDelete(userId);
```

---

## 📝 POSTS - Ejemplos de Consultas

### 1️⃣ Crear un nuevo post

```javascript
const Post = require('./models/Post');

const newPost = await Post.create({
    content: 'Mi primer post en Sirnergia!',
    author: 'Juan García',
    userId: userId,
    photos: []
});
```

### 2️⃣ Obtener todos los posts (feed)

```javascript
const posts = await Post.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(20);
```

### 3️⃣ Obtener posts de un usuario específico

```javascript
const posts = await Post.getByUser(userId);
```

### 4️⃣ Obtener un post por ID

```javascript
const post = await Post.findById(postId)
    .populate('userId', 'firstName lastName avatar')
    .populate('comments.author', 'firstName lastName avatar');
```

### 5️⃣ Dar like a un post

```javascript
const post = await Post.findById(postId);
await post.addLike(userId);
// O:
await Post.updateOne(
    { _id: postId },
    { $push: { likes: userId } }
);
```

### 6️⃣ Verificar si un usuario le dio like

```javascript
const post = await Post.findById(postId);
const hasLike = post.hasLike(userId);
console.log(`¿Ya le diste like?: ${hasLike}`);
```

### 7️⃣ Contar likes

```javascript
const post = await Post.findById(postId);
const likeCount = post.getLikeCount();
console.log(`Total de likes: ${likeCount}`);
```

### 8️⃣ Remover like

```javascript
const post = await Post.findById(postId);
await post.removeLike(userId);
```

### 9️⃣ Agregar comentario

```javascript
const post = await Post.findById(postId);
await post.addComment(
    userId,
    'Juan García',
    'Este post es increíble!'
);
```

### 🔟 Obtener comentarios de un post

```javascript
const post = await Post.findById(postId);
console.log('Comentarios:', post.comments);
```

### 1️⃣1️⃣ Remover comentario

```javascript
const post = await Post.findById(postId);
await post.removeComment(commentId);
```

### 1️⃣2️⃣ Eliminar post (soft delete)

```javascript
const post = await Post.findById(postId);
await post.softDelete(); // Marca como eliminado pero no borra
```

### 1️⃣3️⃣ Restaurar post eliminado

```javascript
const post = await Post.findById(postId);
await post.restore();
```

### 1️⃣4️⃣ Eliminar permanentemente un post

```javascript
await Post.findByIdAndDelete(postId);
```

---

## 💬 MENSAJES - Ejemplos de Consultas

### 1️⃣ Enviar un mensaje

```javascript
const Message = require('./models/Message');

const message = await Message.create({
    sender: senderUserId,
    receiver: receiverUserId,
    content: '¡Hola! ¿Cómo estás?'
});
```

### 2️⃣ Obtener conversación completa entre dos usuarios

```javascript
const conversation = await Message.getConversation(
    userId1,
    userId2,
    50 // Últimos 50 mensajes
);
```

### 3️⃣ Obtener todos los mensajes recibidos

```javascript
const messages = await Message.find({ receiver: userId })
    .sort({ createdAt: -1 });
```

### 4️⃣ Obtener mensajes no leídos

```javascript
const unreadMessages = await Message.getUnread(userId);
```

### 5️⃣ Contar mensajes no leídos

```javascript
const count = await Message.countUnread(userId);
console.log(`Mensajes sin leer: ${count}`);
```

### 6️⃣ Marcar un mensaje como leído

```javascript
const message = await Message.findById(messageId);
await message.markAsRead();
```

### 7️⃣ Marcar conversación completa como leída

```javascript
await Message.markConversationAsRead(userId1, userId2);
```

### 8️⃣ Eliminar un mensaje

```javascript
await Message.findByIdAndDelete(messageId);
```

### 9️⃣ Obtener últimos mensajes recibidos

```javascript
const messages = await Message.find({ receiver: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('sender', 'firstName lastName avatar');
```

---

## 🔗 CONSULTAS COMPLEJAS - Aggregation

### 1️⃣ Obtener feed personalizado (posts de amigos)

```javascript
const user = await User.findById(userId)
    .populate('friends');

const friendIds = user.friends.map(f => f._id);

const feed = await Post.find({
    userId: { $in: friendIds },
    isDeleted: false
})
.sort({ createdAt: -1 })
.limit(20);
```

### 2️⃣ Obtener estadísticas de un usuario

```javascript
const stats = await Post.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
        $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            totalLikes: { $sum: { $size: '$likes' } },
            totalComments: { $sum: { $size: '$comments' } }
        }
    }
]);

console.log('Estadísticas:', stats[0]);
```

### 3️⃣ Posts más populares (con más likes)

```javascript
const popularPosts = await Post.find()
    .sort({ likes: -1 })
    .limit(10);
```

### 4️⃣ Usuarios más activos (con más posts)

```javascript
const activeUsers = await Post.aggregate([
    {
        $group: {
            _id: '$userId',
            postCount: { $sum: 1 }
        }
    },
    { $sort: { postCount: -1 } },
    { $limit: 10 },
    {
        $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
        }
    }
]);
```

### 5️⃣ Últimas conversaciones (chats)

```javascript
const lastChats = await Message.aggregate([
    {
        $match: {
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }
    },
    { $sort: { createdAt: -1 } },
    {
        $group: {
            _id: {
                $cond: [
                    { $eq: ['$sender', userId] },
                    '$receiver',
                    '$sender'
                ]
            },
            lastMessage: { $first: '$$ROOT' }
        }
    },
    { $limit: 20 }
]);
```

---

## 🎯 OPERACIONES BATCH - Múltiples Actualizaciones

### Agregar múltiples amigos

```javascript
await User.updateOne(
    { _id: userId },
    { 
        $push: { 
            friends: { 
                $each: [friendId1, friendId2, friendId3] 
            } 
        } 
    }
);
```

### Eliminar múltiples mensajes

```javascript
await Message.deleteMany({
    receiver: userId,
    read: false,
    createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
});
```

### Actualizar múltiples posts

```javascript
await Post.updateMany(
    { userId: userId },
    { isDeleted: true }
);
```

---

## 📊 TRANSACCIONES (Para operaciones críticas)

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Crear post
    const post = await Post.create([{
        content: 'Nuevo post',
        author: 'Juan',
        userId: userId
    }], { session });

    // Actualizar usuario
    await User.updateOne(
        { _id: userId },
        { $inc: { postCount: 1 } },
        { session }
    );

    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

---

## ✅ Tips Importantes

1. **Siempre usa `async/await`** para manejo de errores
2. **Valida IDs** antes de hacer consultas: `mongoose.Types.ObjectId.isValid(id)`
3. **Usa índices** para búsquedas frecuentes
4. **Limita resultados** con `.limit()` para mejor rendimiento
5. **Usa `.select()`** para obtener solo los campos necesarios
6. **Usa `.lean()`** para consultas de solo lectura (más rápido)

---

## 🚀 Ejemplos de Rutas (Express)

```javascript
// router.get('/posts', async (req, res) => {
//     try {
//         const posts = await Post.find({ isDeleted: false })
//             .sort({ createdAt: -1 })
//             .limit(20);
//         res.json(posts);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
```

---

Para más información, consulta:
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose API](https://mongoosejs.com/docs/api.html)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
