/**
 * Cuentas verificadas: palomita y nombre en rojo (ligado al email, no al nombre mostrado).
 */
function getVerifiedEmails() {
    return String(process.env.VERIFIED_EMAILS || process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
}

function isVerifiedUser(user) {
    if (!user) {
        return false;
    }

    if (user.isVerified === true) {
        return true;
    }

    const email = String(user.email || '').trim().toLowerCase();
    if (!email) {
        return false;
    }

    return getVerifiedEmails().includes(email);
}

module.exports = {
    getVerifiedEmails,
    isVerifiedUser
};
