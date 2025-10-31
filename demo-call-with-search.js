require('dotenv').config();
const mongoose = require('mongoose');
const ScheduleCall = require('./models/ScheduleCall');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function createSearchDemoCall() {
  try {
    const demoCall = new ScheduleCall({
      vendorId: '68f38e266c812cbc45dd956c', // Your vendor ID
      phoneNumber: '+918986534005',
      email: 'demo@example.com',
      context: 'Tech Support - Product Information & Pricing Inquiry',
      callDescription: `You are a tech support agent helping customers with product information. Use web search for current data.

GREETING:
"Hello! This is calling from TechWorld customer support. How can I help you today?"
[PAUSE AND WAIT FOR RESPONSE]

LISTEN TO CUSTOMER:
Listen carefully to what they're asking about. Common inquiries:
- Product pricing
- Feature comparisons
- Latest specifications
- Availability
- Competitor information

USE WEB SEARCH FOR:
- "What's the price of [product]?"
- "How does [product A] compare to [product B]?"
- "What are the latest features of [product]?"
- "Is [product] available in India?"
- "What's better, [product A] or [product B]?"

SEARCH PROCESS:
When you need current information, say:
"Let me check the most up-to-date information for you."
[Use web_search function with specific query]
"Based on the latest information I found..."

EXAMPLE RESPONSES:

For iPhone pricing:
"Let me get you the current iPhone pricing in India."
[Search: "iPhone 15 current price India 2024"]
"According to the latest information, the iPhone 15 starts at ₹79,900 for the 128GB model."

For comparisons:
"I'll compare those products for you with the latest specifications."
[Search: "iPhone 15 vs Samsung Galaxy S24 comparison 2024"]
"Based on current reviews, here are the key differences..."

For availability:
"Let me check the current availability status."
[Search: "MacBook Pro M3 availability India stock 2024"]
"The latest stock information shows..."

IMPORTANT RULES:
- Always search for current, accurate information
- Be specific with search queries
- Summarize results in simple terms
- Mention information is current/up-to-date
- If search fails, offer to help differently
- Only ask one question at a time
- Wait for customer responses

CLOSING:
"Is there anything else you'd like to know about our products?"
[WAIT FOR RESPONSE]
"Thank you for contacting TechWorld. Have a great day!"`,
      scheduledTime: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes from now
      actionType: 'call'
    });

    await demoCall.save();
    
    console.log('✅ Demo Search Call Created Successfully!');
    console.log(`📞 Call ID: ${demoCall._id}`);
    console.log(`📱 Phone: ${demoCall.phoneNumber}`);
    console.log(`📋 Context: ${demoCall.context}`);
    console.log('\n🔍 Search Features:');
    console.log('• Real-time product pricing');
    console.log('• Feature comparisons');
    console.log('• Availability checks');
    console.log('• Competitor analysis');
    console.log('\n💡 Test Questions to Ask:');
    console.log('• "What\'s the current price of iPhone 15?"');
    console.log('• "How does iPhone compare to Samsung Galaxy?"');
    console.log('• "What are the latest MacBook features?"');
    console.log('• "Is PlayStation 5 available in India?"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating demo call:', error);
    process.exit(1);
  }
}

createSearchDemoCall();