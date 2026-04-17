const Session = require('../models/Session');

exports.create = async (req, res) => {
  try {
    const session = await Session.create({
      user: req.user.id,
      ...req.body,
    });
    res.status(201).json(session);
  } catch (e) { res.status(500).json({ msg: e.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user.id })
      .sort({ startTime: -1 }).limit(20);
    res.json(sessions);
  } catch (e) { res.status(500).json({ msg: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const s = await Session.findOne({
      _id: req.params.id, user: req.user.id
    });
    if (!s) return res.status(404).json({ msg: 'Not found' });
    res.json(s);
  } catch (e) { res.status(500).json({ msg: e.message }); }
};