const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Vendor = require('../models/Vendor');
const ScheduleCall = require('../models/ScheduleCall');

// Middleware to check if admin is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.adminId) {
    return next();
  }
  res.redirect('/admin/login');
};

// Login page
router.get('/login', (req, res) => {
  res.render('admin/login', { messages: req.flash() });
});

// Register page
router.get('/register', (req, res) => {
  res.render('admin/register', { messages: req.flash() });
});

// Register POST
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.flash('error', 'Email already registered');
      return res.redirect('/admin/register');
    }

    const admin = new Admin({ email, password, firstName, lastName });
    await admin.save();
    
    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', 'Registration failed');
    res.redirect('/admin/register');
  }
});

// Login POST
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin || !(await admin.comparePassword(password))) {
      req.flash('error', 'Invalid credentials');
      return res.redirect('/admin/login');
    }

    req.session.adminId = admin._id;
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', 'Login failed');
    res.redirect('/admin/login');
  }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  const admin = await Admin.findById(req.session.adminId);
  const vendorCount = await Vendor.countDocuments();
  const callCount = await ScheduleCall.countDocuments();
  const adminCount = await Admin.countDocuments();
  
  res.render('admin/dashboard', { 
    admin, 
    vendorCount, 
    callCount, 
    adminCount,
    messages: req.flash() 
  });
});

// Manage Vendors
router.get('/vendors', isAuthenticated, async (req, res) => {
  const admin = await Admin.findById(req.session.adminId);
  const vendors = await Vendor.find().sort({ createdAt: -1 });
  res.render('admin/vendors', { admin, vendors, messages: req.flash() });
});

// Manage Calls
router.get('/calls', isAuthenticated, async (req, res) => {
  const admin = await Admin.findById(req.session.adminId);
  const calls = await ScheduleCall.find().populate('vendorId').sort({ createdAt: -1 });
  const vendors = await Vendor.find().sort({ firstName: 1 });
  res.render('admin/calls', { admin, calls, vendors, messages: req.flash() });
});

// Manage Admins
router.get('/admins', isAuthenticated, async (req, res) => {
  const admin = await Admin.findById(req.session.adminId);
  const admins = await Admin.find().sort({ createdAt: -1 });
  res.render('admin/admins', { admin, admins, messages: req.flash() });
});

// Delete vendor
router.delete('/vendor/:id', isAuthenticated, async (req, res) => {
  try {
    await Vendor.findByIdAndDelete(req.params.id);
    await ScheduleCall.deleteMany({ vendorId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// Delete call
router.delete('/call/:id', isAuthenticated, async (req, res) => {
  try {
    await ScheduleCall.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

// Add vendor
router.post('/vendor/add', isAuthenticated, async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    req.flash('success', 'Vendor added successfully');
    res.redirect('/admin/vendors');
  } catch (error) {
    req.flash('error', 'Failed to add vendor');
    res.redirect('/admin/vendors');
  }
});

// Edit vendor
router.get('/vendor/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

router.put('/vendor/:id', isAuthenticated, async (req, res) => {
  try {
    await Vendor.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Add admin
router.post('/admin/add', isAuthenticated, async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    req.flash('success', 'Admin added successfully');
    res.redirect('/admin/admins');
  } catch (error) {
    req.flash('error', 'Failed to add admin');
    res.redirect('/admin/admins');
  }
});

// Edit admin
router.get('/admin/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    res.json(admin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});

router.put('/admin/:id', isAuthenticated, async (req, res) => {
  try {
    await Admin.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Delete admin
router.delete('/admin/:id', isAuthenticated, async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// Add call
router.post('/call/add', isAuthenticated, async (req, res) => {
  try {
    const call = new ScheduleCall(req.body);
    await call.save();
    req.flash('success', 'Call added successfully');
    res.redirect('/admin/calls');
  } catch (error) {
    req.flash('error', 'Failed to add call');
    res.redirect('/admin/calls');
  }
});

// Edit call
router.get('/call/:id/edit', isAuthenticated, async (req, res) => {
  try {
    const call = await ScheduleCall.findById(req.params.id);
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

router.put('/call/:id', isAuthenticated, async (req, res) => {
  try {
    await ScheduleCall.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Toggle admin status
router.put('/admin/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    admin.isActive = !admin.isActive;
    await admin.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

module.exports = router;