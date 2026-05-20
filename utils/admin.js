/**
 * Comprueba si un usuario tiene permisos de administrador.
 * Se activa con isAdmin en la BD o con el email en ADMIN_EMAILS (.env, separados por coma).
 */
function getAdminEmails() {
    return String(process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
}

function isAdminUser(user) {
    if (!user) {
        return false;
    }

    if (user.isAdmin === true) {
        return true;
    }

    const email = String(user.email || '').trim().toLowerCase();
    if (!email) {
        return false;
    }

    return getAdminEmails().includes(email);
}

module.exports = {
    getAdminEmails,
    isAdminUser
};
