require('dotenv').config();
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const testPhone = '+918986534005';
const testEmail = 'uday72192@gmail.com';

async function testSMS() {
    console.log('\n=== Testing SMS ===');
    try {
        const message = await client.messages.create({
            body: 'SMS test from AI Voice Agent SaaS - All systems working!',
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

async function testEmail() {
    console.log('\n=== Testing Email ===');
    console.log(`From: ${process.env.FROM_EMAIL}`);
    console.log(`To: ${testEmail}`);
    
    try {
        const msg = {
            to: testEmail,
            from: process.env.FROM_EMAIL,
            subject: 'Test Email from AI Voice Agent SaaS',
            text: 'Hello! This is a test email from your AI Voice Agent SaaS platform. Email functionality is working perfectly!',
            html: '<p>Hello! This is a test email from your <strong>AI Voice Agent SaaS</strong> platform.</p><p>Email functionality is working perfectly! ✅</p><br><p><em>Sent from AI Voice Agent SaaS Test</em></p>'
        };
        
        await sgMail.send(msg);
        console.log('✅ Email sent successfully!');
        return true;
    } catch (error) {
        console.log('❌ Email failed!');
        console.log(`Error: ${error.message}`);
        if (error.response) {
            console.log(`Response: ${JSON.stringify(error.response.body)}`);
        }
        return false;
    }
}

async function testVoiceCall() {
    console.log('\n=== Testing Voice Call ===');
    try {
        const call = await client.calls.create({
            twiml: '<Response><Say voice="alice">Hello! This is a test call from your AI Voice Agent SaaS platform. All communication systems are working perfectly. Thank you!</Say></Response>',
            to: testPhone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        
        console.log('✅ Voice call initiated successfully!');
        console.log(`Call SID: ${call.sid}`);
        return true;
    } catch (error) {
        console.log('❌ Voice call failed!');
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Testing ALL Communication Methods...');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    console.log('\n=== Environment Check ===');
    console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ Missing'}`);
    console.log(`SendGrid API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`From Email: ${process.env.FROM_EMAIL || '❌ Missing'}`);
    
    const smsResult = await testSMS();
    const emailResult = await testEmail();
    const callResult = await testVoiceCall();
    
    console.log('\n=== Final Results ===');
    console.log(`📱 SMS: ${smsResult ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`📧 Email: ${emailResult ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`📞 Voice Call: ${callResult ? '✅ WORKING' : '❌ FAILED'}`);
    
    const allWorking = smsResult && emailResult && callResult;
    
    if (allWorking) {
        console.log('\n🎉 ALL COMMUNICATION METHODS WORKING!');
        console.log('🚀 Your AI Voice Agent SaaS is ready for production!');
        console.log('📱 Check your phone and email for test messages.');
    } else {
        console.log('\n⚠️  Some methods failed. Check the errors above.');
    }
    
    return { sms: smsResult, email: emailResult, call: callResult };
}

runAllTests().catch(console.error);