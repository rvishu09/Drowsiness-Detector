const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  timestamp:    { type: Date, default: Date.now },
  ear:          Number,
  mar:          Number,
  headTilt:     Number,
  fatigueScore: Number,
  isDrowsy:     Boolean,
  isYawning:    Boolean,
});

const sessionSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime:    { type: Date, default: Date.now },
  endTime:      Date,
  events:       [eventSchema],
  peakScore:    { type: Number, default: 0 },
  alertCount:   { type: Number, default: 0 },
});

module.exports = mongoose.model('Session', sessionSchema);