// modules/auth/email.service.js
// Envoi d'emails via l'API HTTP de Brevo v5 (HTTPS port 443, jamais bloqué par Render).

const { BrevoClient } = require('@getbrevo/brevo');

const client = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY
});

const SENDER = {
    email: 'alannbaywala@gmail.com', // ton adresse vérifiée dans Brevo
    name: 'TrackCaloriLog'
};

/**
 * Envoie un email transactionnel via l'API Brevo v5.
 * @param {string} to - email destinataire
 * @param {string} subject - sujet du mail
 * @param {string} html - contenu HTML
 */
async function sendEmail(to, subject, html) {
    try {
        const result = await client.transactionalEmails.sendTransacEmail({
            sender: SENDER,
            to: [{ email: to }],
            subject: subject,
            htmlContent: html
        });
        console.log('✅ Mail envoyé via API Brevo:', result.messageId || JSON.stringify(result));
        return result;
    } catch (error) {
        const errMsg = error?.response?.text || error?.message || String(error);
        console.error('❌ Erreur API Brevo:', errMsg);
        throw new Error(errMsg);
    }
}

module.exports = { sendEmail };