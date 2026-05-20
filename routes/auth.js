const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/registro
 * Registrar un nuevo usuario
 */
router.post('/registro', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        // Validaciones
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Crear nuevo usuario
        const nuevoUsuario = new User({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password
        });

        await nuevoUsuario.save();

        // Generar token
        const token = jwt.sign(
            { userId: nuevoUsuario._id, email: nuevoUsuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: nuevoUsuario.toJSON()
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validaciones
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario
        const usuario = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Comparar contraseña
        const contraseñaValida = await usuario.comparePassword(password);
        if (!contraseñaValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: usuario._id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Sesión iniciada exitosamente',
            token,
            user: usuario.toJSON()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/auth/perfil
 * Obtener perfil del usuario autenticado
 */
router.get('/perfil', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.userId).select('-password');
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuario);

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (opcional, el token se borra en cliente)
 */
router.post('/logout', auth, async (req, res) => {
    try {
        // Marcar usuario como offline
        await User.findByIdAndUpdate(req.userId, {
            isOnline: false,
            lastSeen: new Date()
        });
        // En JWT, el logout se maneja en el cliente eliminando el token
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/heartbeat
 * Mantener estado online (llamar periódicamente desde el frontend)
 */
router.post('/heartbeat', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.userId, {
            isOnline: true,
            lastSeen: new Date()
        });
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Error en heartbeat:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/google
 * Login / registro con Google OAuth
 * Recibe el credential (id_token) desde el cliente
 */
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Token de Google requerido' });
        }

        // Verificar el token con Google
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();

        const { email, given_name, family_name, picture, sub: googleId } = payload;

        // Buscar usuario existente por email o googleId
        let usuario = await User.findOne({ $or: [{ email: email.toLowerCase() }, { googleId }] });

        if (!usuario) {
            // Crear cuenta nueva automáticamente
            usuario = new User({
                firstName: given_name || 'Usuario',
                lastName: family_name || '',
                email: email.toLowerCase(),
                googleId,
                avatar: picture || null,
                // Sin contraseña — cuenta solo Google
                password: require('crypto').randomBytes(32).toString('hex')
            });
            await usuario.save();
        } else if (!usuario.googleId) {
            // Cuenta existente sin Google — vincular
            usuario.googleId = googleId;
            if (!usuario.avatar && picture) usuario.avatar = picture;
            await usuario.save();
        }

        const token = jwt.sign(
            { userId: usuario._id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Sesión iniciada con Google',
            token,
            user: usuario.toJSON()
        });

    } catch (error) {
        console.error('Error en Google OAuth:', error);
        res.status(401).json({ error: 'Token de Google inválido o expirado' });
    }
});

module.exports = router;
