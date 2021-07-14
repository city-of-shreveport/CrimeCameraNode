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
  camera: { type: String, default: '' },
  hash: { type: String, default: '' },
  dateTime: { type: Date, default: Date.now },
  deletedAt: {
    type: Date,
    default: null,
  },

  // Default
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('videos', schema);
