require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const path = require('path');
const expressWs = require('express-ws');

const app = express();
expressWs(app);
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(flash());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/vendor', require('./routes/vendor'));
app.use('/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/communication', require('./routes/communication'));
app.use('/voice', require('./routes/voice'));
app.get('/', (req, res) => res.redirect('/vendor/login'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});