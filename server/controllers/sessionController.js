const Session = require('../models/Session');

exports.create = async (req, res) => {
  const session = await Session.create({ user: req.user.id, ...req.body });
  return res.status(201).json(session);
};

exports.getAll = async (req, res) => {
  const sessions = await Session.find({ user: req.user.id })
    .sort({ startTime: -1 })
    .limit(20);
  return res.json(sessions);
};

exports.getById = async (req, res) => {
  const session = await Session.findOne({ _id: req.params.id, user: req.user.id });
  if (!session) return res.status(404).json({ msg: 'Not found' });
  return res.json(session);
};