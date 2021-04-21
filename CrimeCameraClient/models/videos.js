const mongoose = require('mongoose');

const schema = mongoose.Schema({
  node: String,
  nodeID: String,
  fileLocation: String,
  location: { lat: Number, lng: Number },
  start_pts: Number,
  start_time: Number,
  duration: Number,
  bit_rate: Number,
  height: Number,
  width: Number,
  size: Number,
  DateTime: Date,
  camera: String,
    deletionDate: {
    type: Date,
    default: new Date(+new Date() + 14*24*60*60*1000)
  }
});

module.exports = mongoose.model('Videos', schema);
