const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const ScheduleCall = require('../models/ScheduleCall');
const searchRouter = require('./search');

// In-memory cache for active calls
const activeCallsCache = new Map();

// Function to preload call data into cache
function preloadCallData(callId, callData) {
  const cacheData = {
    instructions: callData.callDescription,
    scheduleId: callData._id,
    email: callData.email,
    phoneNumber: callData.phoneNumber,
    context: callData.context
  };
  activeCallsCache.set(callId, cacheData);
  console.log(`✅ Preloaded complete call data for: ${callId}`);
}

// Export for use in other routes
router.preloadCallData = preloadCallData;

// Twilio webhook for incoming calls
router.post('/webhook', async (req, res) => {
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const to = req.body.To;
  
  console.log(`\n=== INCOMING CALL ===`);
  console.log(`Call SID: ${callSid}`);
  console.log(`From: ${from}, To: ${to}`);
  
  // Get scheduleId from query parameter
  const scheduleId = req.query.scheduleId;
  
  // Check cache first for instant access
  let callData = activeCallsCache.get(callSid) || activeCallsCache.get(scheduleId);
  
  if (callData) {
    console.log('✅ CACHE HIT - Instructions loaded instantly from RAM');
  } else {
    console.log('⚠️ CACHE MISS - Falling back to database lookup');
    // Find the scheduled call by ID first, then by callSid, then by phone number
    let scheduledCall = null;
    
    if (scheduleId) {
      scheduledCall = await ScheduleCall.findById(scheduleId);
    }
    
    if (!scheduledCall) {
      scheduledCall = await ScheduleCall.findOne({ callSid: callSid });
    }
    
    if (!scheduledCall) {
      scheduledCall = await ScheduleCall.findOne({ 
        phoneNumber: to,
        status: 'completed'
      }).sort({ createdAt: -1 });
    }
    
    callData = {
      instructions: scheduledCall ? scheduledCall.callDescription : 
        'You are a helpful AI customer service agent. Greet the caller warmly and ask how you can help them today.',
      scheduleId: scheduledCall ? scheduledCall._id : null,
      email: scheduledCall ? scheduledCall.email : null,
      phoneNumber: scheduledCall ? scheduledCall.phoneNumber : null,
      context: scheduledCall ? scheduledCall.context : null
    };
    
    // Cache for this call
    if (callSid) activeCallsCache.set(callSid, callData);
    if (scheduleId) activeCallsCache.set(scheduleId, callData);
  }
  
  console.log(`Found scheduled call: ${callData.scheduleId || 'None'}`);
  console.log(`Using custom instructions: ${callData.instructions ? 'YES' : 'NO'}`);
  console.log(`Instructions preview: ${callData.instructions.substring(0, 200)}...`);
  
  // TwiML response to connect directly to WebSocket (no connecting message)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://${req.get('host').replace('https://', 'wss://').replace('http://', 'ws://')}/voice/stream">
            <Parameter name="instructions" value="${callData.instructions.replace(/"/g, '&quot;')}" />
            <Parameter name="callSid" value="${callSid}" />
            <Parameter name="customerEmail" value="${callData.email || ''}" />
            <Parameter name="customerPhone" value="${callData.phoneNumber || ''}" />
        </Stream>
    </Connect>
</Response>`;
  
  res.type('text/xml');
  res.send(twiml);
});

// WebSocket handler for audio streaming
router.ws('/stream', (ws, req) => {
  console.log('\n=== WebSocket Connected ===');
  
  let openaiWs = null;
  let instructions = '';
  let callSid = '';
  let streamSid = '';
  let conversation = [];
  let cleanTranscript = [];
  let userTranscript = '';
  let aiTranscript = '';
  let isAudioPlaying = false;
  let pendingCallEnd = false;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.event === 'start') {
        console.log('Call started:', data.start.callSid);
        callSid = data.start.callSid;
        streamSid = data.start.streamSid;
        instructions = data.start.customParameters?.instructions || 'Be helpful and friendly.';
        const customerEmail = data.start.customParameters?.customerEmail || '';
        const customerPhone = data.start.customParameters?.customerPhone || '';
        console.log('Stream SID:', streamSid);
        console.log('✅ Customer Email:', customerEmail);
        console.log('Using instructions:', instructions.substring(0, 100) + '...');
        
        // Connect to OpenAI Realtime API with optimized settings
        openaiWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17', {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1'
          },
          perMessageDeflate: false // Disable compression for lower latency
        });
        
        openaiWs.on('open', () => {
          console.log('Connected to OpenAI Realtime API');
          
          // Configure the session with comprehensive instructions and web search tools
          const baseInstructions = `
CORE BEHAVIOR GUIDELINES:
• Be PRECISE, CALM, and POLITE in all interactions
• Stay FOCUSED on the call purpose - don't deviate to other topics
• Speak clearly and at a measured pace
• Ask ONLY RELEVANT questions related to the call objective
• Focus on SOLVING the specific issue or achieving the call goal
• Listen carefully and respond thoughtfully
• Only ask ONE question at a time and wait for responses

STAY ON PURPOSE:
• Follow your custom instructions strictly
• Don't discuss unrelated topics or services
• Keep conversation focused on the specific call objective
• Politely redirect if customer goes off-topic
• Complete the call goal efficiently

TOOL USAGE RULES:
• ONLY use tools when NECESSARY for the call purpose
• web_search: Only when customer asks for specific current information
• send_email: Only when needed for call objective (verification, documents)
• end_call: When conversation is naturally complete or customer requests
• DON'T use tools unnecessarily or for unrelated topics

CONVERSATION FLOW:
• Start with warm, professional greeting
• State call purpose clearly
• Focus on achieving the specific objective
• Handle objections related to call purpose only
• End with clear resolution or next steps
• Use end_call function when appropriate

CUSTOMER DATA:
• Customer Email: ${customerEmail}
• Customer Phone: ${customerPhone}

CUSTOM INSTRUCTIONS:
${instructions}

IMPORTANT: Follow the custom instructions above while maintaining the core behavior guidelines. When using send_email function, use the customer email provided above.`;
          
          openaiWs.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: baseInstructions,
              voice: 'shimmer',
              input_audio_format: 'g711_ulaw',
              output_audio_format: 'g711_ulaw',
              temperature: 0.7,
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.3,
                prefix_padding_ms: 100,
                silence_duration_ms: 400
              },
              tools: [{
                type: 'function',
                name: 'web_search',
                description: 'Search the web for current information, prices, news, or any real-time data. Only use when customer asks for specific current information.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'The search query to find current information'
                    }
                  },
                  required: ['query']
                }
              }, {
                type: 'function',
                name: 'send_email',
                description: 'Send an email to the customer. Only use when specifically needed for the call purpose (verification links, documents, etc.)',
                parameters: {
                  type: 'object',
                  properties: {
                    email: {
                      type: 'string',
                      description: 'Customer email address'
                    },
                    subject: {
                      type: 'string',
                      description: 'Email subject line'
                    },
                    message: {
                      type: 'string',
                      description: 'Email content/message'
                    }
                  },
                  required: ['email', 'subject', 'message']
                }
              }, {
                type: 'function',
                name: 'get_pricing',
                description: 'Get LeadGenLite pricing plans when customer asks about costs, plans, or pricing',
                parameters: {
                  type: 'object',
                  properties: {
                    plan_type: {
                      type: 'string',
                      description: 'Specific plan type if mentioned (starter, pro, agency) or "all" for all plans'
                    }
                  },
                  required: ['plan_type']
                }
              }, {
                type: 'function',
                name: 'get_faqs',
                description: 'Get frequently asked questions when customer has questions about features, billing, or general inquiries',
                parameters: {
                  type: 'object',
                  properties: {
                    topic: {
                      type: 'string',
                      description: 'FAQ topic like "billing", "features", "plans", or "general"'
                    }
                  },
                  required: ['topic']
                }
              }, {
                type: 'function',
                name: 'get_features',
                description: 'Get detailed LeadGenLite features when customer asks about capabilities or what the platform does',
                parameters: {
                  type: 'object',
                  properties: {
                    feature_category: {
                      type: 'string',
                      description: 'Feature category like "lead_generation", "email", "crm", "invoicing", or "all"'
                    }
                  },
                  required: ['feature_category']
                }
              }, {
                type: 'function',
                name: 'end_call',
                description: 'End the call ONLY as the very last action after saying your complete final goodbye. Do NOT call this function while you are still speaking or have more to say. Use only when conversation is 100% complete.',
                parameters: {
                  type: 'object',
                  properties: {
                    reason: {
                      type: 'string',
                      description: 'Reason for ending the call'
                    }
                  },
                  required: ['reason']
                }
              }]
            }
          }));
          
          // Start conversation immediately without delay
          openaiWs.send(JSON.stringify({
            type: 'response.create'
          }));
        });
        
        openaiWs.on('message', async (data) => {
          const response = JSON.parse(data);
          
          if (response.type === 'response.audio.delta') {
            isAudioPlaying = true;
            // Send audio back to Twilio
            ws.send(JSON.stringify({
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: response.delta
              }
            }));
          }
          
          if (response.type === 'response.audio.done') {
            isAudioPlaying = false;
            console.log('🔊 Audio playback completed');
          }
          
          if (response.type === 'response.done') {
            console.log('✅ Complete response finished');
            
            // If call end was requested, end now that entire response is done
            if (pendingCallEnd) {
              console.log('📞 Executing pending call end after complete response');
              setTimeout(() => {
                console.log('📞 Final call termination after extended audio buffer');
                if (openaiWs) openaiWs.close();
                ws.close();
              }, 6000); // Extra 2-3 seconds for complete sentence playback
            }
          }
          
          if (response.type === 'input_audio_buffer.speech_started') {
            console.log('🎤 User started speaking - cancelling AI response');
            // Cancel current AI response to allow user to speak
            openaiWs.send(JSON.stringify({
              type: 'response.cancel'
            }));
          }
          
          if (response.type === 'conversation.item.input_audio_transcription.completed') {
            userTranscript = response.transcript;
            console.log('User said:', userTranscript);
            if (userTranscript.trim()) {
              cleanTranscript.push({
                role: 'user',
                message: userTranscript,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          if (response.type === 'response.audio_transcript.done') {
            aiTranscript = response.transcript;
            console.log('AI said:', aiTranscript);
            if (aiTranscript.trim()) {
              cleanTranscript.push({
                role: 'assistant',
                message: aiTranscript,
                timestamp: new Date().toISOString()
              });
            }
          }
          
          if (response.type === 'response.function_call_arguments.done') {
            console.log('🔧 Function call:', response.name, response.arguments);
            
            try {
              const args = JSON.parse(response.arguments);
              
              if (response.name === 'web_search') {
                console.log('🔍 Searching for:', args.query);
                const searchResult = await searchRouter.searchWeb(args.query);
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({
                      success: searchResult.success,
                      answer: searchResult.answer || 'No information found',
                      sources: searchResult.sources || []
                    })
                  }
                }));
                
              } else if (response.name === 'send_email') {
                console.log('📧 Sending email to:', args.email);
                const sgMail = require('@sendgrid/mail');
                
                const msg = {
                  to: args.email,
                  from: process.env.FROM_EMAIL,
                  subject: args.subject,
                  text: args.message,
                  html: `<p>${args.message.replace(/\n/g, '<br>')}</p>`
                };
                
                await sgMail.send(msg);
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({
                      success: true,
                      message: 'Email sent successfully'
                    })
                  }
                }));
                
              } else if (response.name === 'get_pricing') {
                console.log('💰 Getting pricing for:', args.plan_type);
                
                const pricingData = {
                  starter: { name: 'Starter', price: '₹99/month', features: ['50 leads/month', '5 email templates', 'Basic analytics', 'Email support'] },
                  pro: { name: 'Pro', price: '₹1,499/month', features: ['2,000 leads/month', 'Unlimited templates', 'Advanced analytics', 'Priority support', 'AI email generation'] },
                  agency: { name: 'Agency', price: '₹3,999/month', features: ['Unlimited leads', 'White-label solution', 'API access', 'Team accounts', 'Dedicated support'] },
                  all: 'Starter ₹99/month, Pro ₹1,499/month (Most Popular), Agency ₹3,999/month. All plans include 7-day free trial, no setup fees.'
                };
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({ success: true, data: pricingData[args.plan_type] || pricingData.all })
                  }
                }));
                
              } else if (response.name === 'get_faqs') {
                console.log('❓ Getting FAQs for:', args.topic);
                
                const faqData = {
                  billing: 'You can change plans anytime with immediate effect and prorated billing. We accept all major credit cards. Annual billing saves 20%.',
                  features: 'LeadGenLite includes AI lead generation, personalized email outreach, CRM, project management, invoicing, and support system - all in one platform.',
                  plans: 'Free trial available. Starter (₹99) for freelancers, Pro (₹1,499) for growing businesses, Agency (₹3,999) for teams. No setup fees.',
                  general: 'No credit card required for trial. Setup takes 2 minutes. Get first leads within 24 hours. Cancel anytime with no hidden costs.'
                };
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({ success: true, data: faqData[args.topic] || faqData.general })
                  }
                }));
                
              } else if (response.name === 'get_features') {
                console.log('🚀 Getting features for:', args.feature_category);
                
                const featureData = {
                  lead_generation: 'AI finds and scores leads from 110+ business categories with geographic targeting. 4 campaign modes: Location-based, Category-focused, Keyword search, Custom targeting.',
                  email: 'AI-powered personalized emails with batch generation, industry-specific templates, and automated outreach for higher conversion rates.',
                  crm: 'Complete lead-to-client conversion with relationship tracking, business profiles, and interaction management in one dashboard.',
                  invoicing: 'Professional invoicing with multiple templates, tax calculations, PDF generation, payment tracking, and status monitoring.',
                  all: 'Complete business platform: AI lead generation (110+ categories), personalized email outreach, CRM, project management, professional invoicing, and support system.'
                };
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({ success: true, data: featureData[args.feature_category] || featureData.all })
                  }
                }));
                
              } else if (response.name === 'end_call') {
                if (pendingCallEnd) {
                  console.log('⚠️ Duplicate end_call ignored - call already ending');
                  return;
                }
                
                console.log('📞 Call end requested:', args.reason);
                console.log('🕰️ Waiting for complete audio playback before ending...');
                
                openaiWs.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: response.call_id,
                    output: JSON.stringify({
                      success: true,
                      message: 'Call will end gracefully after audio completes'
                    })
                  }
                }));
                
                // Mark call for ending but don't end immediately
                pendingCallEnd = true;
                
                // Safety timeout in case response doesn't complete
                setTimeout(() => {
                  if (pendingCallEnd) {
                    console.log('📞 Safety timeout - ending call');
                    if (openaiWs) openaiWs.close();
                    ws.close();
                  }
                }, 8000); // Longer timeout for complete responses
              }
              
              // Generate response for all function calls
              openaiWs.send(JSON.stringify({
                type: 'response.create'
              }));
              
            } catch (error) {
              console.error('Function call error:', error);
            }
          }
        });
        
      } else if (data.event === 'media') {
        // Forward audio to OpenAI with minimal processing
        if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          // Send audio immediately without additional processing
          openaiWs.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: data.media.payload
          }));
        }
        
      } else if (data.event === 'stop') {
        console.log('Call ended');
        
        // Save call transcript and clean cache
        if (callSid) {
          await saveCallTranscript(callSid, cleanTranscript, instructions);
          // Clean up ALL cache entries for this call
          activeCallsCache.delete(callSid);
          // Also clean by schedule ID if exists
          const scheduleId = req.query?.scheduleId;
          if (scheduleId) activeCallsCache.delete(scheduleId);
          console.log('🧹 Cache cleaned for call:', callSid);
        }
        
        if (openaiWs) {
          openaiWs.close();
        }
      }
      
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket disconnected');
    if (openaiWs) {
      openaiWs.close();
    }
  });
});

// Save call transcript and update status
async function saveCallTranscript(callSid, cleanTranscript, instructions) {
  try {
    console.log(`\n=== SAVING CALL TRANSCRIPT ===`);
    console.log(`Call SID: ${callSid}`);
    console.log(`Transcript messages: ${cleanTranscript.length}`);
    
    // Create readable transcript
    const readableTranscript = cleanTranscript.map(item => 
      `${item.role.toUpperCase()}: ${item.message}`
    ).join('\n\n');
    
    console.log('Clean transcript:', readableTranscript);
    
    // Find and update the scheduled call by callSid or most recent
    const scheduledCall = await ScheduleCall.findOne({ 
      callSid: callSid
    }) || await ScheduleCall.findOne({ 
      status: 'completed' 
    }).sort({ createdAt: -1 });
    
    if (scheduledCall) {
      await ScheduleCall.findByIdAndUpdate(scheduledCall._id, {
        transcript: readableTranscript,
        callSid: callSid,
        completedAt: new Date()
      });
      
      console.log(`Updated schedule call: ${scheduledCall._id}`);
    }
    
    console.log('=== TRANSCRIPT SAVED ===\n');
    
  } catch (error) {
    console.error('Error saving transcript:', error);
  }
}

module.exports = router;