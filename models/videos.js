const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const schema = mongoose.Schema({
  node: { type: String, default: '' },
  fileLocation: { type: String, default: '' },
  location: { lat: { type: Number, default: 0 }, lng: { type: Number, default: 0 } },
  startPts: { type: Number, default: 0 },
  startTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  bitRate: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  size: { type: Number, default: 0 },
  dateTime: Date,
  camera: { type: String, default: '' },
  deletionDate: {
    type: Date,
    default: new Date(+new Date() + 14 * 24 * 60 * 60 * 1000),
  },
  hash: { type: String, default: '' },

  // Default properties.
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('Videos', schema);
