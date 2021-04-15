const mongoose = require('mongoose');

const schema = mongoose.Schema({
  camera: String,
  upDated: { type: Date, default: Date.now },
  currentLoad: {
    avgLoad: Number,
    currentLoad: Number,
    currentLoadUser: Number,
    currentLoadSystem: Number,
  },
  cpus: {
    type: Map,
    of: String,
  },
  mem: { total: Number, free: Number, used: Number, available: Number },
  cpuTemperature: { main: Number },
  fsSize: [
    {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  ],
});

module.exports = mongoose.model('PerfMons', schema);
