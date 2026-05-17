const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));

// Global error handler — 4 params required by Express
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ msg: err.message || 'Internal server error' });
});

// DB + Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000,
      () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error(err));