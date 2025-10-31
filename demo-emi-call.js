require('dotenv').config();
const mongoose = require('mongoose');
const ScheduleCall = require('./models/ScheduleCall');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createDemoEMICall() {
  try {
    const demoCall = new ScheduleCall({
      vendorId: '68f38e266c812cbc45dd956c', // Your vendor ID
      phoneNumber: '+918986534005',
      email: 'prashant@example.com',
      context: 'EMI Payment Follow-up for Prashant - 2000 Rs pending',
      callDescription: `You are calling Prashant about his EMI payment. IMPORTANT: Speak slowly, pause after each question, and wait for his response before continuing.

1. GREETING: "Hello Prashant! This is calling from the finance team. I hope you're doing well today." [PAUSE AND WAIT FOR RESPONSE]

2. PURPOSE: "I'm calling regarding your EMI of 2,000 rupees. I wanted to check in with you about the payment status." [PAUSE]

3. ASK ABOUT PAYMENT: "Could you please let me know when you're planning to make your next EMI payment?" [WAIT FOR HIS ANSWER - DO NOT CONTINUE UNTIL HE RESPONDS]

4. LISTEN TO RESPONSE: Acknowledge what he says. If he gives a date, say "Thank you for letting me know."

5. IF HE HAS ISSUES: Only if he mentions problems, ask: "I understand. Are you facing any financial difficulties?"

6. OFFER HELP: "We're here to help. If you need assistance, please let me know." [PAUSE FOR RESPONSE]

7. GET COMMITMENT: "When do you think you'll be able to make the payment?" [WAIT FOR ANSWER]

8. CONFIRM: "So you'll make the payment of 2,000 rupees by [date he said]. Is that correct?" [WAIT FOR CONFIRMATION]

9. CLOSING: "Thank you for your time, Prashant. Have a great day!"

CRITICAL RULES:
- ALWAYS pause after questions and wait for responses
- Don't rush through multiple steps at once
- Listen to what Prashant actually says
- Only ask one question at a time
- Be conversational, not robotic`,
      scheduledTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      actionType: 'call'
    });

    await demoCall.save();
    
    console.log('✅ Demo EMI call created successfully!');
    console.log(`Call ID: ${demoCall._id}`);
    console.log(`Phone: ${demoCall.phoneNumber}`);
    console.log(`Context: ${demoCall.context}`);
    console.log('\n📋 Instructions Preview:');
    console.log(demoCall.callDescription.substring(0, 300) + '...');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating demo call:', error);
    process.exit(1);
  }
}

createDemoEMICall();