require('dotenv').config();
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const testPhone = '+918986534005';
const testEmail = 'uday72192@gmail.com';
const testMessage = 'Hello! This is a test from your AI Voice Agent SaaS platform.';

// Gmail transporter
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: 'your-gmail@gmail.com', // Replace with your Gmail
        pass: 'your-app-password'     // Replace with Gmail App Password
    }
});

async function testSMS() {
    console.log('\n=== Testing SMS ===');
    console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`To: ${testPhone}`);
    
    try {
        const message = await client.messages.create({
            body: testMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: testPhone
        });
        
        console.log('✅ SMS sent successfully!');
        console.log(`Message SID: ${message.sid}`);
        return true;
    } catch (error) {
        console.log('❌ SMS failed!');
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function testGmailEmail() {
    console.log('\n=== Testing Gmail Email ===');
    console.log(`To: ${testEmail}`);
    
    try {
        const mailOptions = {
            from: 'your-gmail@gmail.com',
            to: testEmail,
            subject: 'Test Email from AI Voice Agent SaaS',
            text: testMessage,
            html: `<p>${testMessage}</p><br><p><em>Sent via Gmail SMTP</em></p>`
        };
        
        await transporter.sendMail(mailOptions);
        console.log('✅ Gmail email sent successfully!');
        return true;
    } catch (error) {
        console.log('❌ Gmail email failed!');
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Testing SMS + Gmail Email...');
    
    const smsResult = await testSMS();
    const emailResult = await testGmailEmail();
    
    console.log('\n=== Results ===');
    console.log(`SMS: ${smsResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Email: ${emailResult ? '✅ PASSED' : '❌ FAILED'}`);
}

runTests().catch(console.error);