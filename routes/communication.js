const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// Initialize Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send SMS
router.post('/send-sms', async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        const sms = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        res.json({ success: true, messageSid: sms.sid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Send Email
router.post('/send-email', async (req, res) => {
    try {
        const { email, subject, message } = req.body;
        
        const msg = {
            to: email,
            from: process.env.FROM_EMAIL,
            subject: subject,
            text: message,
            html: `<p>${message.replace(/\n/g, '<br>')}</p>`
        };

        await sgMail.send(msg);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;