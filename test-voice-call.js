require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const testPhone = '+918986534005';
const testMessage = 'Hello! This is a test call from your AI Voice Agent SaaS platform. This call is working perfectly. Thank you for testing.';

async function testVoiceCall() {
    console.log('\n=== Testing Voice Call ===');
    console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`To: ${testPhone}`);
    console.log(`Message: ${testMessage}`);
    
    try {
        const call = await client.calls.create({
            twiml: `<Response><Say voice="alice">${testMessage}</Say></Response>`,
            to: testPhone,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        
        console.log('✅ Voice call initiated successfully!');
        console.log(`Call SID: ${call.sid}`);
        console.log(`Status: ${call.status}`);
        console.log(`Direction: ${call.direction}`);
        console.log('📞 You should receive a call shortly!');
        return true;
    } catch (error) {
        console.log('❌ Voice call failed!');
        console.log(`Error: ${error.message}`);
        return false;
    }
}

async function testSMS() {
    console.log('\n=== Testing SMS ===');
    console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`To: ${testPhone}`);
    
    try {
        const message = await client.messages.create({
            body: 'SMS test from AI Voice Agent SaaS - Working perfectly!',
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

async function runTests() {
    console.log('🚀 Testing Twilio Voice + SMS...');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    console.log('\n=== Environment Check ===');
    console.log(`Twilio Account SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
    console.log(`Twilio Auth Token: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || '❌ Missing'}`);
    
    const smsResult = await testSMS();
    const callResult = await testVoiceCall();
    
    console.log('\n=== Test Results ===');
    console.log(`SMS Test: ${smsResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Voice Call Test: ${callResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (smsResult && callResult) {
        console.log('\n🎉 All Twilio services working! SMS + Voice calls ready.');
        console.log('📱 Check your phone for the test call and SMS.');
    } else {
        console.log('\n⚠️  Some tests failed. Check your Twilio configuration.');
    }
}

runTests().catch(console.error);