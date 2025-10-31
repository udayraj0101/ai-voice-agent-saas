const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vendorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isProfileComplete: { type: Boolean, default: false },
  
  // Company Details
  companyName: String,
  companyPhone: String,
  companyAddress: String,
  companyWebsite: String,
  businessType: String,
  companyDescription: String,
  
  // Personal Details
  firstName: String,
  lastName: String,
  position: String,
  phone: String,
  
  createdAt: { type: Date, default: Date.now }
});

vendorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

vendorSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Vendor', vendorSchema);