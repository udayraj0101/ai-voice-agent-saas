const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const ScheduleCall = require('../models/ScheduleCall');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

// Initialize Twilio and SendGrid
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Execute action function
async function executeAction(scheduleCall) {
  try {
    if (scheduleCall.actionType === 'sms' && scheduleCall.phoneNumber) {
      await client.messages.create({
        body: scheduleCall.callDescription,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: scheduleCall.phoneNumber
      });
      await ScheduleCall.findByIdAndUpdate(scheduleCall._id, { status: 'completed' });
    } else if (scheduleCall.actionType === 'email' && scheduleCall.email) {
      const msg = {
        to: scheduleCall.email,
        from: process.env.FROM_EMAIL,
        subject: scheduleCall.context,
        text: scheduleCall.callDescription,
        html: `<p>${scheduleCall.callDescription.replace(/\n/g, '<br>')}</p>`
      };
      await sgMail.send(msg);
      await ScheduleCall.findByIdAndUpdate(scheduleCall._id, { status: 'completed' });
    }
  } catch (error) {
    console.error('Error executing action:', error);
    await ScheduleCall.findByIdAndUpdate(scheduleCall._id, { status: 'failed' });
  }
}

// Middleware to check if vendor is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.vendorId) {
    return next();
  }
  res.redirect('/vendor/login');
};

// Login page
router.get('/login', (req, res) => {
  res.render('vendor/login', { messages: req.flash() });
});

// Register page
router.get('/register', (req, res) => {
  res.render('vendor/register', { messages: req.flash() });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      req.flash('error', 'Email already registered');
      return res.redirect('/vendor/register');
    }

    const vendor = new Vendor({ email, password });
    await vendor.save();
    
    req.session.vendorId = vendor._id;
    res.redirect('/vendor/profile');
  } catch (error) {
    req.flash('error', 'Registration failed');
    res.redirect('/vendor/register');
  }
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const vendor = await Vendor.findOne({ email });
    if (!vendor || !(await vendor.comparePassword(password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/vendor/login');
    }

    req.session.vendorId = vendor._id;
    
    if (!vendor.isProfileComplete) {
      return res.redirect('/vendor/profile');
    }
    
    res.redirect('/vendor/dashboard');
  } catch (error) {
    req.flash('error', 'Login failed');
    res.redirect('/vendor/login');
  }
});

// Profile completion
router.get('/profile', isAuthenticated, async (req, res) => {
  const vendor = await Vendor.findById(req.session.vendorId);
  res.render('vendor/profile', { vendor, messages: req.flash() });
});

router.post('/profile', isAuthenticated, async (req, res) => {
  try {
    const updateData = { ...req.body, isProfileComplete: true };
    await Vendor.findByIdAndUpdate(req.session.vendorId, updateData);
    
    req.flash('success', 'Profile completed successfully');
    res.redirect('/vendor/dashboard');
  } catch (error) {
    req.flash('error', 'Profile update failed');
    res.redirect('/vendor/profile');
  }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  const vendor = await Vendor.findById(req.session.vendorId);
  
  if (!vendor.isProfileComplete) {
    return res.redirect('/vendor/profile');
  }
  
  const scheduledCalls = await ScheduleCall.find({ vendorId: req.session.vendorId }).sort({ createdAt: -1 });
  res.render('vendor/dashboard', { vendor, scheduledCalls, messages: req.flash() });
});

// Schedule call
router.post('/schedule-call', isAuthenticated, async (req, res) => {
  try {
    const { phoneNumber, email, context, callDescription, scheduledTime } = req.body;
    
    console.log(`\n=== SCHEDULING COMMUNICATION ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Vendor ID: ${req.session.vendorId}`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Email: ${email || 'Not provided'}`);
    console.log(`Context: ${context}`);
    console.log(`Scheduled Time: ${scheduledTime}`);
    
    const scheduleCall = new ScheduleCall({
      vendorId: req.session.vendorId,
      phoneNumber,
      email: email || null,
      context,
      callDescription,
      scheduledTime: new Date(scheduledTime)
    });
    
    await scheduleCall.save();
    console.log(`Schedule saved with ID: ${scheduleCall._id}`);
    console.log('=== SCHEDULING COMPLETED ===\n');
    
    req.flash('success', 'Communication scheduled successfully');
    res.redirect('/vendor/calls');
  } catch (error) {
    console.log(`\n=== SCHEDULING FAILED ===`);
    console.log(`Error: ${error.message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('=== END ERROR LOG ===\n');
    
    req.flash('error', 'Failed to schedule communication');
    res.redirect('/vendor/calls');
  }
});

// Get call for editing
router.get('/edit-call/:id', isAuthenticated, async (req, res) => {
  try {
    const call = await ScheduleCall.findById(req.params.id);
    if (!call || call.vendorId.toString() !== req.session.vendorId) {
      return res.status(404).json({ error: 'Call not found' });
    }
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Update call
router.put('/edit-call/:id', isAuthenticated, async (req, res) => {
  try {
    const { phoneNumber, email, context, callDescription, scheduledTime } = req.body;
    const call = await ScheduleCall.findById(req.params.id);
    
    if (!call || call.vendorId.toString() !== req.session.vendorId) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    await ScheduleCall.findByIdAndUpdate(req.params.id, {
      phoneNumber,
      email: email || null,
      context,
      callDescription,
      scheduledTime: new Date(scheduledTime)
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Delete call
router.delete('/delete-call/:id', isAuthenticated, async (req, res) => {
  try {
    const call = await ScheduleCall.findById(req.params.id);
    if (!call || call.vendorId.toString() !== req.session.vendorId) {
      return res.status(404).json({ error: 'Call not found' });
    }
    await ScheduleCall.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

// Profile details view
router.get('/profile-details', isAuthenticated, async (req, res) => {
  const vendor = await Vendor.findById(req.session.vendorId);
  res.render('vendor/profile-details', { vendor });
});

// Calls management page
router.get('/calls', isAuthenticated, async (req, res) => {
  const vendor = await Vendor.findById(req.session.vendorId);
  
  if (!vendor.isProfileComplete) {
    return res.redirect('/vendor/profile');
  }
  
  const scheduledCalls = await ScheduleCall.find({ vendorId: req.session.vendorId }).sort({ createdAt: -1 });
  res.render('vendor/calls', { vendor, scheduledCalls, messages: req.flash() });
});

// Execute communication action
router.post('/execute-action/:id', isAuthenticated, async (req, res) => {
  try {
    const { actionType } = req.body;
    const call = await ScheduleCall.findById(req.params.id);
    
    if (!call || call.vendorId.toString() !== req.session.vendorId) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }
    
    console.log(`\n=== EXECUTING ${actionType.toUpperCase()} ACTION ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Call ID: ${call._id}`);
    console.log(`Vendor ID: ${call.vendorId}`);
    console.log(`Action Type: ${actionType}`);
    console.log(`Contact: ${actionType === 'email' ? call.email : call.phoneNumber}`);
    console.log(`Context: ${call.context}`);
    console.log(`Description/Instructions: ${call.callDescription}`);
    
    let result;
    
    if (actionType === 'sms' && call.phoneNumber) {
      console.log('Sending SMS via Twilio...');
      result = await client.messages.create({
        body: call.callDescription,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: call.phoneNumber
      });
      console.log(`SMS Result: SID=${result.sid}, Status=${result.status}`);
      
    } else if (actionType === 'email' && call.email) {
      console.log('Sending Email via SendGrid...');
      const sgMail = require('@sendgrid/mail');
      const msg = {
        to: call.email,
        from: process.env.FROM_EMAIL,
        subject: call.context,
        text: call.callDescription,
        html: `<p>${call.callDescription.replace(/\n/g, '<br>')}</p>`
      };
      await sgMail.send(msg);
      console.log('Email sent successfully');
      
    } else if (actionType === 'call' && call.phoneNumber) {
      console.log('Making AI Voice Call via Twilio...');
      
      // Preload call data into cache BEFORE making the call
      const voiceRouter = require('./voice');
      if (voiceRouter.preloadCallData) {
        voiceRouter.preloadCallData(call._id.toString(), call);
        console.log('Call data preloaded BEFORE Twilio call');
      }
      
      // Create call with custom parameters to pass instructions
      result = await client.calls.create({
        url: `https://${req.get('host')}/voice/webhook?scheduleId=${call._id}`,
        to: call.phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        method: 'POST'
      });
      
      // Save callSid and preload with callSid too for double safety
      await ScheduleCall.findByIdAndUpdate(call._id, { callSid: result.sid });
      if (voiceRouter.preloadCallData) {
        voiceRouter.preloadCallData(result.sid, call);
        console.log('Call data also cached with CallSid for instant webhook access');
      }
      
      console.log(`AI Call Result: SID=${result.sid}, Status=${result.status}`);
      console.log(`AI Instructions: ${call.callDescription.substring(0, 200)}...`);
      console.log(`Call data preloaded for instant access`);
    }
    
    // Update status to completed
    await ScheduleCall.findByIdAndUpdate(call._id, { status: 'completed' });
    console.log('Status updated to completed');
    console.log('=== ACTION COMPLETED SUCCESSFULLY ===\n');
    
    res.json({ success: true, result: result?.sid || 'completed' });
    
  } catch (error) {
    console.log(`\n=== ACTION FAILED ===`);
    console.log(`Error: ${error.message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('=== END ERROR LOG ===\n');
    
    // Update status to failed
    await ScheduleCall.findByIdAndUpdate(req.params.id, { status: 'failed' });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test voice call
router.post('/test-voice-call', isAuthenticated, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    const call = await client.calls.create({
      twiml: `<Response><Say voice="alice">${message}</Say></Response>`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    res.json({ success: true, callSid: call.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/vendor/login');
});

module.exports = router;