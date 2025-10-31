require('dotenv').config();
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const testPhone = '+918986534005';
const testEmail = 'riddhinaincy@gmail.com';
const testMessage = 'HELLO ! This is a rest from Uday from AI Voice Agent SaaS to verify your communication setup is working perfectly.';

async function testSMS() {
    console.log('\n=== Testing SMS ===');
    console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`To: ${testPhone}`);
    console.log(`Message: ${testMessage}`);

    try {
        const message = await client.messages.create({
            body: testMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: testPhone
        });

        console.log('✅ SMS sent successfully!');
        console.log(`Message SID: ${message.sid}`);
        console.log(`Status: ${message.status}`);
        return true;
    } catch (error) {
        console.log('❌ SMS failed!');
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function testEmailFunc() {
    console.log('\n=== Testing Email ===');
    console.log(`From: ${process.env.FROM_EMAIL}`);
    console.log(`To: ${testEmail}`);
    console.log(`Subject: Test Email from AI Voice Agent SaaS`);
    console.log(`Message: ${testMessage}`);

    try {
        const msg = {
            to: testEmail,
            from: process.env.FROM_EMAIL,
            subject: 'Test Email from AI Voice Agent SaaS',
            text: testMessage,
            html: `<p>${testMessage}</p><br><p><em>Sent from AI Voice Agent SaaS Test</em></p>`
        };

        await sgMail.send(msg);

        console.log('✅ Email sent successfully!');
        return true;
    } catch (error) {
        console.log('❌ Email failed!');
        console.log(`Error: ${error.message}`);
        if (error.response) {
            console.log(`Response body: ${JSON.stringify(error.response.body)}`);
        }
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Communication Tests...');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    console.log('\n=== Environment Check ===');
    console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ Missing'}`);
    console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`From Email: ${process.env.FROM_EMAIL || '❌ Missing'}`);

    const smsResult = await testSMS();
    const emailResult = await testEmailFunc();

    console.log('\n=== Test Results ===');
    console.log(`SMS Test: ${smsResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Email Test: ${emailResult ? '✅ PASSED' : '❌ FAILED'}`);

    if (smsResult && emailResult) {
        console.log('\n🎉 All tests passed! Your communication setup is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check your configuration and credentials.');
    }
}

runTests().catch(console.error);