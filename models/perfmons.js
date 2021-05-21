const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const schema = mongoose.Schema({
  node: {
    type: Schema.Types.ObjectId,
    ref: 'Nodes',
    required: true,
  },
  currentLoad: {
    avgLoad: { type: Number, default: 0 },
    currentLoad: { type: Number, default: 0 },
    currentLoadUser: { type: Number, default: 0 },
    currentLoadSystem: { type: Number, default: 0 },
  },
  cpus: {
    type: Map,
    of: { type: String, default: '' },
  },
  mem: {
    total: { type: Number, default: 0 },
    free: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    available: Number,
  },
  cpuTemperature: { main: Number },
  fsSize: [
    {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  ],

  // Default properties.
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

module.exports = mongoose.model('PerfMons', schema);
