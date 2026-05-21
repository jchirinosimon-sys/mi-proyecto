/**
 * Marca una cuenta como verificada (palomita + nombre rojo).
 * Uso: node db/setVerified.js tu@email.com
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('Uso: node db/setVerified.js tu@email.com');
    process.exit(1);
}

async function setVerified() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sirnergia');

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { isVerified: true, isAdmin: true },
            { new: true }
        );

        if (!user) {
            console.error(`No se encontró ningún usuario con el email ${email}`);
            process.exit(1);
        }

        console.log(`✓ ${user.firstName} ${user.lastName} (${user.email}) ahora está verificado.`);
        console.log('Cierra sesión y vuelve a entrar para ver la palomita y el nombre rojo.');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

setVerified();
