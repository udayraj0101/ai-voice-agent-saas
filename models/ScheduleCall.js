const mongoose = require('mongoose');

const scheduleCallSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String },
  context: { type: String, required: true },
  callDescription: { type: String, required: true },
  scheduledTime: { type: Date, required: true },
  actionType: { type: String, enum: ['call', 'sms', 'email'], default: 'call' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transcript: { type: String },
  callSid: { type: String },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScheduleCall', scheduleCallSchema);