const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ msg: 'All fields are required' });

  if (password.length < 6)
    return res.status(400).json({ msg: 'Password must be at least 6 characters' });

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing)
    return res.status(400).json({ msg: 'Email already registered' });

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const token = signToken(user._id);
  return res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ msg: 'Email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user)
    return res.status(401).json({ msg: 'Invalid email or password' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch)
    return res.status(401).json({ msg: 'Invalid email or password' });

  const token = signToken(user._id);
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
};