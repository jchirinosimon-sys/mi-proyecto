const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticación para rutas protegidas
 */
const auth = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

        // Marcar usuario como online
        await User.findByIdAndUpdate(req.userId, {
            isOnline: true,
            lastSeen: new Date()
        });

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = auth;
